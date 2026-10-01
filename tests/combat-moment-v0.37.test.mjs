import test from 'node:test';import assert from 'node:assert/strict';
import {emptyCombatMoment,beginCombatMoment,stepCombatMoment,combatMomentStrength,combatMomentVisual,cueMomentType,applyCueDrivenMoment,combatMomentInvariant} from '../src/game/CombatMomentDirector.js';

test('empty state is inactive',()=>assert.equal(emptyCombatMoment().type,null));
test('perfect dodge begins with profile duration',()=>{const s=beginCombatMoment(emptyCombatMoment(),'perfectDodge');assert.equal(s.type,'perfectDodge');assert.equal(s.duration,.42);});
test('star step has higher serial after retrigger',()=>{const a=beginCombatMoment(emptyCombatMoment(),'perfectDodge');const b=beginCombatMoment(a,'starStep');assert.equal(b.serial,2);});
test('weak moment cannot overwrite active parry',()=>{const a=beginCombatMoment(emptyCombatMoment(),'parry');const b=beginCombatMoment(a,'perfectDodge');assert.equal(b.type,'parry');});
test('higher priority parry can overwrite dodge',()=>{const a=beginCombatMoment(emptyCombatMoment(),'perfectDodge');const b=beginCombatMoment(a,'parry');assert.equal(b.type,'parry');});
test('moment expires to null',()=>{const a=beginCombatMoment(emptyCombatMoment(),'parry');const b=stepCombatMoment(a,1);assert.equal(b.type,null);});
test('strength rises above zero near start',()=>{const a=stepCombatMoment(beginCombatMoment(emptyCombatMoment(),'perfectDodge'),.05);assert.ok(combatMomentStrength(a)>.5);});
test('visual exposes particle budget',()=>{const a=stepCombatMoment(beginCombatMoment(emptyCombatMoment(),'starParry'),.05);assert.equal(combatMomentVisual(a).particleBudget,80);});
test('perfect dodge cue maps',()=>assert.equal(cueMomentType('PERFECT DODGE · J COUNTER'),'perfectDodge'));
test('star step cue maps',()=>assert.equal(cueMomentType('STAR STEP · J BLINK COUNTER'),'starStep'));
test('perfect parry cue maps',()=>assert.equal(cueMomentType('PERFECT PARRY · J COUNTER'),'parry'));
test('star parry cue maps',()=>assert.equal(cueMomentType('STAR PARRY · J BLINK COUNTER'),'starParry'));
test('same cue does not retrigger',()=>{const a=applyCueDrivenMoment(emptyCombatMoment(),'','PERFECT DODGE');const b=applyCueDrivenMoment(a.state,a.lastCue,'PERFECT DODGE');assert.equal(b.triggered,null);assert.equal(b.state.serial,a.state.serial);});
test('unknown cue stays inactive',()=>{const r=applyCueDrivenMoment(emptyCombatMoment(),'','LANDMARK');assert.equal(r.state.type,null);});
test('active state satisfies invariant',()=>{const s=stepCombatMoment(beginCombatMoment(emptyCombatMoment(),'parry'),.1);assert.equal(combatMomentInvariant(s),true);});
