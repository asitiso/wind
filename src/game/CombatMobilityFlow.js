const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;

export function inferMobilitySource(before,after){
  const dodgeDelta=finite(after?.dodgeWindow)-finite(before?.dodgeWindow);
  const airDashDelta=finite(after?.airDashActive)-finite(before?.airDashActive);
  const dashDelta=finite(after?.dash)-finite(before?.dash);
  if(airDashDelta>.006)return 'airDash';
  if(dodgeDelta>.006)return 'dodge';
  if(dashDelta>.006)return 'dash';
  return null;
}

export function mobilityComboSource(source){
  if(source==='dodge')return 'dodge';
  if(source==='airDash')return 'dash';
  if(source==='dash')return 'dash';
  return null;
}

export function mobilityFollowPriority(source,{airborne=false}={}){
  if(source==='dodge')return airborne?['light','heavy','dash','parry','skill1','memorySwap','jump']:['light','heavy','parry','dash','skill1','memorySwap','jump'];
  if(source==='airDash')return ['light','heavy','skill1','dash','parry','memorySwap','jump'];
  if(source==='dash')return ['light','heavy','dash','parry','skill1','memorySwap','jump'];
  return null;
}

export function mobilitySnapshot(before,after){
  const source=inferMobilitySource(before,after);
  return {source,comboSource:mobilityComboSource(source),priority:mobilityFollowPriority(source,{airborne:after?.onGround===false})};
}
