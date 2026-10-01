import test from 'node:test';import assert from 'node:assert/strict';
import {emptyCombatMoment,beginCombatMoment} from '../src/game/CombatMomentDirector.js';
import {renderCombatMomentOverlay} from '../src/game/CombatMomentOverlay.js';
function fakeCanvas(){
  const calls=[];const grad={addColorStop(...a){calls.push(['stop',...a]);}};
  const ctx={calls,globalCompositeOperation:'source-over',fillStyle:'',strokeStyle:'',lineWidth:1,
    save(){calls.push(['save']);},restore(){calls.push(['restore']);},fillRect(...a){calls.push(['fillRect',...a]);},
    createRadialGradient(...a){calls.push(['gradient',...a]);return grad;},beginPath(){calls.push(['begin']);},arc(...a){calls.push(['arc',...a]);},stroke(){calls.push(['stroke']);}};
  return {width:1920,height:1080,getContext(){return ctx;},ctx};
}
test('inactive overlay draws nothing',()=>{const c=fakeCanvas();assert.equal(renderCombatMomentOverlay(c,emptyCombatMoment()),false);assert.equal(c.ctx.calls.length,0);});
test('active dodge overlay draws',()=>{const c=fakeCanvas();const s={...beginCombatMoment(emptyCombatMoment(),'perfectDodge'),time:.08};assert.equal(renderCombatMomentOverlay(c,s),true);assert.ok(c.ctx.calls.some(x=>x[0]==='fillRect'));});
test('parry draws a ring',()=>{const c=fakeCanvas();const s={...beginCombatMoment(emptyCombatMoment(),'parry'),time:.055};renderCombatMomentOverlay(c,s);assert.ok(c.ctx.calls.some(x=>x[0]==='arc'));});
test('final strike draws double ring',()=>{const c=fakeCanvas();const s={...beginCombatMoment(emptyCombatMoment(),'finalStrike'),time:.12};renderCombatMomentOverlay(c,s);assert.ok(c.ctx.calls.filter(x=>x[0]==='arc').length>=2);});
test('reduced motion suppresses rings',()=>{const c=fakeCanvas();const s={...beginCombatMoment(emptyCombatMoment(),'finalStrike'),time:.12};renderCombatMomentOverlay(c,s,{reducedMotion:true});assert.equal(c.ctx.calls.filter(x=>x[0]==='arc').length,0);});
test('overlay saves and restores context',()=>{const c=fakeCanvas();const s={...beginCombatMoment(emptyCombatMoment(),'parry'),time:.05};renderCombatMomentOverlay(c,s);assert.equal(c.ctx.calls[0][0],'save');assert.equal(c.ctx.calls.at(-1)[0],'restore');});
test('overlay uses screen blend for flash',()=>{const c=fakeCanvas();const s={...beginCombatMoment(emptyCombatMoment(),'starStep'),time:.08};renderCombatMomentOverlay(c,s);assert.equal(c.ctx.globalCompositeOperation,'source-over');assert.ok(c.ctx.calls.some(x=>x[0]==='fillRect'));});
test('missing canvas context fails safely',()=>assert.equal(renderCombatMomentOverlay({width:1,height:1,getContext(){return null;}},{type:'parry',time:.1,duration:.34}),false));
test('missing canvas fails safely',()=>assert.equal(renderCombatMomentOverlay(null,{type:'parry',time:.1,duration:.34}),false));
