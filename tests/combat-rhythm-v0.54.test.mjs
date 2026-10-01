import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyCombatRhythm,stepCombatRhythm,recordRhythmAction,registerRhythmHit,rhythmRecoveryBonus} from '../src/game/CombatRhythmDirector.js';
import {emptyHitConfirm,registerHitConfirm} from '../src/game/CombatHitConfirm.js';
import {recoveryCancelTrim} from '../src/game/CombatRecoveryTuner.js';
import {createCombatFlowRuntime,registerCombatFlowHit,combatFlowRhythmDebug,beginCombatFlowFrame,endCombatFlowFrame} from '../src/game/CombatFlowRuntime.js';

const data={startup:.08,active:.1,recovery:.3,cancelStart:.27,cancelEnd:.47,duration:.48,damage:28};
const player=(extra={})=>({x:0,y:500,hp:320,onGround:true,facing:1,dash:0,dodgeWindow:0,airDashActive:0,reaction:{state:'ready'},recovery:{state:'ready'},combat:{attack:null,attackTime:0,counterWindow:0,parryTimer:0,queuedLight:false,...extra.combat},...extra});
const raw=(pressed=[])=>({justPressed:a=>pressed.includes(a),isDown:()=>false,justReleased:()=>false});

test('rhythm starts neutral',()=>{assert.equal(rhythmRecoveryBonus(emptyCombatRhythm(),'light'),0);});
test('offensive hit raises tempo',()=>{const h=registerHitConfirm(emptyHitConfirm(),{damage:30});const r=registerRhythmHit(emptyCombatRhythm(),h);assert.ok(r.tempo>0);assert.equal(r.ttl,.72);});
test('guard contact barely raises tempo',()=>{const h=registerHitConfirm(emptyHitConfirm(),{guarded:true});const r=registerRhythmHit(emptyCombatRhythm(),h);assert.ok(r.tempo<=.03);});
test('same hit serial is not double counted',()=>{const h=registerHitConfirm(emptyHitConfirm(),{damage:30});let r=registerRhythmHit(emptyCombatRhythm(),h);const t=r.tempo;r=registerRhythmHit(r,h);assert.equal(r.tempo,t);});
test('rhythm decays and clears streak after grace',()=>{let r={...emptyCombatRhythm(),tempo:.7,ttl:.1,streak:3,lastAction:'light'};r=stepCombatRhythm(r,.2);assert.equal(r.streak,0);assert.equal(r.lastAction,null);assert.ok(r.tempo<.7);});
test('varied accepted attacks build streak without rewarding same-button spam',()=>{let r={...emptyCombatRhythm(),tempo:.5,ttl:.5};r=recordRhythmAction(r,'light',true);const a=r.streak;r=recordRhythmAction(r,'light',true);assert.equal(r.streak,a);r=recordRhythmAction(r,'heavy',true);assert.ok(r.streak>a);});
test('light gets small rhythm recovery bonus only at real tempo',()=>{const r={...emptyCombatRhythm(),tempo:.8,ttl:.5,streak:2};const b=rhythmRecoveryBonus(r,'light');assert.ok(b>0&&b<=.009);});
test('heavy rhythm bonus stays tightly capped',()=>{const r={...emptyCombatRhythm(),tempo:1,ttl:.5,streak:5};assert.ok(rhythmRecoveryBonus(r,'heavy')<=.004);});
test('skill attacks receive no rhythm trim',()=>{const r={...emptyCombatRhythm(),tempo:1,ttl:.5,streak:5};assert.equal(rhythmRecoveryBonus(r,'ultimateSkill'),0);});
test('recovery tuner remains unchanged when rhythm boost is zero',()=>{assert.equal(recoveryCancelTrim('light',data,{rhythmBoost:0}),recoveryCancelTrim('light',data,{}));});
test('recovery tuner accepts bounded rhythm boost',()=>{const base=recoveryCancelTrim('light',data,{});const boosted=recoveryCancelTrim('light',data,{rhythmBoost:.009});assert.ok(boosted>=base);assert.ok(boosted<=.042);});
test('unified hit registration drives rhythm',()=>{let r=createCombatFlowRuntime();r=registerCombatFlowHit(r,{attack:'light',damage:30});assert.ok(combatFlowRhythmDebug(r).tempo>0);});
test('accepted unified attack records rhythm action',()=>{let r=createCombatFlowRuntime();r=registerCombatFlowHit(r,{attack:'light',damage:30});const b=beginCombatFlowFrame(r,raw(['light']),.016,{player:player(),attackData:data});const after=player({combat:{attack:'light',attackTime:.01}});r=endCombatFlowFrame(b.runtime,player(),after,{attackData:data});assert.equal(combatFlowRhythmDebug(r).lastAction,'light');});
test('rhythm runtime is transient and reset with combat flow',async()=>{const {resetCombatFlowRuntime}=await import('../src/game/CombatFlowRuntime.js');let r=createCombatFlowRuntime();r=registerCombatFlowHit(r,{attack:'light',damage:30});r=resetCombatFlowRuntime(r,'transition');assert.equal(combatFlowRhythmDebug(r).tempo,0);});
