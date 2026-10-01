const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=(v,f=0)=>Number.isFinite(v)?v:f;

export const COMBAT_ANCHOR_POLICY={
  safeMarginX:.075,
  safeMarginY:.09,
  playerTypes:new Set(['perfectDodge','starStep','parry','starParry']),
  targetTypes:new Set(['bossBreak','execution','finalStrike']),
  midpointTypes:new Set(['counter','memoryCounter']),
};

export function projectWorldToScreen(point,camera={},canvas={width:1920,height:1080}){
  const w=Math.max(1,finite(canvas?.width,1920)),h=Math.max(1,finite(canvas?.height,1080));
  const zoom=clamp(finite(camera?.zoom,1),.5,1.5);
  const x=(finite(point?.x)-finite(camera?.x))*zoom+w*(1-zoom)*.5;
  const y=(finite(point?.y)-finite(camera?.y))*zoom+h*(1-zoom)*.5;
  return {x,y};
}

export function clampCombatAnchor(point,canvas={width:1920,height:1080},{marginX=COMBAT_ANCHOR_POLICY.safeMarginX,marginY=COMBAT_ANCHOR_POLICY.safeMarginY}={}){
  const w=Math.max(1,finite(canvas?.width,1920)),h=Math.max(1,finite(canvas?.height,1080));
  const mx=clamp(finite(marginX,.075),0,.42)*w,my=clamp(finite(marginY,.09),0,.42)*h;
  return {x:clamp(finite(point?.x,w*.5),mx,w-mx),y:clamp(finite(point?.y,h*.5),my,h-my)};
}

function playerAnchor(player={}){return {x:finite(player.x),y:finite(player.y)-118};}
function targetAnchor(target={}){return {x:finite(target.x),y:finite(target.y)-Math.max(105,finite(target.visualHeight,240)*.55)};}
function midpoint(a,b){return {x:(a.x+b.x)*.5,y:(a.y+b.y)*.5};}

export function combatMomentWorldAnchor(type,{player=null,target=null}={}){
  const p=player?playerAnchor(player):null,t=target?targetAnchor(target):null;
  if(COMBAT_ANCHOR_POLICY.playerTypes.has(type))return p??t;
  if(COMBAT_ANCHOR_POLICY.targetTypes.has(type))return t??p;
  if(COMBAT_ANCHOR_POLICY.midpointTypes.has(type)&&p&&t)return midpoint(p,t);
  return t??p??null;
}

export function resolveCombatMomentAnchor(type,{player=null,target=null,camera=null,canvas=null,fallback=null,projector=null}={}){
  const world=combatMomentWorldAnchor(type,{player,target});
  if(!world)return clampCombatAnchor(fallback??{x:(canvas?.width??1920)*.5,y:(canvas?.height??1080)*.5},canvas);
  const projected=typeof projector==='function'?projector(world,camera,canvas):projectWorldToScreen(world,camera,canvas);
  return clampCombatAnchor(projected,canvas);
}


export function anchorDisplacementFromCenter(anchor,canvas={width:1920,height:1080}){
  const w=Math.max(1,finite(canvas?.width,1920)),h=Math.max(1,finite(canvas?.height,1080));
  const dx=(finite(anchor?.x,w*.5)-w*.5)/(w*.5),dy=(finite(anchor?.y,h*.5)-h*.5)/(h*.5);
  return {x:clamp(dx,-1,1),y:clamp(dy,-1,1),magnitude:clamp(Math.hypot(dx,dy),0,1.414)};
}
