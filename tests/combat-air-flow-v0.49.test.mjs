import test from 'node:test';
import assert from 'node:assert/strict';
import {airborneDuringAction,airComboPriority,airActionContext} from '../src/game/CombatAirFlow.js';
import {emptyComboFlow,recordAcceptedCombatAction,comboFlowHint} from '../src/game/CombatComboFlow.js';

test('airborne if action begins in air',()=>assert.equal(airborneDuringAction({onGround:false},{onGround:true}),true));
test('airborne if action ends in air',()=>assert.equal(airborneDuringAction({onGround:true},{onGround:false}),true));
test('ground action is not airborne',()=>assert.equal(airborneDuringAction({onGround:true},{onGround:true}),false));
test('only combat attacks create air action context',()=>{assert.equal(airActionContext({onGround:false},{onGround:false},'light').airborne,true);assert.equal(airActionContext({onGround:false},{onGround:false},'parry').airborne,false);});
test('air chain priority favors light then heavy',()=>assert.deepEqual(airComboPriority({chain:['air']}).slice(0,2),['light','heavy']));
test('counter window outranks air priority',()=>assert.equal(airComboPriority({chain:['air'],counterWindow:.2}),null));
test('first airborne light seeds AIR-L',()=>{const s=recordAcceptedCombatAction(emptyComboFlow(),'light',{airborne:true});assert.equal(s.lastPattern,'AIR-L');});
test('air light light resolves AIR-L-L',()=>{let s=recordAcceptedCombatAction(emptyComboFlow(),'light',{airborne:true});s=recordAcceptedCombatAction(s,'light',{airborne:true});assert.equal(s.lastPattern,'AIR-L-L');});
test('air heavy resolves AIR-H',()=>{const s=recordAcceptedCombatAction(emptyComboFlow(),'heavy',{airborne:true});assert.equal(s.lastPattern,'AIR-H');});
test('air light heavy resolves AIR-L-H',()=>{let s=recordAcceptedCombatAction(emptyComboFlow(),'light',{airborne:true});s=recordAcceptedCombatAction(s,'heavy',{airborne:true});assert.equal(s.lastPattern,'AIR-L-H');});
test('existing dodge source is not overwritten by airborne flag',()=>{let s=recordAcceptedCombatAction(emptyComboFlow(),'dash',{mobilitySource:'dodge'});s=recordAcceptedCombatAction(s,'light',{airborne:true});assert.equal(s.lastPattern,'DODGE-L');});
test('existing dash source is not overwritten by airborne flag',()=>{let s=recordAcceptedCombatAction(emptyComboFlow(),'dash',{mobilitySource:'airDash'});s=recordAcceptedCombatAction(s,'light',{airborne:true});assert.equal(s.lastPattern,'DASH-L');});
test('air hint is readable before completion',()=>{const s=recordAcceptedCombatAction(emptyComboFlow(),'light',{airborne:true});const h=comboFlowHint({...s,lastPattern:null});assert.match(h.label,/AIR/);});
