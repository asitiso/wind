import {createCombatFeelRuntime,stepCombatFeelRuntime} from './CombatFeelIntegration.js';
import {combatMomentCameraOptions} from './CombatMomentDirector.js';
import {renderCombatMomentOverlay} from './CombatMomentOverlay.js';
import {resolveCombatMomentAnchor} from './SpatialCombatAnchor.js';
import {createThreatFocusRuntime,stepThreatFocus,threatFocusCameraOptions,threatFocusSignal} from './ThreatFocusDirector.js';
import {renderThreatFocusOverlay} from './ThreatFocusOverlay.js';

export function createCombatFocusRuntime(){return {feel:createCombatFeelRuntime(),threat:createThreatFocusRuntime()};}

export function stepCombatFocusRuntime(runtime,dt,{cue='',starSentinel=false,enemies=[],player=null,bossMode=false}={}){
  const r=runtime??createCombatFocusRuntime();
  return {feel:stepCombatFeelRuntime(r.feel,dt,{cue,starSentinel}),threat:stepThreatFocus(r.threat,enemies,player,dt,{bossMode})};
}

export function combatFocusCameraOptions(runtime,{bossMode=false}={}){
  const moment=combatMomentCameraOptions(runtime?.feel?.moment),threat=threatFocusCameraOptions(runtime?.threat,{bossMode});
  return {...threat,...moment};
}

export function combatFocusReadabilityContext(runtime,{mode='combat',threatCount=0,boss=false,story=false}={}){
  return {mode,moment:runtime?.feel?.moment?.type??null,threatCount,boss,story,threatIntensity:runtime?.threat?.intensity??0};
}

export function renderCombatFocus(canvas,runtime,{player=null,camera=null,reducedMotion=false,story=false,projector=null}={}){
  const target=runtime?.threat?.target??null,moment=runtime?.feel?.moment;
  const anchor=resolveCombatMomentAnchor(moment?.type,{player,target,camera,canvas,projector});
  const momentDrawn=renderCombatMomentOverlay(canvas,moment,{reducedMotion,anchor});
  const signal=threatFocusSignal(runtime?.threat);
  const suppressThreat=story||moment?.type==='execution'||moment?.type==='finalStrike'||Boolean(signal.urgent&&momentDrawn&&['parry','starParry'].includes(moment?.type));
  const threatDrawn=renderThreatFocusOverlay(canvas,runtime?.threat,{camera,reducedMotion,suppress:suppressThreat,projector});
  return {momentDrawn,threatDrawn,anchor};
}
