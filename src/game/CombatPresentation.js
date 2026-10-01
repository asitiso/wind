const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;

export const COMBAT_PRESENTATION={
  safeRgb:'142,211,255',
  dangerRgb:'255,72,86',
  neutralRgb:'255,196,118',
  heavyRgb:'255,210,132',
  impact:{
    guarded:{sparkCount:6,hitCount:2,hitStop:[.018,.028],shake:[2,3],flash:.10,ringScale:.72},
    light:{sparkCount:14,hitCount:6,hitStop:[.034,.052],shake:[3,6],flash:.16,ringScale:.88},
    medium:{sparkCount:20,hitCount:9,hitStop:[.048,.066],shake:[5,8],flash:.22,ringScale:1.00},
    heavy:{sparkCount:28,hitCount:13,hitStop:[.068,.088],shake:[8,12],flash:.30,ringScale:1.16},
    finisher:{sparkCount:36,hitCount:18,hitStop:[.090,.115],shake:[11,16],flash:.40,ringScale:1.34},
  },
};

export function telegraphVisual({progress=0,parryable=undefined,guardBreak=false,heavy=false,boss=false}={}){
  const p=clamp(finite(progress),0,1);
  const parryState=guardBreak||parryable===false?'danger':parryable===true?'parryable':'unknown';
  const danger=parryState==='danger',unknown=parryState==='unknown';
  const rgb=danger?COMBAT_PRESENTATION.dangerRgb:unknown?COMBAT_PRESENTATION.neutralRgb:COMBAT_PRESENTATION.safeRgb;
  const alpha=clamp((boss?.34:.26)+p*(boss?.56:.52),0,1);
  return {
    danger,unknown,parryState,
    stroke:`rgba(${rgb},${alpha})`,
    fill:`rgba(${rgb},${clamp(.035+p*(danger?.10:unknown?.078:.065),0,.16)})`,
    lineWidth:(danger?(boss?12:9):unknown?(boss?9:7):(boss?8:6))+(heavy?1:0),
    pulse:1+p*(danger?.42:unknown?.33:.28),
  };
}

export function telegraphReach(range,progress=1,{minimum=90,overshoot=1.02}={}){
  const r=Math.max(0,finite(range)),p=clamp(finite(progress),0,1);
  return Math.max(minimum,r*(.56+.44*p)*overshoot);
}

export function impactTier(attack,{guarded=false,critical=false}={}){
  if(guarded)return 'guarded';
  const damage=Math.max(0,finite(attack?.damage));
  const baseShake=Math.max(0,finite(attack?.shake));
  const baseStop=Math.max(0,finite(attack?.hitStop));
  if(critical||damage>=92||baseShake>=17||baseStop>=.10)return 'finisher';
  if(damage>=70||baseShake>=13||baseStop>=.075)return 'heavy';
  if(damage>=46||baseShake>=8||baseStop>=.050)return 'medium';
  return 'light';
}

function scaledWithinTier(base,[floor,cap]){
  return clamp(Math.max(floor,finite(base)),floor,cap);
}

export function impactFeedback(attack,{guarded=false,critical=false}={}){
  const tier=impactTier(attack,{guarded,critical});
  const profile=COMBAT_PRESENTATION.impact[tier];
  const baseShake=Math.max(0,finite(attack?.shake));
  const baseStop=Math.max(0,finite(attack?.hitStop));
  return {
    tier,
    sparkCount:profile.sparkCount,
    hitCount:profile.hitCount,
    hitStop:scaledWithinTier(baseStop,profile.hitStop),
    shake:scaledWithinTier(baseShake,profile.shake),
    flash:profile.flash,
    ringScale:profile.ringScale,
  };
}

export function phaseTransitionProfile(phase=2,{final=false,rival=false}={}){
  const p=Math.max(2,Math.floor(finite(phase,2)));
  if(final||p>=3)return {duration:2.65,combatClock:2.6,hitStop:.10,shake:18};
  if(rival)return {duration:2.25,combatClock:2.35,hitStop:.06,shake:13};
  return {duration:2.35,combatClock:2.4,hitStop:.075,shake:15};
}

export const OPENING_PACING={
  firstEnemyX:1480,
  shieldEnemyX:2180,
  archerEnemyX:2680,
  eliteEnemyX:3650,
  arenaLeft:3240,
  arenaRight:4260,
};
