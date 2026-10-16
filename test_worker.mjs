import fs from 'node:fs';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('./worker.js',import.meta.url),'utf8');
const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const env={APIFY_TOKEN:'token-test',IMPORT_PASSCODE:'code-test',SITE_ORIGIN:'https://exemple.github.io'};
let calls=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 calls.push(url);
 if(url.includes('instagram-profile-scraper'))return Response.json([{
  username:'test_public',fullName:'Studio',followersCount:150,followsCount:20,biography:'Bienvenue',private:false,profilePicUrl:'https://scontent.cdninstagram.com/avatar.jpg',latestPosts:[{displayUrl:'https://scontent.cdninstagram.com/a.jpg',shortCode:'A1'}]
 }]);
 if(url.includes('instagram-scraper'))return Response.json([{displayUrl:'https://scontent.cdninstagram.com/a.jpg',shortCode:'A1'},{displayUrl:'https://scontent.cdninstagram.com/b.jpg',shortCode:'B2',isVideo:true}]);
 throw Error('unexpected url');
};
const mk=(username='test_public',limit=24,code='code-test')=>new Request('https://proxy.workers.dev/api/import',{method:'POST',headers:{'Origin':'https://exemple.github.io','Content-Type':'application/json','X-Studio-Code':code},body:JSON.stringify({username,limit})});
let resp=await worker.fetch(mk(),env);let obj=await resp.json();
assert.equal(resp.status,200);assert.equal(obj.posts.length,2);assert.equal(obj.posts[1].type,'reel');
resp=await worker.fetch(mk('test_public',12),env);obj=await resp.json();
assert.equal(resp.status,200);assert.equal(obj.posts.length,1);
resp=await worker.fetch(mk('test_public',12,'mauvais'),env);assert.equal(resp.status,401);
resp=await worker.fetch(new Request('https://proxy.workers.dev/api/media?url='+encodeURIComponent('https://evil.com/file.jpg'),{headers:{Origin:'https://exemple.github.io','X-Studio-Code':'code-test'}}),env);assert.equal(resp.status,400);
resp=await worker.fetch(new Request('https://proxy.workers.dev/health',{headers:{Origin:'https://exemple.github.io'}}),env);assert.equal(resp.status,200);
globalThis.fetch=originalFetch;
console.log('Worker: validation, normalisation, sécurité basique : OK');