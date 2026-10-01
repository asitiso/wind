import {attackTimeline,attackCommitment} from './CombatCancelDirector.js';
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const RECOVERY_FLOW=Object.freeze({
  light:{baseTrim:.018,confirmTrim:.018,maxTrim:.042},
  heavy:{baseTrim:.006,confirmTrim:.010,maxTrim:.022},
  counter:{baseTrim:.020,confirmTrim:.016,maxTrim:.048},
  skill:{baseTrim:.004,confirmTrim:.006,maxTrim:.016},
});

export function recoveryFlowProfile(attack='',data={}){
  const commitment=attackCommitment(attack,data);
  return RECOVERY_FLOW[commitment]??RECOVERY_FLOW.light;
}

export function recoveryCancelTrim(attack='',data={},options={}){
  const timeline=attackTimeline(data),profile=recoveryFlowProfile(attack,data);
  const recovery=Math.max(0,timeline.recovery);
  const comboDepth=clamp(Math.floor(finite(options.comboDepth)),0,4);
  const depthBonus=Math.min(.009,comboDepth*.003);
  const airborneBonus=options.airborne?.004:0;
  const confirmBonus=options.hitConfirmed?profile.confirmTrim:0;
  const rhythmBonus=clamp(finite(options.rhythmBoost),0,.012);
  // Never remove more than a conservative slice of authored recovery.
  const recoveryCap=recovery>0?recovery*.28:profile.maxTrim;
  const trim=clamp(profile.baseTrim+confirmBonus+depthBonus+airborneBonus+rhythmBonus,0,Math.min(profile.maxTrim,recoveryCap||profile.maxTrim));
  return +trim.toFixed(4);
}

export function tuneAttackCancelData(attack='',data={},options={}){
  const timeline=attackTimeline(data);
  const trim=recoveryCancelTrim(attack,data,options);
  if(trim<=0)return {...data};
  // Only pull cancelStart earlier inside late active/recovery; startup is never altered.
  const startupFloor=timeline.startup+timeline.active*(attackCommitment(attack,data)==='heavy'?.76:.44);
  const cancelStart=Math.max(startupFloor,timeline.cancelStart-trim);
  const cancelEnd=Math.max(cancelStart,timeline.cancelEnd);
  return {...data,cancelStart,cancelEnd};
}

export function recoveryFlowSnapshot(attack='',data={},options={}){
  const tuned=tuneAttackCancelData(attack,data,options),timeline=attackTimeline(tuned);
  return {attack,commitment:attackCommitment(attack,data),trim:recoveryCancelTrim(attack,data,options),cancelStart:+timeline.cancelStart.toFixed(3),cancelEnd:+timeline.cancelEnd.toFixed(3)};
}
