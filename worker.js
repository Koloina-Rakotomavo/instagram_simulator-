/**
 * Studio Feed — Cloudflare Worker (module syntax).
 * Secrets Cloudflare Worker: APIFY_TOKEN, IMPORT_PASSCODE.
 * Variable facultative : SITE_ORIGIN, ex. https://mon-compte.github.io
 * L'import est un SERVICE OPTIONNEL et consomme l'API Apify.
 * Les comptes privés ne sont pas pris en charge.
 */
const PROFILE_ACTOR='apify~instagram-profile-scraper';
const POSTS_ACTOR='apify~instagram-scraper';

function headersFor(request,env){
  const origin=request.headers.get('Origin')||'';
  const expected=(env.SITE_ORIGIN||'').trim().replace(/\/$/,'');
  const allowed=!expected||origin===expected||(!origin&&request.method==='GET');
  return {
    'Access-Control-Allow-Origin':allowed?(expected||'*'):'null',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type, X-Studio-Code',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin',
    'X-Content-Type-Options':'nosniff',
    'Cache-Control':'no-store'
  };
}
function json(data,status,h){return new Response(JSON.stringify(data),{status,headers:{...h,'Content-Type':'application/json; charset=utf-8'}})}
function isAllowedImage(url){
  try{
    const u=new URL(url);
    if(u.protocol!=='https:'||u.port||u.username||u.password)return false;
    const host=u.hostname.toLowerCase();
    return host==='cdninstagram.com'||host.endsWith('.cdninstagram.com')||host==='fbcdn.net'||host.endsWith('.fbcdn.net')||host==='instagram.com'||host.endsWith('.instagram.com');
  }catch{return false}
}
function isSafeBrowserImage(url){return typeof url==='string'&&url.startsWith('https://')}
function pick(...a){return a.find(isSafeBrowserImage)||''}
function compactPost(post){
  if(!post||typeof post!=='object')return null;
  const main=post.image_versions2?.candidates?.[0]?.url||post.imageVersions2?.candidates?.[0]?.url;
  const side=post.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url;
  const image=pick(post.displayUrl,post.imageUrl,post.thumbnailSrc,post.thumbnailUrl,
    typeof post.images?.[0]==='string'?post.images[0]:null,main,side,post.src);
  if(!image)return null;
  let type='post';const mediaType=String(post.type||post.mediaType||post.__typename||'').toLowerCase();
  if(mediaType.includes('carousel')||mediaType.includes('sidecar')||post.childPosts?.length>1)type='carousel';
  else if(post.isVideo||mediaType.includes('video')||String(post.productType).toLowerCase()==='clips')type='reel';
  return {displayUrl:image,type,shortCode:post.shortCode||post.shortcode||'',caption:String(post.caption||'').slice(0,150),url:post.url||post.postUrl||'',timestamp:post.timestamp||post.takenAt||''};
}
async function actor(name,input,env){
  const url=`https://api.apify.com/v2/actors/${name}/run-sync-get-dataset-items?timeout=90`;
  let response;
  try{
    response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${env.APIFY_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(100000)});
  }catch(e){throw new Error('Le fournisseur Instagram est temporairement inaccessible. Réessaie.')}
  if(!response.ok){
    if(response.status===402)throw new Error('Le crédit Apify est insuffisant.');
    if(response.status===401||response.status===403)throw new Error('La clé Apify du Worker est invalide.');
    if(response.status===408)throw new Error('Le fournisseur Instagram a dépassé son délai de réponse.');
    if(response.status===429)throw new Error('Le fournisseur limite actuellement les requêtes.');
    throw new Error('Le fournisseur a refusé la requête ('+response.status+').');
  }
  let data;try{data=await response.json()}catch{throw new Error('Réponse du fournisseur illisible.')}
  return Array.isArray(data)?data:(data?.items||[]);
}
async function importProfile(request,env,h){
  if(!env.APIFY_TOKEN)return json({error:'APIFY_TOKEN est manquant sur le Worker.'},503,h);
  let payload;try{payload=await request.json()}catch{return json({error:'JSON invalide.'},400,h)}
  const username=String(payload.username||'').trim();
  const limit=Number(payload.limit||12);
  if(!/^[A-Za-z0-9._]{1,30}$/.test(username)||!Number.isInteger(limit)||limit<1||limit>36)return json({error:'Profil ou quantité invalide (max. 36).'},400,h);
  try{
    // Les résultats peuvent être partiels lorsque l'accès public Instagram est limité.
    const profilePromise=actor(PROFILE_ACTOR,{usernames:[username]},env);
    const postsPromise=limit>12?actor(POSTS_ACTOR,{directUrls:[`https://www.instagram.com/${username}/`],resultsType:'posts',resultsLimit:limit},env).catch(()=>[]):Promise.resolve([]);
    const [profiles,postResults]=await Promise.all([profilePromise,postsPromise]);
    const profile=profiles.find(v=>v?.username?.toLowerCase()===username.toLowerCase())||profiles[0];
    if(!profile||profile.error)return json({error:'Profil introuvable ou inaccessible publiquement.'},404,h);
    if(profile.private===true||profile.isPrivate===true)return json({error:'Ce profil Instagram est privé. Import impossible.'},403,h);
    const all=[...postResults,...(profile.latestPosts||[])].map(compactPost).filter(Boolean);
    const known=new Set();const posts=[];
    for(const p of all){const id=p.shortCode||p.url||p.displayUrl;if(known.has(id))continue;known.add(id);posts.push(p);if(posts.length>=limit)break}
    if(!posts.length)return json({error:'Aucune publication avec image publique n’a pu être récupérée.'},404,h);
    return json({username:profile.username||username,fullName:profile.fullName||'',biography:profile.biography||'',followersCount:profile.followersCount??null,followsCount:profile.followsCount??null,postsCount:profile.postsCount??null,private:false,profilePicUrl:pick(profile.profilePicUrlHD,profile.profilePicUrl),posts},200,h);
  }catch(e){return json({error:e.message||'Échec de récupération.'},502,h)}
}
async function media(request,h){
  const link=new URL(request.url).searchParams.get('url');
  if(!link||!isAllowedImage(link))return json({error:'Domaine d’image non autorisé.'},400,h);
  let source=link;
  try{
    let res;
    for(let i=0;i<3;i++){
      res=await fetch(source,{redirect:'manual',headers:{'Accept':'image/avif,image/webp,image/jpeg,image/png,image/*;q=0.8'},signal:AbortSignal.timeout(15000)});
      if([301,302,303,307,308].includes(res.status)){
        const location=res.headers.get('Location');if(!location)return json({error:'Redirection sans destination.'},502,h);
        source=new URL(location,source).href;
        if(!isAllowedImage(source))return json({error:'Redirection interdite.'},403,h);
        continue;
      }
      break;
    }
    if(!res?.ok)return json({error:'Image distante inaccessible.'},502,h);
    const mime=(res.headers.get('Content-Type')||'').split(';')[0].toLowerCase();
    if(!['image/jpeg','image/png','image/webp','image/avif'].includes(mime))return json({error:'Le contenu distant n’est pas une image.'},400,h);
    if(Number(res.headers.get('Content-Length')||0)>8000000)return json({error:'Image trop volumineuse.'},413,h);
    const body=await res.arrayBuffer();
    if(body.byteLength>8000000)return json({error:'Image trop volumineuse.'},413,h);
    return new Response(body,{status:200,headers:{...h,'Content-Type':mime,'Cache-Control':'private, max-age=300'}});
  }catch{return json({error:'Téléchargement de l’image impossible.'},502,h)}
}
export default {
  async fetch(request,env){
    const h=headersFor(request,env);
    const origin=request.headers.get('Origin');
    if(env.SITE_ORIGIN&&origin&&origin!==env.SITE_ORIGIN.trim().replace(/\/$/,''))return json({error:'Origine non autorisée.'},403,h);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:h});
    const url=new URL(request.url);
    if(url.pathname==='/health'&&request.method==='GET')return json({status:'ready',apifyConfigured:!!env.APIFY_TOKEN,accessConfigured:!!env.IMPORT_PASSCODE},200,h);
    if(!env.IMPORT_PASSCODE)return json({error:'IMPORT_PASSCODE doit être configuré sur le Worker.'},503,h);
    if(request.headers.get('X-Studio-Code')!==env.IMPORT_PASSCODE)return json({error:'Code d’accès invalide ou manquant.'},401,h);
    if(url.pathname==='/api/import'&&request.method==='POST')return importProfile(request,env,h);
    if(url.pathname==='/api/media'&&request.method==='GET')return media(request,h);
    return json({error:'Route inexistante.'},404,h);
  }
};