const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;

export function emptyCounterBridge(){return {kind:null,ttl:0,max:0,preferred:null,serial:0,consumed:false,sourceSerial:null};}

export function counterKindFromMoment(momentType){
  if(['parry','starParry'].includes(momentType))return 'parry';
  if(['dodge','starDodge','perfectDodge','starStep'].includes(momentType))return 'dodge';
  return null;
}

export function preferredCounterAction(kind){return kind==='parry'?'heavy':kind==='dodge'?'light':null;}

function clearBridge(current){return {...emptyCounterBridge(),serial:current?.serial??0};}

export function armCounterBridge(state,{kind=null,momentType=null,counterWindow=0,sourceSerial=null}={}){
  const resolved=kind??counterKindFromMoment(momentType);
  const window=Math.max(0,finite(counterWindow));
  const current=state??emptyCounterBridge();
  if(!resolved||window<=0)return current.kind||current.consumed?clearBridge(current):current;

  const authoredSource=Number.isFinite(sourceSerial)?sourceSerial:null;
  const sameSource=authoredSource!=null&&current.sourceSerial===authoredSource;

  // One precision event may open exactly one counter bridge. Once consumed, keep it latched
  // for the remainder of the same counter window so repeated frames cannot silently re-arm it.
  if(current.consumed){
    if(authoredSource==null||sameSource)return current;
  }

  if(current.kind===resolved&&current.ttl>0&&!current.consumed&&(authoredSource==null||sameSource||current.sourceSerial==null)){
    return {...current,ttl:Math.max(current.ttl,window),max:Math.max(current.max,window),sourceSerial:authoredSource??current.sourceSerial};
  }

  return {kind:resolved,ttl:window,max:window,preferred:preferredCounterAction(resolved),serial:(current.serial??0)+1,consumed:false,sourceSerial:authoredSource};
}

export function stepCounterBridge(state,dt){
  const s=state??emptyCounterBridge();
  if(!s.kind||s.consumed)return s;
  const ttl=Math.max(0,finite(s.ttl)-Math.max(0,finite(dt)));
  if(ttl<=0)return clearBridge(s);
  return {...s,ttl};
}

export function counterInputPriority(state){
  if(!state?.kind||state.consumed||state.ttl<=0)return null;
  if(state.kind==='parry')return ['heavy','light','parry','dash','skill1','memorySwap','jump'];
  return ['light','heavy','dash','parry','skill1','memorySwap','jump'];
}

export function consumeCounterBridge(state,action,accepted){
  const s=state??emptyCounterBridge();
  if(!accepted||!s.kind||s.consumed)return s;
  if(action!==s.preferred&&!['light','heavy'].includes(action))return s;
  return {...s,consumed:true,ttl:0};
}

export function counterComboSource(state){
  if(!state?.kind)return null;
  return state.kind;
}

export function counterBridgeSnapshot(state){return {kind:state?.kind??null,ttl:+finite(state?.ttl).toFixed(3),preferred:state?.preferred??null,consumed:Boolean(state?.consumed),serial:state?.serial??0};}
