import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyLandingBridge,landedThisFrame,armLandingBridge,stepLandingBridge,landingInputPriority,landingReleaseOverride,consumeLandingBridge} from '../src/game/CombatLandingBridge.js';
import {createCombatControlRuntime,beginCombatControlFrame,endCombatControlFrame,combatLandingDebug} from '../src/game/CombatControlIntegration.js';

const raw=(pressed=[])=>({justPressed:a=>pressed.includes(a),isDown:()=>false,justReleased:()=>false});
const player=(extra={})=>({hp:320,onGround:true,dash:0,dodgeWindow:0,airDashActive:0,reaction:{state:'ready'},recovery:{state:'ready'},combat:{attack:null,attackTime:0,counterWindow:0,parryTimer:0,queuedLight:false,...extra.combat},...extra});
const airData={startup:.07,active:.1,recovery:.34,cancelStart:.30,cancelEnd:.49,duration:.51,damage:32};

test('landing edge is detected only airborne to grounded',()=>{assert.equal(landedThisFrame({onGround:false},{onGround:true}),true);assert.equal(landedThisFrame({onGround:true},{onGround:true}),false);});
test('landing arms short bridge with air source',()=>{const s=armLandingBridge(emptyLandingBridge(),{before:{onGround:false},after:{onGround:true},combo:{chain:['air','light']}});assert.equal(s.active,true);assert.equal(s.source,'air');assert.equal(s.ttl,.18);});
test('landing bridge expires quickly',()=>{let s=armLandingBridge(emptyLandingBridge(),{before:{onGround:false},after:{onGround:true},combo:{chain:['air']}});s=stepLandingBridge(s,.19);assert.equal(s.active,false);});
test('landing priority favors attacks before defensive followups',()=>{const s={active:true,ttl:.1,consumed:false};assert.deepEqual(landingInputPriority(s).slice(0,2),['light','heavy']);});
test('landing override never bypasses control lock',()=>{const s={active:true,ttl:.1,source:'air',consumed:false};assert.equal(landingReleaseOverride(s,player({combat:{attack:'airLight'}}),'light',{permission:{reason:'control-locked'}}),false);});
test('landing override does not erase ordinary ground attack commitment',()=>{const s={active:true,ttl:.1,source:'airborne',consumed:false};assert.equal(landingReleaseOverride(s,player({combat:{attack:'groundHeavy'}}),'light',{permission:{reason:'commitment'}}),false);});
test('landing bridge permits buffered attack after aerial recovery lingers',()=>{const s={active:true,ttl:.1,source:'air',consumed:false};assert.equal(landingReleaseOverride(s,player({combat:{attack:'airLight'}}),'heavy',{permission:{reason:'commitment'}}),true);});
test('accepted attack consumes bridge',()=>{const s=consumeLandingBridge({active:true,ttl:.1,source:'air',consumed:false},'light',true);assert.equal(s.active,false);assert.equal(s.consumed,true);});
test('rejected action leaves bridge alive',()=>{const s=consumeLandingBridge({active:true,ttl:.1,source:'air',consumed:false},'light',false);assert.equal(s.active,true);});
test('control integration arms bridge on actual landing',()=>{let r=createCombatControlRuntime();const before=player({onGround:false,combat:{attack:'airLight',attackTime:.2}});const after=player({onGround:true,combat:{attack:'airLight',attackTime:.216}});r=endCombatControlFrame(r,before,after);assert.equal(combatLandingDebug(r).active,true);});
test('buffered light can release through landing override on next frame',()=>{let r=createCombatControlRuntime();const before=player({onGround:false,combat:{attack:'airLight',attackTime:.2}});const landed=player({onGround:true,combat:{attack:'airLight',attackTime:.216}});r=endCombatControlFrame(r,before,landed);const b=beginCombatControlFrame(r,raw(['light']),.016,{player:landed,attackData:airData});assert.equal(b.action,'light');});
test('reset/debug legacy surface remains independent',()=>{assert.deepEqual(combatLandingDebug(createCombatControlRuntime()),{active:false,ttl:0,source:null,consumed:false,serial:0});});
