const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;

export const COMBAT_MOMENTS={
  perfectDodge:{duration:.42,peakAt:.09,zoomBias:.026,followMultiplier:1.12,flash:.13,vignette:.18,ring:.62,backgroundMute:.10,particleBudget:82,tone:'cool',priority:3},
  starStep:{duration:.46,peakAt:.10,zoomBias:.032,followMultiplier:1.16,flash:.16,vignette:.20,ring:.72,backgroundMute:.12,particleBudget:84,tone:'star',priority:4},
  parry:{duration:.34,peakAt:.055,zoomBias:.018,followMultiplier:1.22,flash:.24,vignette:.13,ring:.88,backgroundMute:.08,particleBudget:78,tone:'steel',priority:5},
  starParry:{duration:.38,peakAt:.06,zoomBias:.024,followMultiplier:1.26,flash:.29,vignette:.15,ring:1.00,backgroundMute:.10,particleBudget:80,tone:'starSteel',priority:6},
  counter:{duration:.30,peakAt:.045,zoomBias:.024,followMultiplier:1.24,flash:.20,vignette:.12,ring:.82,backgroundMute:.08,particleBudget:88,tone:'warm',priority:5},
  memoryCounter:{duration:.34,peakAt:.05,zoomBias:.030,followMultiplier:1.28,flash:.25,vignette:.14,ring:.96,backgroundMute:.10,particleBudget:90,tone:'memory',priority:6},
  bossBreak:{duration:.48,peakAt:.07,zoomBias:.018,followMultiplier:1.18,flash:.24,vignette:.18,ring:1.08,backgroundMute:.14,particleBudget:92,tone:'break',priority:7},
  execution:{duration:.64,peakAt:.11,zoomBias:.042,followMultiplier:1.20,flash:.34,vignette:.25,ring:1.22,backgroundMute:.20,particleBudget:104,tone:'execution',priority:9},
  finalStrike:{duration:.72,peakAt:.12,zoomBias:.050,followMultiplier:1.24,flash:.42,vignette:.28,ring:1.36,backgroundMute:.24,particleBudget:112,tone:'final',priority:10},
};

export function emptyCombatMoment(){
  return {type:null,time:0,duration:0,meta:null,serial:0};
}

export function combatMomentProfile(type){return COMBAT_MOMENTS[type]??null;}

export function beginCombatMoment(state,type,meta={}){
  const profile=combatMomentProfile(type);
  if(!profile)return state??emptyCombatMoment();
  const current=state??emptyCombatMoment();
  const currentProfile=combatMomentProfile(current.type);
  const active=current.type&&current.time<current.duration;
  if(active&&currentProfile&&currentProfile.priority>profile.priority)return current;
  return {type,time:0,duration:profile.duration,meta:{...meta},serial:(current.serial??0)+1};
}

export function stepCombatMoment(state,dt){
  const s=state??emptyCombatMoment();
  if(!s.type)return s;
  const time=Math.min(s.duration,Math.max(0,s.time+Math.max(0,finite(dt))));
  if(time>=s.duration)return {...s,time,type:null,duration:0,meta:null};
  return {...s,time};
}

export function combatMomentStrength(state){
  if(!state?.type)return 0;
  const p=combatMomentProfile(state.type);if(!p)return 0;
  const t=clamp(state.time/p.duration,0,1),peak=clamp(p.peakAt/p.duration,.03,.45);
  if(t<=peak)return Math.sin((t/peak)*Math.PI*.5);
  const tail=(t-peak)/(1-peak);
  return Math.pow(Math.cos(clamp(tail,0,1)*Math.PI*.5),1.35);
}

export function combatMomentVisual(state){
  const p=combatMomentProfile(state?.type),strength=combatMomentStrength(state);
  if(!p||strength<=0)return {active:false,strength:0,flash:0,vignette:0,ring:0,backgroundMute:0,tone:null,particleBudget:null};
  return {active:true,type:state.type,strength,flash:p.flash*strength,vignette:p.vignette*strength,ring:p.ring*strength,backgroundMute:p.backgroundMute*strength,tone:p.tone,particleBudget:p.particleBudget,meta:state.meta??{}};
}

export function combatMomentCameraOptions(state){
  const p=combatMomentProfile(state?.type),strength=combatMomentStrength(state);
  if(!p||strength<=0)return {zoomBias:0,followMultiplier:1};
  return {zoomBias:p.zoomBias*strength,followMultiplier:1+(p.followMultiplier-1)*strength};
}

export function cueMomentType(text='',options={}){
  const cue=String(text??'').toUpperCase();
  const star=Boolean(options.starSentinel);
  if(!cue)return null;
  if(cue.includes('FINAL STRIKE')||cue.includes('STAR FINISH'))return 'finalStrike';
  if(cue.includes('EXECUTION'))return 'execution';
  if(cue.includes('BREAK')&&!cue.includes('GUARD BREAK'))return 'bossBreak';
  if(cue.includes('STAR PARRY'))return 'starParry';
  if(cue.includes('PERFECT PARRY')||cue.includes('PARRY'))return star?'starParry':'parry';
  if(cue.includes('STAR STEP'))return 'starStep';
  if(cue.includes('PERFECT DODGE'))return star?'starStep':'perfectDodge';
  if(cue.includes('BLINK COUNTER')||cue.includes('MEMORY COUNTER'))return 'memoryCounter';
  if(cue.includes('COUNTER'))return 'counter';
  return null;
}

export function applyCueDrivenMoment(state,lastCue,text='',options={}){
  const cue=String(text??'');
  if(cue===lastCue)return {state:state??emptyCombatMoment(),lastCue,triggered:null};
  const type=cueMomentType(cue,options);
  const next=type?beginCombatMoment(state,type,{cue}):(state??emptyCombatMoment());
  return {state:next,lastCue:cue,triggered:type};
}

export function combatMomentInvariant(state){
  if(!state?.type)return true;
  const p=combatMomentProfile(state.type);
  return Boolean(p&&state.time>=0&&state.duration===p.duration&&state.time<state.duration);
}
