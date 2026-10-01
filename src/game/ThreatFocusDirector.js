const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,f=0)=>Number.isFinite(v)?v:f;
const BOSS_TYPES=new Set(['guardian','fireGiant','crystalGolem','cathedralBoss','desertBoss','moonlessKing','silverRival','silverRival2']);
const ATTACK_STATES=new Set(['windup','attack','attacking','active','cast','casting','charge','charging']);

export const THREAT_FOCUS={
  switchLead:.14,
  minHold:.16,
  maxDistance:1500,
  warnIntensity:.52,
  urgentIntensity:.72,
};

export function enemyThreatProgress(enemy={}){
  for(const key of ['threatProgress','telegraphProgress','windupProgress','attackProgress'])if(Number.isFinite(enemy?.[key]))return clamp(enemy[key],0,1);
  const windup=finite(enemy?.windupDuration??enemy?.attackWindup,0),time=finite(enemy?.stateTime,0);
  if(windup>0&&String(enemy?.state??'')==='windup')return clamp(time/windup,0,1);
  return ATTACK_STATES.has(String(enemy?.state??''))?.45:0;
}

export function threatScore(enemy,player,{bossMode=false}={}){
  if(!enemy||enemy.dead||enemy.state==='dead'||enemy.state==='finishing')return -Infinity;
  const dx=Math.abs(finite(enemy.x)-finite(player?.x)),distanceNorm=clamp(dx/THREAT_FOCUS.maxDistance,0,1);
  const progress=enemyThreatProgress(enemy),state=String(enemy.state??'');
  let score=.18+(1-distanceNorm)*.30+progress*.38;
  if(ATTACK_STATES.has(state))score+=.16;
  if(state==='windup')score+=.10;
  if(enemy.guardBreak||enemy.parryable===false)score+=.08;
  if(enemy.heavy)score+=.05;
  if(BOSS_TYPES.has(enemy.type)||bossMode)score+=.10;
  if(state==='broken'||state==='stagger')score-=.18;
  return clamp(score,0,1.25);
}

export function normalizeThreatIntensity(score){return clamp((finite(score)-.18)/.82,0,1);}

export function selectPrimaryThreat(enemies=[],player,options={}){
  let best=null,bestScore=-Infinity;
  for(const enemy of enemies??[]){const score=threatScore(enemy,player,options);if(score>bestScore){best=enemy;bestScore=score;}}
  return best?{enemy:best,score:bestScore,intensity:normalizeThreatIntensity(bestScore),progress:enemyThreatProgress(best)}:null;
}

export function createThreatFocusRuntime(){return {targetId:null,target:null,score:0,intensity:0,progress:0,hold:0,serial:0};}

function sameEnemy(a,b){if(!a||!b)return false;if(a===b)return true;return a.id!=null&&b.id!=null&&a.id===b.id;}

export function stepThreatFocus(runtime,enemies,player,dt,{bossMode=false}={}){
  const prev=runtime??createThreatFocusRuntime(),candidate=selectPrimaryThreat(enemies,player,{bossMode}),step=Math.max(0,finite(dt));
  if(!candidate)return {...createThreatFocusRuntime(),serial:prev.serial??0};
  const prevEnemy=(enemies??[]).find(e=>sameEnemy(e,prev.target))??((prev.target&&!prev.target.dead)?prev.target:null);
  const prevScore=prevEnemy?threatScore(prevEnemy,player,{bossMode}):-Infinity;
  const hold=Math.max(0,finite(prev.hold)-step);
  let chosen=candidate;
  if(prevEnemy&&!sameEnemy(prevEnemy,candidate.enemy)){
    const margin=candidate.score-prevScore;
    if(hold>0||margin<THREAT_FOCUS.switchLead)chosen={enemy:prevEnemy,score:prevScore,intensity:normalizeThreatIntensity(prevScore),progress:enemyThreatProgress(prevEnemy)};
  }
  const switched=!sameEnemy(chosen.enemy,prev.target);
  return {targetId:chosen.enemy?.id??null,target:chosen.enemy,score:chosen.score,intensity:chosen.intensity,progress:chosen.progress,hold:switched?THREAT_FOCUS.minHold:hold,serial:(prev.serial??0)+(switched?1:0)};
}

export function threatFocusCameraOptions(runtime,{bossMode=false}={}){
  if(!runtime?.target||runtime.intensity<.18)return {};
  const intensity=clamp(runtime.intensity,0,1);
  return {focusX:runtime.target.x,focusBlend:clamp((bossMode?.42:.20)+intensity*(bossMode?.08:.13),.18,.54),leadScale:clamp(1-intensity*.48,.42,1)};
}

export function threatParryState(target){
  if(!target)return 'unknown';
  if(target.guardBreak||target.parryable===false)return 'danger';
  if(target.parryable===true)return 'parryable';
  return 'unknown';
}

export function threatFocusSignal(runtime){
  const target=runtime?.target;if(!target)return {active:false};
  const intensity=clamp(runtime.intensity,0,1),progress=clamp(runtime.progress,0,1);
  const parryState=threatParryState(target);
  return {
    active:intensity>=THREAT_FOCUS.warnIntensity,
    urgent:intensity>=THREAT_FOCUS.urgentIntensity||progress>=.78,
    intensity,progress,parryState,
    parryable:parryState==='parryable',
    guardBreak:parryState==='danger',
    unknownParry:parryState==='unknown',
    target,
  };
}
