const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;

export const LANDING_BRIDGE_WINDOW=.18;
const AIR_ATTACK_HINTS=['air','jump','fall','plunge','dive'];

export function emptyLandingBridge(){return {active:false,ttl:0,max:0,source:null,serial:0,consumed:false};}

export function landedThisFrame(before,after){
  return Boolean(before?.onGround===false&&after?.onGround===true);
}

function landingSource(combo){
  const first=combo?.chain?.[0];
  if(first==='air')return 'air';
  if(first==='dash')return 'airDash';
  return 'airborne';
}

export function armLandingBridge(state,{before=null,after=null,combo=null}={}){
  const current=state??emptyLandingBridge();
  if(!landedThisFrame(before,after))return current;
  const ttl=LANDING_BRIDGE_WINDOW;
  return {active:true,ttl,max:ttl,source:landingSource(combo),serial:(current.serial??0)+1,consumed:false};
}

export function stepLandingBridge(state,dt){
  const s=state??emptyLandingBridge();
  if(!s.active||s.consumed)return s;
  const ttl=Math.max(0,finite(s.ttl)-Math.max(0,finite(dt)));
  if(ttl<=0)return {...s,active:false,ttl:0,source:null,consumed:false};
  return {...s,ttl};
}

export function landingInputPriority(state){
  if(!state?.active||state.consumed||state.ttl<=0)return null;
  return ['light','heavy','dash','parry','skill1','memorySwap','jump'];
}

function looksAirborneAttack(name=''){
  const n=String(name??'').toLowerCase();
  return AIR_ATTACK_HINTS.some(token=>n.includes(token));
}

export function landingReleaseOverride(state,player,action,{permission=null}={}){
  if(!state?.active||state.consumed||state.ttl<=0)return false;
  if(player?.onGround!==true||!['light','heavy'].includes(action))return false;
  if(permission?.reason==='control-locked')return false;
  const attack=player?.combat?.attack;
  if(!attack)return true;
  // Only cut lingering recovery from an aerial sequence; never erase ordinary ground startup commitment.
  return state.source==='air'||state.source==='airDash'||looksAirborneAttack(attack);
}

export function consumeLandingBridge(state,action,accepted){
  const s=state??emptyLandingBridge();
  if(!accepted||!s.active||s.consumed||!['light','heavy'].includes(action))return s;
  return {...s,active:false,ttl:0,consumed:true};
}

export function landingBridgeSnapshot(state){
  return {active:Boolean(state?.active),ttl:+finite(state?.ttl).toFixed(3),source:state?.source??null,consumed:Boolean(state?.consumed),serial:state?.serial??0};
}
