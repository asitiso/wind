import {createCombatFocusRuntime,stepCombatFocusRuntime,combatFocusCameraOptions,combatFocusReadabilityContext,renderCombatFocus} from './CombatFocusIntegration.js';
import {createCombatControlRuntime,beginCombatControlFrame,endCombatControlFrame,resetCombatControlRuntime,combatControlDebug,combatCounterDebug} from './CombatControlIntegration.js';
import {emptyHitConfirm,stepHitConfirm,registerHitConfirm,clearHitConfirm,hitConfirmSnapshot} from './CombatHitConfirm.js';
import {emptyContactAssist,stepContactAssist,armContactAssist,applyContactAssist,consumeContactAssist,contactAssistSnapshot} from './CombatContactAssist.js';
import {emptyCombatRhythm,stepCombatRhythm,recordRhythmAction,registerRhythmHit,rhythmRecoveryBonus,combatRhythmSnapshot} from './CombatRhythmDirector.js';

export function createCombatFlowRuntime(){
  return {focus:createCombatFocusRuntime(),control:createCombatControlRuntime(),hitConfirm:emptyHitConfirm(),contactAssist:emptyContactAssist(),rhythm:emptyCombatRhythm(),serial:0};
}

export function beginCombatFlowFrame(runtime,rawInput,dt,{
  player,attackData=null,transitionLocked=false,cue='',starSentinel=false,enemies=[],bossMode=false,extraGate=null,
}={}){
  const r=runtime??createCombatFlowRuntime();
  const hitConfirm=stepHitConfirm(r.hitConfirm,dt);
  const contactAssist=stepContactAssist(r.contactAssist,dt);
  const rhythm=stepCombatRhythm(r.rhythm,dt);
  const rhythmBoost=rhythmRecoveryBonus(rhythm,player?.combat?.attack??'');
  const focus=stepCombatFocusRuntime(r.focus,dt,{cue,starSentinel,enemies,player,bossMode});
  const momentType=focus?.feel?.moment?.type??null;
  const momentSerial=focus?.feel?.moment?.serial??null;
  const controlResult=beginCombatControlFrame(r.control,rawInput,dt,{player,attackData,hitConfirmState:hitConfirm,rhythmBoost,transitionLocked,momentType,momentSerial,extraGate});
  return {
    runtime:{...r,focus,hitConfirm,contactAssist,rhythm,control:controlResult.runtime},
    input:controlResult.input,
    action:controlResult.action,
    momentType,
  };
}

export function endCombatFlowFrame(runtime,beforePlayer,afterPlayer,{acceptance=null,dashActive=false,attackData=null}={}){
  const r=runtime??createCombatFlowRuntime();
  const momentType=r.focus?.feel?.moment?.type??null;
  const control=endCombatControlFrame(r.control,beforePlayer,afterPlayer,{momentType,acceptance,dashActive});
  const target=r.focus?.threat?.target??null;
  const rhythm=recordRhythmAction(r.rhythm,control.lastAccepted,Boolean(control.lastAccepted));
  const contactAssist=control.lastAccepted?armContactAssist(r.contactAssist,{player:afterPlayer,target,action:control.lastAccepted,attack:afterPlayer?.combat?.attack,attackData:attackData??{}}):r.contactAssist;
  return {...r,control,contactAssist,rhythm};
}

export function registerCombatFlowHit(runtime,event={}){
  const r=runtime??createCombatFlowRuntime();
  const hitConfirm=registerHitConfirm(r.hitConfirm,event);
  const rhythm=registerRhythmHit(r.rhythm,hitConfirm);
  return {...r,hitConfirm,rhythm,serial:(r.serial??0)+1};
}

export function clearCombatFlowHit(runtime){
  const r=runtime??createCombatFlowRuntime();
  return {...r,hitConfirm:clearHitConfirm(r.hitConfirm)};
}

export function resetCombatFlowRuntime(runtime,reason='transition'){
  const fresh=createCombatFlowRuntime();
  return {...fresh,serial:runtime?.serial??0,control:resetCombatControlRuntime(runtime?.control,reason)};
}

export function combatFlowCameraOptions(runtime,{bossMode=false}={}){
  return combatFocusCameraOptions(runtime?.focus,{bossMode});
}

export function combatFlowReadabilityContext(runtime,options={}){
  return combatFocusReadabilityContext(runtime?.focus,options);
}

export function renderCombatFlow(canvas,runtime,options={}){
  return renderCombatFocus(canvas,runtime?.focus,options);
}

export function takeCombatFlowPositionAssist(runtime,player,options={}){
  const r=runtime??createCombatFlowRuntime();
  const applied=applyContactAssist(player,r.contactAssist,options);
  return {runtime:{...r,contactAssist:consumeContactAssist(r.contactAssist)},player:applied.player,applied:applied.applied,deltaX:applied.deltaX};
}

export function combatFlowAssistDebug(runtime){return contactAssistSnapshot(runtime?.contactAssist??emptyContactAssist());}

export function combatFlowRhythmDebug(runtime){return combatRhythmSnapshot(runtime?.rhythm??emptyCombatRhythm());}

export function combatFlowDebug(runtime){
  const r=runtime??createCombatFlowRuntime();
  return {
    control:combatControlDebug(r.control),
    counter:combatCounterDebug(r.control),
    hitConfirm:hitConfirmSnapshot(r.hitConfirm),
    moment:r.focus?.feel?.moment?.type??null,
    threatId:r.focus?.threat?.target?.id??null,
    serial:r.serial??0,
  };
}
