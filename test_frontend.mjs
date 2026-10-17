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
