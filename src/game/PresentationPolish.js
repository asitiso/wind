export const PRESENTATION_POLISH={particleBudget:104,shakeCap:30,minParticleBudget:58,maxParticleBudget:116};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function compressShake(amount){
  const value=Math.max(0,Number.isFinite(amount)?amount:0);
  if(value<=8)return value*.75;
  if(value<=20)return 6+(value-8)*.74;
  return Math.min(PRESENTATION_POLISH.shakeCap,14.88+(value-20)*.46);
}

export function dynamicParticleBudget({mode='exploration',moment=null,threatCount=0,boss=false,story=false,threatIntensity=0}={}){
  let budget=mode==='story'||story?68:mode==='boss'||boss?88:mode==='combat'?96:104;
  const threats=Math.max(0,Number.isFinite(threatCount)?threatCount:0);
  if(threats>=6)budget-=18;else if(threats>=4)budget-=10;else if(threats>=2)budget-=4;
  const threat=Math.max(0,Math.min(1,Number.isFinite(threatIntensity)?threatIntensity:0));if(threat>=.75)budget-=6;else if(threat>=.55)budget-=3;
  if(['perfectDodge','starStep','parry','starParry'].includes(moment))budget=Math.min(budget,84);
  if(moment==='bossBreak')budget=Math.max(budget,92);
  if(moment==='execution')budget=Math.max(budget,104);
  if(moment==='finalStrike')budget=Math.max(budget,112);
  return clamp(Math.round(budget),PRESENTATION_POLISH.minParticleBudget,PRESENTATION_POLISH.maxParticleBudget);
}

function particlePriority(p){
  const key=String(p?.type??p?.kind??p?.name??'').toLowerCase();
  if(/telegraph|danger|parry|perfect/.test(key))return 4;
  if(/hit|spark|slash|impact/.test(key))return 3;
  if(/dust|debris/.test(key))return 2;
  return 1;
}

export function visibleParticles(particles,budgetOrContext=PRESENTATION_POLISH.particleBudget){
  if(!Array.isArray(particles))return [];
  const context=typeof budgetOrContext==='object'&&budgetOrContext!==null?budgetOrContext:null;
  const budget=context?dynamicParticleBudget(context):Math.max(0,Number.isFinite(budgetOrContext)?Math.floor(budgetOrContext):PRESENTATION_POLISH.particleBudget);
  if(particles.length<=budget)return particles;
  if(!context)return particles.slice(-budget);
  const start=Math.max(0,particles.length-budget*2),window=particles.slice(start).map((p,i)=>({p,i:absoluteIndex(start,i),priority:particlePriority(p)}));
  window.sort((a,b)=>b.priority-a.priority||b.i-a.i);
  const chosen=window.slice(0,budget).sort((a,b)=>a.i-b.i).map(v=>v.p);
  return chosen;
}
function absoluteIndex(start,i){return start+i;}

export function presentationMode({boss=false,combat=false,story=false,freeRoam=false}={}){
  if(story)return 'story';if(boss)return 'boss';if(combat)return 'combat';if(freeRoam)return 'free-roam';return 'exploration';
}

export function readabilityPolicy({mode='exploration',moment=null,threatCount=0,boss=false,story=false,threatIntensity=0}={}){
  const budget=dynamicParticleBudget({mode,moment,threatCount,boss,story,threatIntensity});
  const highFocus=['parry','starParry','perfectDodge','starStep','bossBreak','execution','finalStrike'].includes(moment);
  return {
    particleBudget:budget,
    backgroundMute:story?.18:highFocus?.10:boss?.06:0,
    hudOpacity:story?.30:highFocus?.62:boss?.74:1,
    preserveTelegraphs:true,
    reduceDecorativeFx:threatCount>=4||threatIntensity>=.55||highFocus||story,
  };
}
