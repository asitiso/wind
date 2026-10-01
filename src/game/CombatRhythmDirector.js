const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function emptyCombatRhythm(){return {tempo:0,ttl:0,streak:0,lastAction:null,lastHitSerial:0,serial:0};}

const HIT_GAIN=Object.freeze({guarded:.025,light:.14,medium:.18,heavy:.24,critical:.30,break:.32});

export function stepCombatRhythm(state,dt){
  const s=state??emptyCombatRhythm(),delta=Math.max(0,finite(dt));
  const ttl=Math.max(0,finite(s.ttl)-delta);
  const decay=ttl>0?.18:.70;
  const tempo=Math.max(0,finite(s.tempo)-delta*decay);
  return {...s,ttl,tempo,streak:ttl>0?s.streak:0,lastAction:ttl>0?s.lastAction:null};
}

export function recordRhythmAction(state,action,accepted){
  const s=state??emptyCombatRhythm();
  if(!accepted||!['light','heavy'].includes(action))return s;
  const streak=s.ttl>0?clamp((s.streak??0)+(s.lastAction===action?0:1),1,5):1;
  return {...s,streak,lastAction:action,serial:(s.serial??0)+1};
}

export function registerRhythmHit(state,hitConfirm){
  const s=state??emptyCombatRhythm(),hitSerial=hitConfirm?.serial??0;
  if(!hitConfirm?.active||hitSerial<=finite(s.lastHitSerial))return s;
  const quality=hitConfirm.quality??'light';
  const gain=HIT_GAIN[quality]??HIT_GAIN.light;
  const offensive=Boolean(hitConfirm.offensive);
  const tempo=clamp(finite(s.tempo)+(offensive?gain:Math.min(gain,.03)),0,1);
  return {...s,tempo,ttl:.72,lastHitSerial:hitSerial,serial:(s.serial??0)+1};
}

function attackKind(attack=''){
  const n=String(attack??'').toLowerCase();
  if(n.includes('counter')||n.includes('dodge'))return 'counter';
  if(n.includes('heavy')||n.includes('charge'))return 'heavy';
  if(n.includes('skill')||n.includes('ultimate'))return 'skill';
  return 'light';
}

export function rhythmRecoveryBonus(state,attack=''){
  const s=state??emptyCombatRhythm();
  if(s.ttl<=0||s.tempo<.25)return 0;
  const kind=attackKind(attack);
  const cap=kind==='counter'?.010:kind==='heavy'?.004:kind==='skill'?0:.009;
  if(cap<=0)return 0;
  const normalized=clamp((s.tempo-.25)/.75,0,1);
  const streakBonus=Math.min(.0025,Math.max(0,(s.streak??0)-1)*.0008);
  return +Math.min(cap,normalized*cap+streakBonus).toFixed(4);
}

export function combatRhythmSnapshot(state){
  return {tempo:+finite(state?.tempo).toFixed(3),ttl:+finite(state?.ttl).toFixed(3),streak:state?.streak??0,lastAction:state?.lastAction??null,lastHitSerial:state?.lastHitSerial??0,serial:state?.serial??0};
}
