import {
  emptyCombatInputBuffer,captureCombatInput,stepCombatInputBuffer,leaseBufferedAction,
  acknowledgeBufferedAction,createBufferedInputView,inferBufferedActionAccepted,clearCombatInputBuffer,
} from './CombatInputBuffer.js';
import {makeCombatReleaseGate,combatActionPermission} from './CombatCancelDirector.js';
import {emptyComboFlow,stepComboFlow,recordAcceptedCombatAction,comboInputPriority,comboFlowHint} from './CombatComboFlow.js';
import {hitConfirmPermission} from './CombatHitConfirm.js';
import {tuneAttackCancelData} from './CombatRecoveryTuner.js';
import {inferMobilitySource,mobilityFollowPriority} from './CombatMobilityFlow.js';
import {airComboPriority,airActionContext} from './CombatAirFlow.js';
import {emptyCounterBridge,stepCounterBridge,armCounterBridge,counterInputPriority,consumeCounterBridge,counterComboSource} from './CombatCounterBridge.js';
import {emptyLandingBridge,stepLandingBridge,armLandingBridge,landingInputPriority,landingReleaseOverride,consumeLandingBridge,landingBridgeSnapshot} from './CombatLandingBridge.js';

export function createCombatControlRuntime(){
  return {buffer:emptyCombatInputBuffer(),combo:emptyComboFlow(),counter:emptyCounterBridge(),landing:emptyLandingBridge(),leased:null};
}

export function beginCombatControlFrame(runtime,rawInput,dt,{player,attackData=null,hitConfirmed=false,hitConfirmState=null,rhythmBoost=0,transitionLocked=false,momentType=null,momentSerial=null,extraGate=null}={}){
  const r=runtime??createCombatControlRuntime();
  let counter=stepCounterBridge(r.counter,dt);
  counter=armCounterBridge(counter,{momentType,counterWindow:player?.combat?.counterWindow??0,sourceSerial:momentSerial});
  let landing=stepLandingBridge(r.landing,dt);
  let buffer=stepCombatInputBuffer(captureCombatInput(r.buffer,rawInput),dt);
  const combo=stepComboFlow(r.combo,dt);
  const currentAttack=player?.combat?.attack??null;
  const offensiveConfirm=hitConfirmState?hitConfirmPermission(hitConfirmState,currentAttack,{forAction:'attack'}).boost:Boolean(hitConfirmed);
  const tunedAttackData=tuneAttackCancelData(currentAttack,attackData??{},{hitConfirmed:offensiveConfirm,comboDepth:combo.chain?.length??0,airborne:player?.onGround===false,rhythmBoost});
  const baseGate=makeCombatReleaseGate(player,{attackData:tunedAttackData,hitConfirmed:offensiveConfirm,transitionLocked,extraGate});
  const gate=action=>{
    if(baseGate(action))return true;
    const permission=combatActionPermission(player,action,{data:tunedAttackData,hitConfirmed:offensiveConfirm,transitionLocked});
    if(!landingReleaseOverride(landing,player,action,{permission}))return false;
    if(typeof extraGate==='function'&&!extraGate(action,{...permission,allowed:true,reason:'landing-bridge'}))return false;
    return true;
  };
  const comboPriority=comboInputPriority(combo,{counterWindow:player?.combat?.counterWindow??0,momentType});
  const recentMobility=combo.chain?.[0]==='dodge'?'dodge':combo.chain?.[0]==='dash'?'dash':null;
  const priority=counterInputPriority(counter)??landingInputPriority(landing)??airComboPriority({chain:combo.chain,counterWindow:player?.combat?.counterWindow??0})??mobilityFollowPriority(recentMobility,{airborne:player?.onGround===false})??comboPriority;
  const leased=leaseBufferedAction(buffer,gate,{priority});
  buffer=leased.state;
  return {
    runtime:{buffer,combo,counter,landing,leased:leased.action},
    input:createBufferedInputView(rawInput,leased.action),
    action:leased.action,
  };
}

export function endCombatControlFrame(runtime,beforePlayer,afterPlayer,{momentType=null,acceptance=null,dashActive=false}={}){
  const r=runtime??createCombatControlRuntime();
  const action=r.leased;
  const baseLanding=armLandingBridge(r.landing,{before:beforePlayer,after:afterPlayer,combo:r.combo});
  if(!action)return {...r,landing:baseLanding,leased:null};
  const accepted=inferBufferedActionAccepted(action,beforePlayer,afterPlayer,{acceptance});
  const buffer=acknowledgeBufferedAction(r.buffer,accepted);
  const mobilitySource=accepted&&action==='dash'?inferMobilitySource(beforePlayer,afterPlayer):null;
  const airContext=airActionContext(beforePlayer,afterPlayer,action);
  const counterSource=counterComboSource(r.counter);
  const combo=accepted?recordAcceptedCombatAction(r.combo,action,{momentType:counterSource??momentType,source:counterSource,mobilitySource,dashActive,...airContext}):r.combo;
  const counter=consumeCounterBridge(r.counter,action,accepted);
  let landing=armLandingBridge(baseLanding,{before:beforePlayer,after:afterPlayer,combo});
  landing=consumeLandingBridge(landing,action,accepted);
  return {buffer,combo,counter,landing,leased:null,lastAccepted:accepted?action:null};
}

export function resetCombatControlRuntime(runtime,reason='transition'){
  return {buffer:clearCombatInputBuffer(runtime?.buffer,reason),combo:emptyComboFlow(),counter:emptyCounterBridge(),landing:emptyLandingBridge(),leased:null};
}

export function combatControlDebug(runtime){
  return {leased:runtime?.leased??null,combo:comboFlowHint(runtime?.combo),pending:Object.keys(runtime?.buffer?.entries??{})};
}

export function combatCounterDebug(runtime){
  const c=runtime?.counter??emptyCounterBridge();
  return {kind:c.kind??null,ttl:Number.isFinite(c.ttl)?+c.ttl.toFixed(3):0,preferred:c.preferred??null,consumed:Boolean(c.consumed)};
}

export function combatLandingDebug(runtime){return landingBridgeSnapshot(runtime?.landing??emptyLandingBridge());}
