import test from 'node:test';import assert from 'node:assert/strict';
import {createCombatFeelRuntime,stepCombatFeelRuntime,combatFeelCameraOptions} from '../src/game/CombatFeelIntegration.js';

test('runtime starts inactive',()=>assert.equal(createCombatFeelRuntime().moment.type,null));
test('cue drives perfect dodge',()=>{const r=stepCombatFeelRuntime(createCombatFeelRuntime(),.016,{cue:'PERFECT DODGE · J COUNTER'});assert.equal(r.moment.type,'perfectDodge');});
test('same cue advances rather than restarts',()=>{let r=stepCombatFeelRuntime(createCombatFeelRuntime(),.016,{cue:'PERFECT DODGE'});const serial=r.moment.serial;r=stepCombatFeelRuntime(r,.10,{cue:'PERFECT DODGE'});assert.equal(r.moment.serial,serial);assert.ok(r.moment.time>.09);});
test('new stronger cue upgrades moment',()=>{let r=stepCombatFeelRuntime(createCombatFeelRuntime(),.01,{cue:'PERFECT DODGE'});r=stepCombatFeelRuntime(r,.01,{cue:'FINAL STRIKE'});assert.equal(r.moment.type,'finalStrike');});
test('runtime camera options are neutral inactive',()=>assert.deepEqual(combatFeelCameraOptions(createCombatFeelRuntime()),{zoomBias:0,followMultiplier:1}));
test('runtime does not carry save-shaped data',()=>{const r=createCombatFeelRuntime();assert.equal('world' in r,false);assert.equal('player' in r,false);assert.equal('save' in r,false);});
