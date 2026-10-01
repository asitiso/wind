import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INPUT_BUFFER_WINDOWS,emptyCombatInputBuffer,captureCombatInput,stepCombatInputBuffer,
  leaseBufferedAction,acknowledgeBufferedAction,createBufferedInputView,inferBufferedActionAccepted,
  clearCombatInputBuffer,bufferedInputSnapshot,
} from '../src/game/CombatInputBuffer.js';

function input(pressed=[]){const set=new Set(pressed);return {justPressed:a=>set.has(a),isDown:()=>false,justReleased:()=>false};}

test('buffer windows stay intentionally short',()=>{for(const v of Object.values(INPUT_BUFFER_WINDOWS)){assert.ok(v>=.04&&v<=.28)}});
test('captures an edge press',()=>{const s=captureCombatInput(emptyCombatInputBuffer(),input(['light']));assert.ok(s.entries.light);});
test('held keys do not create synthetic repeats',()=>{const raw={justPressed:()=>false,isDown:()=>true};const s=captureCombatInput(emptyCombatInputBuffer(),raw);assert.equal(Object.keys(s.entries).length,0);});
test('buffer expires',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['dash']));s=stepCombatInputBuffer(s,.3);assert.equal(Object.keys(s.entries).length,0);});
test('parry has priority over attack when both buffered',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['light','parry']));const r=leaseBufferedAction(s,()=>true);assert.equal(r.action,'parry');});
test('blocked high priority action lets another legal action release',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['parry','light']));const r=leaseBufferedAction(s,a=>a==='light');assert.equal(r.action,'light');});
test('ack consumes only leased serial',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['light']));let r=leaseBufferedAction(s,()=>true);s=acknowledgeBufferedAction(r.state,true);assert.equal(s.entries.light,undefined);assert.equal(s.lastAccepted.action,'light');});
test('rejected lease stays buffered briefly',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['heavy']));let r=leaseBufferedAction(s,()=>true);s=acknowledgeBufferedAction(r.state,false);assert.ok(s.entries.heavy);assert.ok(s.entries.heavy.ttl<=.085);});
test('managed action is emitted only from lease',()=>{const raw=input(['light','execute']);const view=createBufferedInputView(raw,'heavy');assert.equal(view.justPressed('light'),false);assert.equal(view.justPressed('heavy'),true);assert.equal(view.justPressed('execute'),true);});
test('movement/down state delegates to raw input',()=>{const raw={isDown:a=>a==='right',justPressed:()=>false,justReleased:()=>false};const view=createBufferedInputView(raw,null);assert.equal(view.isDown('right'),true);});
test('light acknowledgement detects attack transition',()=>{assert.equal(inferBufferedActionAccepted('light',{combat:{attack:null,attackTime:0}},{combat:{attack:'light',attackTime:.01}}),true);});
test('combo queue acknowledgement detects queuedLight edge',()=>{assert.equal(inferBufferedActionAccepted('light',{combat:{attack:'light',attackTime:.2,queuedLight:false}},{combat:{attack:'light',attackTime:.21,queuedLight:true}}),true);});
test('dash acknowledgement detects dodge timer',()=>{assert.equal(inferBufferedActionAccepted('dash',{dash:0,dodgeWindow:0},{dash:.2,dodgeWindow:.12}),true);});
test('parry acknowledgement detects parry timer',()=>{assert.equal(inferBufferedActionAccepted('parry',{combat:{parryTimer:0}},{combat:{parryTimer:.2}}),true);});
test('jump acknowledgement detects leaving ground',()=>{assert.equal(inferBufferedActionAccepted('jump',{onGround:true,vy:0,combat:{}},{onGround:false,vy:-500,combat:{}}),true);});
test('clear removes stale buffered actions across death or transition',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['light','dash']));s=clearCombatInputBuffer(s,'death');assert.equal(Object.keys(s.entries).length,0);});
test('snapshot is compact and deterministic',()=>{let s=captureCombatInput(emptyCombatInputBuffer(),input(['light']));assert.deepEqual(bufferedInputSnapshot(s).pending.map(x=>x.action),['light']);});
test('mere attackTime advancement does not falsely acknowledge a buffered attack',()=>{assert.equal(inferBufferedActionAccepted('light',{combat:{attack:'light',attackTime:.20,queuedLight:false}},{combat:{attack:'light',attackTime:.216,queuedLight:false}}),false);});
