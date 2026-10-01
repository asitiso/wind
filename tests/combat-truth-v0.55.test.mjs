import test from 'node:test';
import assert from 'node:assert/strict';
import {telegraphVisual,COMBAT_PRESENTATION} from '../src/game/CombatPresentation.js';
import {cueMomentType} from '../src/game/CombatMomentDirector.js';
import {emptyComboFlow,recordAcceptedCombatAction,comboInputPriority} from '../src/game/CombatComboFlow.js';
import {emptyCounterBridge,armCounterBridge,consumeCounterBridge} from '../src/game/CombatCounterBridge.js';
import {hitConfirmQuality,registerHitConfirm,emptyHitConfirm,HIT_CONFIRM_WINDOWS} from '../src/game/CombatHitConfirm.js';
import {createCombatFlowRuntime,beginCombatFlowFrame,endCombatFlowFrame} from '../src/game/CombatFlowRuntime.js';

const raw=(pressed=[])=>({justPressed:a=>pressed.includes(a),isDown:()=>false,justReleased:()=>false});
const player=(extra={})=>({hp:320,onGround:true,dash:0,dodgeWindow:0,airDashActive:0,reaction:{state:'ready'},recovery:{state:'ready'},combat:{attack:null,attackTime:0,counterWindow:0,parryTimer:0,queuedLight:false,...extra.combat},...extra});
const attackData={startup:.08,active:.1,recovery:.3,cancelStart:.27,cancelEnd:.47,duration:.48,damage:28};

test('unknown telegraph uses neutral amber instead of parry blue',()=>{
  const v=telegraphVisual({progress:.8});
  assert.equal(v.parryState,'unknown');
  assert.equal(v.unknown,true);
  assert.match(v.stroke,new RegExp(COMBAT_PRESENTATION.neutralRgb));
  assert.doesNotMatch(v.stroke,new RegExp(COMBAT_PRESENTATION.safeRgb));
});

test('explicit parryable telegraph remains blue',()=>{
  const v=telegraphVisual({progress:.8,parryable:true});
  assert.equal(v.parryState,'parryable');
  assert.match(v.stroke,new RegExp(COMBAT_PRESENTATION.safeRgb));
});

test('explicit unparryable telegraph remains red',()=>{
  const v=telegraphVisual({progress:.8,parryable:false});
  assert.equal(v.parryState,'danger');
  assert.equal(v.danger,true);
  assert.match(v.stroke,new RegExp(COMBAT_PRESENTATION.dangerRgb));
});

test('guardian STAR FINISH cue now maps to finalStrike',()=>assert.equal(cueMomentType('STAR FINISH · 하늘을 가르는 마지막 베기'),'finalStrike'));

test('perfectDodge fallback creates DODGE-L combo without counter bridge',()=>{
  const s=recordAcceptedCombatAction(emptyComboFlow(),'light',{momentType:'perfectDodge'});
  assert.equal(s.lastPattern,'DODGE-L');
});

test('starStep fallback gives dodge counter priority',()=>{
  const p=comboInputPriority(emptyComboFlow(),{counterWindow:.4,momentType:'starStep'});
  assert.equal(p[0],'light');
});

test('guard break wins classification even when contact is also marked guarded',()=>{
  assert.equal(hitConfirmQuality({guarded:true,broken:true,damage:0}),'break');
  const s=registerHitConfirm(emptyHitConfirm(),{guarded:true,broken:true,damage:0});
  assert.equal(s.quality,'break');
  assert.equal(s.offensive,true);
  assert.equal(s.ttl,HIT_CONFIRM_WINDOWS.break);
});

test('consumed counter cannot re-arm on same authored precision serial',()=>{
  let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.5,sourceSerial:7});
  s=consumeCounterBridge(s,'heavy',true);
  const again=armCounterBridge(s,{momentType:'parry',counterWindow:.4,sourceSerial:7});
  assert.equal(again.consumed,true);
  assert.equal(again.serial,s.serial);
});

test('consumed counter cannot re-arm during same window without a source serial',()=>{
  let s=armCounterBridge(emptyCounterBridge(),{momentType:'perfectDodge',counterWindow:.5});
  s=consumeCounterBridge(s,'light',true);
  const again=armCounterBridge(s,{momentType:'perfectDodge',counterWindow:.4});
  assert.equal(again.consumed,true);
  assert.equal(again.serial,s.serial);
});

test('new precision serial may arm a fresh counter bridge',()=>{
  let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.5,sourceSerial:4});
  s=consumeCounterBridge(s,'heavy',true);
  s=armCounterBridge(s,{momentType:'parry',counterWindow:.5,sourceSerial:5});
  assert.equal(s.consumed,false);
  assert.equal(s.sourceSerial,5);
  assert.equal(s.serial,2);
});

test('closing the counter window clears consumed latch',()=>{
  let s=armCounterBridge(emptyCounterBridge(),{momentType:'parry',counterWindow:.5,sourceSerial:4});
  s=consumeCounterBridge(s,'heavy',true);
  s=armCounterBridge(s,{momentType:'parry',counterWindow:0,sourceSerial:4});
  assert.equal(s.kind,null);
  assert.equal(s.consumed,false);
});

test('unified flow keeps consumed counter latched while the same cue window remains active',()=>{
  const p=player({combat:{counterWindow:.5}});
  let b=beginCombatFlowFrame(createCombatFlowRuntime(),raw(['heavy']),.016,{player:p,attackData,cue:'PERFECT PARRY · J COUNTER'});
  assert.equal(b.action,'heavy');
  const after=player({combat:{counterWindow:.45,attack:'heavy',attackTime:.01}});
  let r=endCombatFlowFrame(b.runtime,p,after);
  assert.equal(r.control.counter.consumed,true);
  const next=beginCombatFlowFrame(r,raw(['heavy']),.016,{player:after,attackData,cue:'PERFECT PARRY · J COUNTER'});
  assert.equal(next.runtime.control.counter.consumed,true);
  assert.equal(next.runtime.control.counter.serial,r.control.counter.serial);
});
