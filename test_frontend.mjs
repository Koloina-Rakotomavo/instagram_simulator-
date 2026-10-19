import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');

test('le JavaScript du simulateur est valide',()=>{
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(match,'Le script de la page doit exister');
 assert.doesNotThrow(()=>new vm.Script(match[1],{filename:'index.html-inline.js'}));
});

test('les fonctions mobiles et les imports sont présents',()=>{
 for(const id of ['importUrl','instagramJson','repairImages','imagesMobile','grid','apiEndpoint','testApi']){
  assert.ok(html.includes('id="'+id+'"'),'Contrôle manquant : '+id);
 }
 for(const signature of ['function move(','function normalizeExternalData(','function readImage(','replace-photo-label']){
  assert.ok(html.includes(signature),'Fonctionnalité manquante : '+signature);
 }
});

test('aucun jeton Apify n’est codé en dur dans le HTML',()=>{
 assert.ok(!html.includes('apify_api_'),'Ne jamais embarquer un jeton API dans GitHub Pages');
});

test('le proxy image ne traite que les CDN Instagram et conserve les paramètres de signature',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
 const fn=script.match(/function publicImageProxy\(url\)\{[\s\S]*?\n\}/)?.[0];
 assert.ok(fn,'Fonction proxy introuvable');
 const context={URL,encodeURIComponent};
 const proxy=vm.runInNewContext(fn+'\npublicImageProxy',context);
 const original='https://scontent-fra3-2.cdninstagram.com/v/t51/a.jpg?oh=a123&oe=42';
 const value=proxy(original);
 assert.ok(value.startsWith('https://wsrv.nl/?url='),'Le proxy doit être activé');
 assert.ok(value.includes(encodeURIComponent(original)),'Le lien signé doit être encodé en entier');
 assert.equal(proxy('https://example.org/image.jpg'),'','Ne pas transférer des domaines arbitraires');
 assert.equal(proxy('http://scontent-fra3-2.cdninstagram.com/a.jpg'),'','Exiger HTTPS');
});
