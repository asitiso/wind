import test from 'node:test';import assert from 'node:assert/strict';
import {emptyCombatMoment,beginCombatMoment,combatMomentCameraOptions,cueMomentType,combatMomentVisual} from '../src/game/CombatMomentDirector.js';

test('counter cue maps',()=>assert.equal(cueMomentType('COUNTER · punish'),'counter'));
test('memory counter cue maps',()=>assert.equal(cueMomentType('MEMORY COUNTER · chain'),'memoryCounter'));
test('boss break cue maps',()=>assert.equal(cueMomentType('BOSS BREAK · core exposed'),'bossBreak'));
test('guard break is not boss break',()=>assert.notEqual(cueMomentType('GUARD BREAK · dodge'), 'bossBreak'));
test('execution cue maps',()=>assert.equal(cueMomentType('EXECUTION · finish'),'execution'));
test('finish ready stays a prompt rather than firing execution presentation',()=>assert.equal(cueMomentType('FINISH READY · E 처형'),null));
test('final strike wins before generic execution',()=>assert.equal(cueMomentType('FINAL STRIKE · 별의 핵을 끊어낸다'),'finalStrike'));
test('final strike can overwrite boss break',()=>{let s=beginCombatMoment(emptyCombatMoment(),'bossBreak');s=beginCombatMoment(s,'finalStrike');assert.equal(s.type,'finalStrike');});
test('boss break cannot overwrite final strike',()=>{let s=beginCombatMoment(emptyCombatMoment(),'finalStrike');const b=beginCombatMoment(s,'bossBreak');assert.equal(b.type,'finalStrike');});
test('execution camera zoom is stronger than parry',()=>{const e=combatMomentCameraOptions({...beginCombatMoment(emptyCombatMoment(),'execution'),time:.08});const p=combatMomentCameraOptions({...beginCombatMoment(emptyCombatMoment(),'parry'),time:.05});assert.ok(e.zoomBias>p.zoomBias);});
test('final strike visual is strongest flash',()=>{const s={...beginCombatMoment(emptyCombatMoment(),'finalStrike'),time:.12};assert.ok(combatMomentVisual(s).flash>.35);});
test('counter budget remains bounded',()=>{const s={...beginCombatMoment(emptyCombatMoment(),'counter'),time:.05};assert.ok(combatMomentVisual(s).particleBudget<=96);});
test('memory counter outranks counter',()=>{let s=beginCombatMoment(emptyCombatMoment(),'counter');s=beginCombatMoment(s,'memoryCounter');assert.equal(s.type,'memoryCounter');});
test('final strike duration longer than execution',()=>{const f=beginCombatMoment(emptyCombatMoment(),'finalStrike');const e=beginCombatMoment(emptyCombatMoment(),'execution');assert.ok(f.duration>e.duration);});
test('camera follow multiplier remains modest',()=>{const c=combatMomentCameraOptions({...beginCombatMoment(emptyCombatMoment(),'finalStrike'),time:.12});assert.ok(c.followMultiplier<=1.24);});
test('zoom bias remains under five percent',()=>{const c=combatMomentCameraOptions({...beginCombatMoment(emptyCombatMoment(),'finalStrike'),time:.12});assert.ok(c.zoomBias<=.05);});
