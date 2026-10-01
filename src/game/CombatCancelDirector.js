const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const CANCEL_ACTION_CLASS=Object.freeze({
  light:'attack',heavy:'attack',dash:'defense',parry:'defense',skill1:'skill',memorySwap:'style',jump:'movement',
});

export const CONTROL_LOCK_REACTIONS=new Set(['stagger','knockdown','launch','dead','death','finishing']);

export function attackTimeline(data={}){
  const startup=Math.max(0,finite(data.startup));
  const active=Math.max(0,finite(data.active));
  const recovery=Math.max(0,finite(data.recovery));
  const authoredDuration=Math.max(0,finite(data.duration));
  const duration=Math.max(.08,authoredDuration||startup+active+recovery||.48);
  const fallbackStart=clamp(startup+active*.62,.045,duration*.88);
  const fallbackEnd=Math.max(fallbackStart,Math.min(duration,duration-Math.min(recovery*.10,.045)));
  const cancelStart=clamp(finite(data.cancelStart,fallbackStart),0,duration);
  const cancelEnd=clamp(finite(data.cancelEnd,fallbackEnd),cancelStart,duration);
  return {startup,active,recovery,duration,cancelStart,cancelEnd,authored:Number.isFinite(data.cancelStart)||Number.isFinite(data.cancelEnd)};
}

export function attackCommitment(attack='',data={}){
  const name=String(attack??'').toLowerCase();
  const damage=Math.max(0,finite(data.damage));
  if(name.includes('counter')||name.includes('dodge'))return 'counter';
  if(name.includes('heavy')||name.includes('charge')||damage>=70)return 'heavy';
  if(name.includes('skill')||name.includes('ultimate'))return 'skill';
  return 'light';
}

export function cancelWindowForAction(action,{attack='',attackElapsed=0,data={},hitConfirmed=false}={}){
  const timeline=attackTimeline(data);
  const klass=CANCEL_ACTION_CLASS[action]??'other';
  const commitment=attackCommitment(attack,data);
  let start=timeline.cancelStart,end=timeline.cancelEnd;

  // Never erase startup commitment. Even defensive cancels open after a meaningful part of active frames.
  const activeFloor=timeline.startup+timeline.active*(commitment==='heavy'?.78:commitment==='skill'?.72:.48);
  if(klass==='defense')start=Math.max(activeFloor,start-(hitConfirmed?.028:.012));
  else if(klass==='attack')start=Math.max(activeFloor,start-(hitConfirmed?.022:0));
  else if(klass==='skill')start=Math.max(activeFloor,start+.018);
  else if(klass==='style')start=Math.max(activeFloor,start+.026);
  else if(klass==='movement')start=Math.max(activeFloor,start+.038);

  if(commitment==='heavy'&&klass!=='defense')start=Math.max(start,timeline.startup+timeline.active*.84);
  if(commitment==='skill'&&klass==='attack')start=Math.max(start,timeline.startup+timeline.active*.80);
  if(commitment==='counter'&&klass==='attack')start=Math.min(start,timeline.startup+timeline.active*.34);
  start=clamp(start,0,end);
  const elapsed=clamp(finite(attackElapsed),0,timeline.duration+.5);
  return {allowed:elapsed>=start&&elapsed<=end,start,end,elapsed,duration:timeline.duration,progress:clamp(elapsed/timeline.duration,0,1),klass,commitment,authored:timeline.authored};
}

export function playerControlLocked(player,{transitionLocked=false}={}){
  if(transitionLocked||!player||finite(player.hp,1)<=0)return true;
  const reaction=String(player?.reaction?.state??'').toLowerCase();
  if(CONTROL_LOCK_REACTIONS.has(reaction))return true;
  const recovery=String(player?.recovery?.state??'').toLowerCase();
  if(['dead','death','dying','respawnready'].includes(recovery))return true;
  return false;
}

export function combatActionPermission(player,action,{data=null,hitConfirmed=false,transitionLocked=false}={}){
  if(playerControlLocked(player,{transitionLocked}))return {allowed:false,reason:'control-locked'};
  const combat=player?.combat??{};
  const attack=combat.attack??null;
  if(!attack)return {allowed:true,reason:'idle'};

  if(finite(combat.counterWindow)>0&&['light','heavy'].includes(action)){
    return {allowed:true,reason:'counter-window',start:0,end:finite(combat.counterWindow)};
  }

  const profile=cancelWindowForAction(action,{attack,attackElapsed:combat.attackTime,data:data??{},hitConfirmed});
  return {...profile,reason:profile.allowed?'cancel-window':profile.elapsed<profile.start?'commitment':'recovery-ended'};
}

export function makeCombatReleaseGate(player,{attackData=null,hitConfirmed=false,transitionLocked=false,extraGate=null}={}){
  return action=>{
    const permission=combatActionPermission(player,action,{data:attackData,hitConfirmed,transitionLocked});
    if(!permission.allowed)return false;
    if(typeof extraGate==='function'&&!extraGate(action,permission))return false;
    return true;
  };
}

export function cancelWindowDebug(player,action,options={}){
  const p=combatActionPermission(player,action,options);
  return {action,allowed:Boolean(p.allowed),reason:p.reason,start:Number.isFinite(p.start)?+p.start.toFixed(3):null,end:Number.isFinite(p.end)?+p.end.toFixed(3):null,progress:Number.isFinite(p.progress)?+p.progress.toFixed(3):null};
}
