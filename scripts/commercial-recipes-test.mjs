import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pptxgen from 'pptxgenjs';
import { readZip } from '../skills/themed-cn-pptx/lib/zip-reader.js';
import { createCommercialRecipe, commercialRecipes } from '../skills/themed-cn-pptx/recipes/recipe-commercial.mjs';
import { buildCommercialDemo } from '../examples/build_commercial_gallery.mjs';
const luminance = hex => {
 const v = hex.match(/../g).map(v => parseInt(v,16)/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4);
 return v[0]*.2126 + v[1]*.7152 + v[2]*.0722;
};
const dir = await mkdtemp(join(tmpdir(),'commercial-recipes-'));
try {
 for (const [id,t] of Object.entries(commercialRecipes)) {
  for (const [fg,bg] of [[t.ink,t.paper],[t.muted,t.paper],[t.accent,t.paper],[t.light,t.dark],[t.highlight,t.dark]]) {
    const l = [luminance(fg),luminance(bg)].sort((a,b)=>b-a);
    assert.ok((l[0]+.05)/(l[1]+.05)>=4.5, `${id} contrast: ${fg}/${bg}`);
  }
  const pres = new pptxgen(); buildCommercialDemo(pres,id);
  const file = join(dir,`${id}.pptx`); await pres.writeFile({fileName:file});
  const zip = readZip(await readFile(file));
  const slides = [...zip].filter(([p])=>/^ppt\/slides\/slide\d+\.xml$/.test(p));
  assert.equal(slides.length,8);
  assert.ok(slides.every(([,b])=>Buffer.from(b).toString().includes('<a:t>')),'Slides must contain editable text');
  const chart = Buffer.from(zip.get([...zip.keys()].find(p => /^ppt\/charts\/chart\d+\.xml$/.test(p)))).toString();
  assert.match(chart,/<c:barChart>/);
  assert.match(chart,/<c:v>68<\/c:v>/);
  assert.ok([...zip.keys()].some(p=>/embeddings\/.*xlsx$/.test(p)), 'Native chart must retain workbook');
 }
 const r = createCommercialRecipe(new pptxgen(),'investor-signal');
 assert.throws(()=>r.cover({title:'长标题'.repeat(100)}),/exceeds/);
 assert.throws(()=>r.agenda({title:'test',items:[]}),/requires/);
 assert.throws(()=>r.metrics({title:'test',stats:[{value:'1',label:'A'}],categories:['a','b'],values:[1,NaN],source:'demo'}),/finite/);
 assert.throws(()=>r.metrics({title:'test',stats:[{value:'1',label:'A'}],categories:['a','b'],values:[1,2]}),/source/);
 assert.throws(()=>r.comparison({title:'test',columns:['a','b'],rows:[{label:'A',values:['1']},{label:'B',values:['1','2']}]}),/two values/);
 console.log('Commercial recipes: 3 decks, native charts/workbooks, contrast, and invalid-content guards PASS');
} finally { await rm(dir,{recursive:true,force:true}); }
