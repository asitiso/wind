const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;

export const COMBO_GRACE=.62;
export const COMBO_PATTERNS=Object.freeze({
  'light>light>light':'L-L-L',
  'light>light>heavy':'L-L-H',
  'light>heavy':'L-H',
  'heavy>heavy':'H-H',
  'air>light':'AIR-L',
  'air>light>light':'AIR-L-L',
  'air>heavy':'AIR-H',
  'air>light>heavy':'AIR-L-H',
  'dash>light':'DASH-L',
  'dash>heavy':'DASH-H',
  'dash>light>heavy':'DASH-L-H',
  'dodge>light':'DODGE-L',
  'dodge>heavy':'DODGE-H',
  'dodge>light>heavy':'DODGE-L-H',
  'parry>heavy':'PARRY-H',
});

export function emptyComboFlow(){return {chain:[],grace:0,lastPattern:null,lastAccepted:null,serial:0};}

export function stepComboFlow(state,dt){
  const s=state??emptyComboFlow();
  const grace=Math.max(0,finite(s.grace)-Math.max(0,finite(dt)));
  if(grace<=0)return {...s,chain:[],grace:0,lastAccepted:null};
  return {...s,grace};
}

function sourceToken(action,{source=null,dashActive=false,momentType=null}={}){
  if(source)return source;
  if(['dodge','starDodge','perfectDodge','starStep'].includes(momentType))return 'dodge';
  if(['parry','starParry'].includes(momentType))return 'parry';
  if(action==='light'&&dashActive)return 'dash';
  return null;
}

function normalizeChain(chain){
  const c=chain.slice(-3);
  // Keep a source token plus at most two actions, or the last three standard attacks.
  const sourceIndex=c.findIndex(x=>['dash','dodge','parry','air'].includes(x));
  if(sourceIndex>=0)return c.slice(sourceIndex);
  return c;
}

export function comboPattern(chain=[]){
  const key=chain.join('>');
  return COMBO_PATTERNS[key]??null;
}

export function recordAcceptedCombatAction(state,action,context={}){
  const s=state??emptyComboFlow();
  const attackActions=new Set(['light','heavy']);
  if(!attackActions.has(action)){
    if(action==='dash'){const token=context.mobilitySource==='dodge'?'dodge':'dash';return {...s,chain:[token],grace:COMBO_GRACE,lastAccepted:action,serial:(s.serial??0)+1,lastPattern:null};}
    return {...s,lastAccepted:action,serial:(s.serial??0)+1};
  }

  let chain=s.grace>0?[...s.chain]:[];
  const hasMobilitySource=['dash','dodge','parry'].includes(chain[0]);
  if(context.airborne&&!hasMobilitySource&&(!chain.length||chain[0]!=='air'))chain=['air'];
  const source=sourceToken(action,context);
  if(source&&(!chain.length||!['dash','dodge','parry'].includes(chain[0])))chain=[source];
  chain.push(action);
  chain=normalizeChain(chain);

  // If no exact pattern exists, retain a useful suffix for future branching.
  let pattern=comboPattern(chain);
  if(!pattern&&chain.length>=3){
    const suffix2=chain.slice(-2);const suffix3=chain.slice(-3);
    if(comboPattern(suffix3))chain=suffix3;
    else if(['light','heavy'].includes(suffix2[0]))chain=suffix2;
    pattern=comboPattern(chain);
  }
  return {...s,chain,grace:COMBO_GRACE,lastPattern:pattern,lastAccepted:action,serial:(s.serial??0)+1};
}

export function comboInputPriority(state,{counterWindow=0,momentType=null}={}){
  const chain=state?.grace>0?state.chain:[];
  if(counterWindow>0&&['parry','starParry'].includes(momentType))return ['heavy','light','parry','dash','skill1','memorySwap','jump'];
  if(counterWindow>0&&['dodge','starDodge','perfectDodge','starStep'].includes(momentType))return ['light','heavy','dash','parry','skill1','memorySwap','jump'];
  if(chain[0]==='air')return ['light','heavy','skill1','dash','parry','memorySwap','jump'];
  if(chain[0]==='parry')return ['heavy','light','parry','dash','skill1','memorySwap','jump'];
  if(chain[0]==='dodge'||chain[0]==='dash')return ['light','heavy','dash','parry','skill1','memorySwap','jump'];
  if(chain.at(-1)==='light')return ['heavy','light','parry','dash','skill1','memorySwap','jump'];
  if(chain.at(-1)==='heavy')return ['heavy','dash','parry','light','skill1','memorySwap','jump'];
  return ['parry','dash','heavy','light','skill1','memorySwap','jump'];
}

export function comboFlowHint(state){
  if(!state||state.grace<=0||!state.chain.length)return null;
  const pattern=state.lastPattern??comboPattern(state.chain);
  if(pattern)return {label:pattern,complete:true,chain:[...state.chain]};
  const label=state.chain.map(x=>({light:'L',heavy:'H',dash:'DASH',dodge:'DODGE',parry:'PARRY',air:'AIR'}[x]??x.toUpperCase())).join('-');
  return {label,complete:false,chain:[...state.chain]};
}
