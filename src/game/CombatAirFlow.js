export function airborneDuringAction(before,after){
  return before?.onGround===false||after?.onGround===false;
}

export function airComboPriority({chain=[],counterWindow=0}={}){
  if(counterWindow>0)return null;
  if(chain?.[0]==='air')return ['light','heavy','skill1','dash','parry','memorySwap','jump'];
  return null;
}

export function airActionContext(before,after,action){
  const airborne=['light','heavy','skill1'].includes(action)&&airborneDuringAction(before,after);
  return {airborne};
}
