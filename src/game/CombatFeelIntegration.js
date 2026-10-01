import {applyCueDrivenMoment,combatMomentCameraOptions,emptyCombatMoment,stepCombatMoment} from './CombatMomentDirector.js';
import {renderCombatMomentOverlay} from './CombatMomentOverlay.js';

export function createCombatFeelRuntime(){return {moment:emptyCombatMoment(),lastCue:''};}

export function stepCombatFeelRuntime(runtime,dt,{cue='',starSentinel=false}={}){
  let moment=stepCombatMoment(runtime?.moment,dt);
  const driven=applyCueDrivenMoment(moment,runtime?.lastCue??'',cue,{starSentinel});
  return {moment:driven.state,lastCue:driven.lastCue,triggered:driven.triggered};
}

export function combatFeelCameraOptions(runtime){return combatMomentCameraOptions(runtime?.moment);}

export function renderCombatFeel(canvas,runtime,{reducedMotion=false}={}){
  return renderCombatMomentOverlay(canvas,runtime?.moment,{reducedMotion});
}
