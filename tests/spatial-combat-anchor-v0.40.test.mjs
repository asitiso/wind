import test from 'node:test';import assert from 'node:assert/strict';
import {projectWorldToScreen,clampCombatAnchor,combatMomentWorldAnchor,resolveCombatMomentAnchor,anchorDisplacementFromCenter} from '../src/game/SpatialCombatAnchor.js';
import {emptyCombatMoment,beginCombatMoment} from '../src/game/CombatMomentDirector.js';
import {renderCombatMomentOverlay} from '../src/game/CombatMomentOverlay.js';
const canvas={width:1920,height:1080};
function fakeCanvas(){const calls=[];const grad={addColorStop(){}};const ctx={calls,save(){},restore(){},fillRect(){},createRadialGradient(...a){calls.push(['grad',...a]);return grad;},beginPath(){},arc(...a){calls.push(['arc',...a]);},stroke(){},globalCompositeOperation:'source-over'};return {...canvas,getContext(){return ctx;},ctx};}
test('projection identity at zoom 1',()=>assert.deepEqual(projectWorldToScreen({x:500,y:300},{x:100,y:50,zoom:1},canvas),{x:400,y:250}));
test('projection zooms around center',()=>{const p=projectWorldToScreen({x:960,y:540},{x:0,y:0,zoom:.9},canvas);assert.equal(Math.round(p.x),960);assert.equal(Math.round(p.y),540);});
test('clamp keeps point inside safe region',()=>{const p=clampCombatAnchor({x:-40,y:2000},canvas);assert.ok(p.x>0&&p.y<1080);});
test('perfect dodge anchors player',()=>assert.equal(combatMomentWorldAnchor('perfectDodge',{player:{x:100,y:500},target:{x:900,y:500}}).x,100));
test('parry anchors player',()=>assert.equal(combatMomentWorldAnchor('parry',{player:{x:120,y:500},target:{x:900,y:500}}).x,120));
test('boss break anchors target',()=>assert.equal(combatMomentWorldAnchor('bossBreak',{player:{x:120,y:500},target:{x:900,y:500}}).x,900));
test('execution anchors target',()=>assert.equal(combatMomentWorldAnchor('execution',{player:{x:120,y:500},target:{x:910,y:500}}).x,910));
test('counter anchors midpoint',()=>assert.equal(combatMomentWorldAnchor('counter',{player:{x:100,y:500},target:{x:300,y:500}}).x,200));
test('missing target falls back to player',()=>assert.equal(combatMomentWorldAnchor('finalStrike',{player:{x:100,y:500}}).x,100));
test('resolve returns clamped screen anchor',()=>{const p=resolveCombatMomentAnchor('finalStrike',{target:{x:3000,y:600},camera:{x:0,y:0,zoom:1},canvas});assert.ok(p.x<=canvas.width*.925+1);});
test('fallback uses center',()=>{const p=resolveCombatMomentAnchor(null,{canvas});assert.equal(p.x,960);assert.equal(p.y,540);});
test('displacement center is zero',()=>assert.deepEqual(anchorDisplacementFromCenter({x:960,y:540},canvas),{x:0,y:0,magnitude:0}));
test('overlay ring uses supplied anchor',()=>{const c=fakeCanvas(),s={...beginCombatMoment(emptyCombatMoment(),'parry'),time:.05};renderCombatMomentOverlay(c,s,{anchor:{x:320,y:440}});const a=c.ctx.calls.find(v=>v[0]==='arc');assert.equal(a[1],320);assert.equal(a[2],440);});
test('overlay gradient uses supplied anchor',()=>{const c=fakeCanvas(),s={...beginCombatMoment(emptyCombatMoment(),'parry'),time:.05};renderCombatMomentOverlay(c,s,{anchor:{x:321,y:441}});const g=c.ctx.calls.find(v=>v[0]==='grad');assert.equal(g[1],321);assert.equal(g[2],441);});

test('custom projector can match renderer-specific transform',()=>{const p=resolveCombatMomentAnchor('parry',{player:{x:10,y:20},canvas,projector:()=>({x:777,y:333})});assert.equal(p.x,777);assert.equal(p.y,333);});
