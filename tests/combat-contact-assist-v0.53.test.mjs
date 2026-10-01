import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyContactAssist,computeContactAssist,armContactAssist,stepContactAssist,applyContactAssist,consumeContactAssist} from '../src/game/CombatContactAssist.js';
import {createCombatFlowRuntime,beginCombatFlowFrame,endCombatFlowFrame,takeCombatFlowPositionAssist,combatFlowAssistDebug} from '../src/game/CombatFlowRuntime.js';

const player=(x=0,extra={})=>({x,y:500,hp:320,onGround:true,facing:1,dash:0,dodgeWindow:0,airDashActive:0,reaction:{state:'ready'},recovery:{state:'ready'},combat:{attack:null,attackTime:0,counterWindow:0,parryTimer:0,queuedLight:false,...extra.combat},...extra});
const enemy=(x=190,extra={})=>({id:'e1',x,y:500,state:'idle',dead:false,...extra});
const data={range:160,damage:30,startup:.08,active:.1,recovery:.3,duration:.48,cancelStart:.27,cancelEnd:.47};
const raw=(pressed=[])=>({justPressed:a=>pressed.includes(a),isDown:()=>false,justReleased:()=>false});

test('assist is inactive when target is already in sweet spot',()=>{assert.equal(computeContactAssist({player:player(),target:enemy(110),action:'light',attack:'light',attackData:data}).active,false);});
test('assist nudges toward a near-forward target',()=>{const a=computeContactAssist({player:player(),target:enemy(180),action:'light',attack:'light',attackData:data});assert.equal(a.active,true);assert.ok(a.deltaX>0&&a.deltaX<=24);});
test('assist refuses distant magnetism',()=>{assert.equal(computeContactAssist({player:player(),target:enemy(300),action:'light',attack:'light',attackData:data}).active,false);});
test('assist refuses target clearly behind facing',()=>{assert.equal(computeContactAssist({player:player(),target:enemy(-120),action:'light',attack:'light',attackData:data}).active,false);});
test('assist is grounded attack only',()=>{assert.equal(computeContactAssist({player:player(0,{onGround:false}),target:enemy(180),action:'light',attack:'airLight',attackData:data}).active,false);});
test('heavy assist stays shorter than light',()=>{const l=computeContactAssist({player:player(),target:enemy(180),action:'light',attack:'light',attackData:data});const h=computeContactAssist({player:player(),target:enemy(180),action:'heavy',attack:'heavy',attackData:{...data,damage:80}});assert.ok(Math.abs(h.deltaX)<=14);assert.ok(Math.abs(l.deltaX)>=Math.abs(h.deltaX));});
test('boss target caps positional nudge',()=>{const a=computeContactAssist({player:player(),target:enemy(190,{type:'guardian'}),action:'light',attack:'light',attackData:data});assert.ok(Math.abs(a.deltaX)<=16);});
test('armed assist expires if not consumed',()=>{let s=armContactAssist(emptyContactAssist(),{player:player(),target:enemy(180),action:'light',attack:'light',attackData:data});s=stepContactAssist(s,.07);assert.equal(s.active,false);});
test('apply respects terrain discontinuity',()=>{const s=armContactAssist(emptyContactAssist(),{player:player(),target:enemy(180),action:'light',attack:'light',attackData:data});const r=applyContactAssist(player(),s,{terrainFn:x=>x>10?700:500});assert.equal(r.applied,false);});
test('apply returns copied player with tiny forward adjustment',()=>{const s=armContactAssist(emptyContactAssist(),{player:player(),target:enemy(180),action:'light',attack:'light',attackData:data});const r=applyContactAssist(player(),s,{terrainFn:()=>500});assert.equal(r.applied,true);assert.ok(r.player.x>0);});
test('consume makes assist one-shot',()=>{const s=consumeContactAssist({active:true,ttl:.05,deltaX:10,consumed:false});assert.equal(s.active,false);assert.equal(s.consumed,true);});
test('unified runtime arms assist only after accepted attack',()=>{let r=createCombatFlowRuntime();let b=beginCombatFlowFrame(r,raw(['light']),.016,{player:player(),attackData:data,enemies:[enemy(180)]});const after=player(0,{combat:{attack:'light',attackTime:.01}});r=endCombatFlowFrame(b.runtime,player(),after,{attackData:data});assert.equal(combatFlowAssistDebug(r).active,true);});
test('unified take applies and consumes same assist serial',()=>{let r=createCombatFlowRuntime();let b=beginCombatFlowFrame(r,raw(['light']),.016,{player:player(),attackData:data,enemies:[enemy(180)]});const after=player(0,{combat:{attack:'light',attackTime:.01}});r=endCombatFlowFrame(b.runtime,player(),after,{attackData:data});const t=takeCombatFlowPositionAssist(r,after,{terrainFn:()=>500});assert.equal(t.applied,true);assert.equal(combatFlowAssistDebug(t.runtime).active,false);});
test('empty assist debug remains inert',()=>{assert.deepEqual(combatFlowAssistDebug(createCombatFlowRuntime()),{active:false,ttl:0,deltaX:0,targetId:null,serial:0,consumed:false});});
