import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import pptxgen from 'pptxgenjs';
import { readZip } from '../skills/themed-cn-pptx/lib/zip-reader.js';
import { parseSlide } from '../skills/themed-cn-pptx/lib/pptx-shapes.js';
import { createCommercialRecipe, commercialRecipes } from '../skills/themed-cn-pptx/recipes/recipe-commercial.mjs';
import { businessPalettes, resolveBusinessPalette } from '../skills/themed-cn-pptx/lib/business-palette.js';
import { buildBusinessElements } from '../examples/build_business_elements.mjs';
const dir=await mkdtemp(join(tmpdir(),'ppt-business-'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
try {
 for(const t of Object.values(commercialRecipes)) for(const palette of Object.keys(businessPalettes)) resolveBusinessPalette(t,palette);
 assert.throws(()=>resolveBusinessPalette(commercialRecipes['editorial-proposal'],'unknown'),/Unknown/);
 assert.throws(()=>resolveBusinessPalette(commercialRecipes['editorial-proposal'],{ink:'#FFFFFF'}),/contrast/);
 assert.throws(()=>resolveBusinessPalette(commercialRecipes['editorial-proposal'],{accent:'rgb(0,0,0)'}),/Invalid/);
 assert.throws(()=>resolveBusinessPalette(commercialRecipes['editorial-proposal'],{acccent:'000000'}),/roles/);
 assert.equal(resolveBusinessPalette(commercialRecipes['editorial-proposal'],{accent:'#a94413'}).accent,'A94413');
 for(const palette of ['navy-teal','burgundy-cream','graphite-orange']) {
  const pres=new pptxgen();buildBusinessElements(pres,{palette});const path=join(dir,`${palette}.pptx`);await pres.writeFile({fileName:path});
  const zip=readZip(await readFile(path));const slides=[...zip.keys()].filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p));assert.equal(slides.length,10);
  for(const file of slides) {
   const parsed=parseSlide(Buffer.from(zip.get(file)).toString());assert.ok(parsed.shapes.some(x=>x.text));assert.equal(parsed.pictures.length,0,'Default elements should be native editable geometry');
   for(const shape of parsed.shapes) {assert.ok(shape.x>=0&&shape.y>=0);assert.ok(shape.x+shape.w<=10.001&&shape.y+shape.h<=5.626);}
  }
  const funnel=parseSlide(Buffer.from(zip.get('ppt/slides/slide4.xml')).toString()).shapes.filter(s=>!s.text&&Math.abs(s.h-.34)<1e-6);
  assert.equal(funnel.length,4);[1,.64,.32,.12].forEach((fraction,i)=>near(funnel[i].w,4.6*fraction));
  const bars=parseSlide(Buffer.from(zip.get('ppt/slides/slide5.xml')).toString()).shapes.filter(s=>!s.text&&Math.abs(s.h-.22)<1e-6);
  assert.equal(bars.length,4);near(bars[0].w,6.2/6*2-.06);near(bars[2].w,6.2/6*3-.06);
 }
 const r=createCommercialRecipe(new pptxgen(),'editorial-proposal');
 assert.throws(()=>r.funnel({stages:[{value:10},{value:20},{value:5}],note:'source'}),/non-increasing/);
 assert.throws(()=>r.funnel({stages:[{value:0},{value:0},{value:0}],note:'source'}),/positive/);
 assert.throws(()=>r.funnel({stages:[{value:10},{value:5},{value:1}]}),/source/);
 assert.throws(()=>r.gantt({periods:['a','b','c','d'],tasks:[{start:0,end:4},{start:0,end:1},{start:1,end:2}]}),/indexes/);
 assert.throws(()=>r.quadrant({points:[{x:NaN,y:.2}],note:'source'}),/coordinates/);
 assert.throws(()=>r.team({people:[{}]}),/requires/);
 assert.throws(()=>r.testimonial({quote:'unsupported claim'}),/source/);
 // A zero final stage remains zero-width; do not invent a minimum-size bar.
 const zero=new pptxgen();const zr=createCommercialRecipe(zero,'editorial-proposal');
 zr.funnel({title:'Zero conversion',stages:[{label:'A',value:10},{label:'B',value:3},{label:'C',value:0}],note:'demo',page:1});
 const zeroPath=join(dir,'zero.pptx');await zero.writeFile({fileName:zeroPath});const z=readZip(await readFile(zeroPath));
 const zeroBars=parseSlide(Buffer.from(z.get('ppt/slides/slide1.xml')).toString()).shapes.filter(s=>!s.text&&Math.abs(s.h-.34)<1e-6);assert.equal(zeroBars.length,2);
 console.log(`Business elements: 10 native pages, proportional funnel/Gantt, ${Object.keys(businessPalettes).length * Object.keys(commercialRecipes).length} palette combinations, and invalid-input guards PASS`);
} finally {await rm(dir,{recursive:true,force:true});}
