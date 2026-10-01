import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyCounterBridge,counterKindFromMoment,preferredCounterAction,armCounterBridge,stepCounterBridge,counterInputPriority,consumeCounterBridge,counterComboSource,counterBridgeSnapshot} from '../src/game/CombatCounterBridge.js';

test('empty counter bridge inert',()=>assert.equal(emptyCounterBridge().kind,null));
test('parry moment maps parry kind',()=>assert.equal(counterKindFromMoment('starParry'),'parry'));
test('perfect dodge maps dodge kind',()=>assert.equal(counterKindFromMoment('perfectDodge'),'dodge'));
test('parry prefers heavy',()=>assert.equal(preferredCounterAction('parry'),'heavy'));
test('dodge prefers light',()=>assert.equal(preferredCounterAction('dodge'),'light'));
test('bridge arms only with positive counter window',()=>{assert.equal(armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:0}).kind,null);assert.equal(armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.5}).kind,'parry');});
test('same active kind does not spam serial',()=>{let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.4});const serial=s.serial;s=armCounterBridge(s,{momentType:'parry',counterWindow:.3});assert.equal(s.serial,serial);});
test('parry priority starts heavy',()=>{const s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.4});assert.equal(counterInputPriority(s)[0],'heavy');});
test('dodge priority starts light',()=>{const s=armCounterBridge(emptyCounterBridge(),{momentType:'perfectDodge',counterWindow:.4});assert.equal(counterInputPriority(s)[0],'light');});
test('bridge expires with time',()=>{let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.2});s=stepCounterBridge(s,.21);assert.equal(s.kind,null);});
test('accepted attack consumes bridge',()=>{let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.4});s=consumeCounterBridge(s,'heavy',true);assert.equal(s.consumed,true);assert.equal(s.ttl,0);});
test('rejected attack does not consume bridge',()=>{let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.4});s=consumeCounterBridge(s,'heavy',false);assert.equal(s.consumed,false);});
test('non attack accepted action does not consume bridge',()=>{let s=armCounterBridge(emptyCounterBridge(),{momentType:'dodge',counterWindow:.4});s=consumeCounterBridge(s,'dash',true);assert.equal(s.consumed,false);});
test('counter combo source remains semantic kind',()=>{const s=armCounterBridge(emptyCounterBridge(),{momentType:'starParry',counterWindow:.4});assert.equal(counterComboSource(s),'parry');});
test('snapshot stable',()=>{const s=armCounterBridge(emptyCounterBridge(),{momentType:'perfectDodge',counterWindow:.4});assert.deepEqual(counterBridgeSnapshot(s),{kind:'dodge',ttl:.4,preferred:'light',consumed:false,serial:1});});

test('legacy combatControlDebug contract remains unchanged',async()=>{const {createCombatControlRuntime,combatControlDebug,combatCounterDebug}=await import('../src/game/CombatControlIntegration.js');const r=createCombatControlRuntime();assert.deepEqual(combatControlDebug(r),{leased:null,combo:null,pending:[]});assert.equal(combatCounterDebug(r).kind,null);});
