const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const BOSS_TYPES=new Set(['guardian','fireGiant','crystalGolem','cathedralBoss','desertBoss','moonlessKing','silverRival','silverRival2']);

export function emptyContactAssist(){return {active:false,ttl:0,max:0,deltaX:0,targetId:null,action:null,serial:0,consumed:false};}

function attackKind(attack='',data={}){
  const n=String(attack??'').toLowerCase();
  const damage=Math.max(0,finite(data?.damage));
  if(n.includes('counter')||n.includes('dodge'))return 'counter';
  if(n.includes('heavy')||n.includes('charge')||damage>=70)return 'heavy';
  return 'light';
}

function attackReach(data={}){
  return Math.max(80,finite(data?.range??data?.reach??data?.radius,170));
}

export function computeContactAssist({player=null,target=null,action=null,attack=null,attackData=null}={}){
  if(!player||!target||target.dead||target.state==='dead'||target.state==='finishing')return {active:false,deltaX:0,reason:'no-target'};
  if(!['light','heavy'].includes(action)||player.onGround===false)return {active:false,deltaX:0,reason:'ineligible-action'};
  const dx=finite(target.x)-finite(player.x),gap=Math.abs(dx);
  if(gap<=0)return {active:false,deltaX:0,reason:'overlap'};
  const facing=finite(player.facing,Math.sign(dx)||1)||1;
  if(dx*facing<-18)return {active:false,deltaX:0,reason:'behind'};
  const vertical=Math.abs(finite(target.y,finite(player.y))-finite(player.y));
  if(vertical>220)return {active:false,deltaX:0,reason:'vertical-gap'};
  const reach=attackReach(attackData??{}),kind=attackKind(attack,attackData??{});
  const sweetSpot=reach*(kind==='heavy'?.80:.78);
  if(gap<=sweetSpot)return {active:false,deltaX:0,reason:'already-close',reach,gap};
  const extraBand=kind==='heavy'?58:72;
  if(gap>reach+extraBand)return {active:false,deltaX:0,reason:'too-far',reach,gap};
  let maxNudge=kind==='counter'?26:kind==='heavy'?14:24;
  if(BOSS_TYPES.has(target.type))maxNudge=Math.min(maxNudge,16);
  const deltaX=Math.sign(dx)*Math.min(maxNudge,Math.max(0,gap-sweetSpot));
  if(Math.abs(deltaX)<1)return {active:false,deltaX:0,reason:'tiny',reach,gap};
  return {active:true,deltaX:+deltaX.toFixed(3),reason:'assist',reach,gap,kind,targetId:target.id??null};
}

export function armContactAssist(state,event={}){
  const current=state??emptyContactAssist(),assist=computeContactAssist(event);
  if(!assist.active)return current;
  return {active:true,ttl:.065,max:.065,deltaX:assist.deltaX,targetId:assist.targetId,action:event.action??null,serial:(current.serial??0)+1,consumed:false};
}

export function stepContactAssist(state,dt){
  const s=state??emptyContactAssist();
  if(!s.active||s.consumed)return s;
  const ttl=Math.max(0,finite(s.ttl)-Math.max(0,finite(dt)));
  if(ttl<=0)return {...s,active:false,ttl:0,deltaX:0,consumed:false};
  return {...s,ttl};
}

export function applyContactAssist(player,state,{terrainFn=null,minX=-Infinity,maxX=Infinity}={}){
  const s=state??emptyContactAssist();
  if(!s.active||s.consumed||!player||player.onGround===false)return {player,applied:false,deltaX:0};
  const x=finite(player.x),nextX=clamp(x+finite(s.deltaX),minX,maxX);
  if(nextX===x)return {player,applied:false,deltaX:0};
  if(typeof terrainFn==='function'){
    const a=terrainFn(x),b=terrainFn(nextX);
    if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(b-a)>48)return {player,applied:false,deltaX:0};
  }
  return {player:{...player,x:nextX},applied:true,deltaX:+(nextX-x).toFixed(3)};
}

export function consumeContactAssist(state){
  const s=state??emptyContactAssist();
  return {...s,active:false,ttl:0,deltaX:0,consumed:true};
}

export function contactAssistSnapshot(state){
  return {active:Boolean(state?.active),ttl:+finite(state?.ttl).toFixed(3),deltaX:+finite(state?.deltaX).toFixed(3),targetId:state?.targetId??null,serial:state?.serial??0,consumed:Boolean(state?.consumed)};
}
