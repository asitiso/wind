const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const HIT_CONFIRM_WINDOWS=Object.freeze({
  guarded:.070,
  light:.120,
  medium:.135,
  heavy:.155,
  critical:.180,
  break:.190,
});

export function emptyHitConfirm(){
  return {active:false,ttl:0,max:0,quality:null,attack:null,enemyId:null,serial:0,contact:false,offensive:false};
}

export function hitConfirmQuality({guarded=false,critical=false,broken=false,tier=null,damage=0}={}){
  if(broken)return 'break';
  if(guarded)return 'guarded';
  if(critical)return 'critical';
  if(['light','medium','heavy','finisher'].includes(tier))return tier==='finisher'?'critical':tier;
  const d=Math.max(0,finite(damage));
  if(d>=80)return 'heavy';
  if(d>=48)return 'medium';
  return 'light';
}

export function registerHitConfirm(state,event={}){
  const quality=hitConfirmQuality(event);
  const base=HIT_CONFIRM_WINDOWS[quality]??HIT_CONFIRM_WINDOWS.light;
  const ttl=clamp(finite(event.window,base),.045,.24);
  const guarded=quality==='guarded';
  const current=state??emptyHitConfirm();
  return {
    active:true,ttl,max:ttl,quality,attack:event.attack??null,enemyId:event.enemyId??null,
    serial:(current.serial??0)+1,contact:true,offensive:!guarded,
  };
}

export function stepHitConfirm(state,dt){
  const s=state??emptyHitConfirm();
  if(!s.active)return s;
  const ttl=Math.max(0,finite(s.ttl)-Math.max(0,finite(dt)));
  if(ttl<=0)return {...s,active:false,ttl:0,quality:null,attack:null,enemyId:null,contact:false,offensive:false};
  return {...s,ttl};
}

export function clearHitConfirm(state){
  return {...emptyHitConfirm(),serial:state?.serial??0};
}

export function hitConfirmMatchesAttack(state,attack){
  if(!state?.active||!attack)return false;
  return !state.attack||state.attack===attack;
}

export function hitConfirmPermission(state,attack,{forAction='attack'}={}){
  if(!hitConfirmMatchesAttack(state,attack))return {contact:false,offensive:false,boost:false,quality:null};
  const contact=Boolean(state.contact);
  const offensive=Boolean(state.offensive);
  const boost=forAction==='defense'?contact:offensive;
  return {contact,offensive,boost,quality:state.quality,ttl:state.ttl};
}

export function hitConfirmSnapshot(state){
  return {active:Boolean(state?.active),quality:state?.quality??null,ttl:+finite(state?.ttl).toFixed(3),offensive:Boolean(state?.offensive),serial:state?.serial??0};
}
