const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export const BUFFERED_COMBAT_ACTIONS=Object.freeze(['parry','dash','light','heavy','jump','skill1','memorySwap']);
export const INPUT_BUFFER_WINDOWS=Object.freeze({
  parry:.105,
  dash:.125,
  light:.145,
  heavy:.165,
  jump:.110,
  skill1:.180,
  memorySwap:.145,
});
export const INPUT_BUFFER_PRIORITY=Object.freeze(['parry','dash','heavy','light','skill1','memorySwap','jump']);

export function emptyCombatInputBuffer(){
  return {entries:{},lease:null,serial:0,lastAccepted:null,lastRejected:null};
}

function cloneEntries(entries={}){
  const out={};
  for(const [action,entry] of Object.entries(entries)){
    if(entry&&finite(entry.ttl)>0)out[action]={...entry};
  }
  return out;
}

export function captureCombatInput(state,rawInput,{actions=BUFFERED_COMBAT_ACTIONS,windows=INPUT_BUFFER_WINDOWS}={}){
  const next={...(state??emptyCombatInputBuffer()),entries:cloneEntries(state?.entries),lease:null};
  for(const action of actions){
    if(!rawInput?.justPressed?.(action))continue;
    const ttl=clamp(finite(windows?.[action],.12),.04,.28);
    next.serial=(next.serial??0)+1;
    next.entries[action]={action,ttl,max:ttl,serial:next.serial,age:0};
  }
  return next;
}

export function stepCombatInputBuffer(state,dt){
  const next={...(state??emptyCombatInputBuffer()),entries:{},lease:null};
  const delta=Math.max(0,finite(dt));
  for(const [action,entry] of Object.entries(state?.entries??{})){
    const ttl=Math.max(0,finite(entry.ttl)-delta);
    if(ttl>0)next.entries[action]={...entry,ttl,age:finite(entry.age)+delta};
  }
  return next;
}

function orderedCandidates(entries,priority=INPUT_BUFFER_PRIORITY){
  const rank=new Map(priority.map((action,index)=>[action,index]));
  return Object.values(entries??{}).sort((a,b)=>{
    const ra=rank.has(a.action)?rank.get(a.action):999;
    const rb=rank.has(b.action)?rank.get(b.action):999;
    if(ra!==rb)return ra-rb;
    return finite(b.serial)-finite(a.serial);
  });
}

export function leaseBufferedAction(state,canRelease=()=>true,{priority=INPUT_BUFFER_PRIORITY}={}){
  const next={...(state??emptyCombatInputBuffer()),entries:cloneEntries(state?.entries),lease:null};
  for(const entry of orderedCandidates(next.entries,priority)){
    if(!canRelease(entry.action,entry))continue;
    next.lease={action:entry.action,serial:entry.serial};
    return {state:next,action:entry.action};
  }
  return {state:next,action:null};
}

export function acknowledgeBufferedAction(state,accepted){
  const next={...(state??emptyCombatInputBuffer()),entries:cloneEntries(state?.entries),lease:null};
  const lease=state?.lease;
  if(!lease)return next;
  const current=next.entries[lease.action];
  if(accepted&&current?.serial===lease.serial){
    delete next.entries[lease.action];
    next.lastAccepted={action:lease.action,serial:lease.serial};
  }else{
    next.lastRejected={action:lease.action,serial:lease.serial};
    if(current)current.ttl=Math.min(current.ttl,.085);
  }
  return next;
}

export function clearCombatInputBuffer(state,reason='clear'){
  return {...emptyCombatInputBuffer(),serial:state?.serial??0,lastRejected:reason?{action:null,reason}:null};
}

export function createBufferedInputView(rawInput,releasedAction,{bufferedActions=BUFFERED_COMBAT_ACTIONS}={}){
  const managed=new Set(bufferedActions);
  return {
    isDown(action){return Boolean(rawInput?.isDown?.(action));},
    justReleased(action){return Boolean(rawInput?.justReleased?.(action));},
    justPressed(action){
      if(managed.has(action))return action===releasedAction;
      return Boolean(rawInput?.justPressed?.(action));
    },
  };
}

export function inferBufferedActionAccepted(action,before,after,{acceptance=null}={}){
  if(typeof acceptance==='function'){
    const explicit=acceptance(action,before,after);
    if(typeof explicit==='boolean')return explicit;
  }
  const bc=before?.combat??{},ac=after?.combat??{};
  switch(action){
    case 'light':
    case 'heavy':
      return ac.attack!==bc.attack||finite(ac.attackTime)<finite(bc.attackTime)-.025||Boolean(ac.queuedLight)!==Boolean(bc.queuedLight);
    case 'dash':
      return finite(after?.dash)>finite(before?.dash)+.006||finite(after?.dodgeWindow)>finite(before?.dodgeWindow)+.006||finite(after?.airDashActive)>finite(before?.airDashActive)+.006;
    case 'parry':
      return finite(ac.parryTimer)>finite(bc.parryTimer)+.006;
    case 'jump':
      return (before?.onGround&&!after?.onGround)||finite(after?.vy)<finite(before?.vy)-20;
    case 'skill1':
      return ac.attack!==bc.attack||finite(after?.memory)!==finite(before?.memory);
    case 'memorySwap':
      return false;
    default:return false;
  }
}

export function bufferedInputSnapshot(state){
  return {
    pending:Object.values(state?.entries??{}).sort((a,b)=>finite(a.serial)-finite(b.serial)).map(e=>({action:e.action,ttl:+finite(e.ttl).toFixed(3)})),
    lease:state?.lease?.action??null,
    lastAccepted:state?.lastAccepted?.action??null,
  };
}
