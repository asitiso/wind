import {PHYSICS,PLAYER,WORLD,ATTACKS} from './constants.js';
import {createCombatState,requestHeavy,requestLight,startParry,stepCombat} from './Combat.js';
import {createAnimationState,stepAnimationState} from './AnimationState.js';
import {groundYAt} from './Terrain.js';
const approach=(v,t,a)=>v<t?Math.min(t,v+a):Math.max(t,v-a);

export function createPlayer(){
  const y=groundYAt(WORLD.startX);
  return {
    x:WORLD.startX,y,vx:0,vy:0,facing:1,onGround:true,coyote:0,jumpBuffer:0,
    dash:0,dashCooldown:0,dodgeWindow:0,airDashUnlocked:false,airDashUsed:false,airDashActive:0,hp:PLAYER.maxHp,stamina:PLAYER.maxStamina,memory:18,
    hurt:0,combat:createCombatState(),animClock:0,animation:createAnimationState(),
  };
}

export function stepPlayer(p,input,dt,groundFn=groundYAt){
  const wasGrounded=p.onGround;
  const previousFacing=p.facing;
  let n={
    ...p,
    combat:stepCombat(p.combat,dt),
    animClock:p.animClock+dt,
    hurt:Math.max(0,p.hurt-dt),
    dashCooldown:Math.max(0,p.dashCooldown-dt),
    dodgeWindow:Math.max(0,p.dodgeWindow-dt),
    airDashActive:Math.max(0,(p.airDashActive??0)-dt),
  };
  const axis=(input.isDown('right')?1:0)-(input.isDown('left')?1:0);
  if(axis)n.facing=axis;
  if(input.justPressed('jump'))n.jumpBuffer=PHYSICS.jumpBuffer; else n.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
  n.coyote=p.onGround?PHYSICS.coyote:Math.max(0,p.coyote-dt);
  if(input.justPressed('light'))n.combat=requestLight(n.combat);
  if(input.justPressed('heavy')&&!n.combat.attack&&n.stamina>=ATTACKS.heavy.stamina){
    n.combat=requestHeavy(n.combat,n.stamina);if(n.combat.attack==='heavy')n.stamina-=ATTACKS.heavy.stamina;
  }
  if(input.justPressed('parry'))n.combat=startParry(n.combat);
  if(input.justPressed('dash')&&n.dashCooldown<=0&&n.stamina>=18){
    const groundDash=n.onGround;
    const airDash=!n.onGround&&n.airDashUnlocked&&!n.airDashUsed;
    if(groundDash||airDash){
      n.dash=airDash?PHYSICS.airDashTime:PHYSICS.dashTime;
      n.airDashActive=airDash?PHYSICS.airDashTime:0;
      n.airDashUsed=airDash?true:n.airDashUsed;
      n.dodgeWindow=PHYSICS.dashPerfectWindow;n.dashCooldown=.34;n.stamina-=18;
      if(airDash)n.vy=0;
      n.combat={...n.combat,attack:null,attackTime:0,queuedLight:false};
    }
  }
  n.stamina=Math.min(PLAYER.maxStamina,n.stamina+dt*(n.dash>0?6:24));
  if(n.jumpBuffer>0&&n.coyote>0){n.vy=-PHYSICS.jumpSpeed;n.onGround=false;n.jumpBuffer=0;n.coyote=0;}
  if(input.justReleased('jump')&&n.vy<0)n.vy*=.55;
  if(n.dash>0){
    n.dash=Math.max(0,n.dash-dt);
    const airDashing=n.airDashActive>0;
    n.vx=n.facing*(airDashing?PHYSICS.airDashSpeed:PHYSICS.dashSpeed);
    if(airDashing)n.vy=0;else n.vy*=.72;
  }else{
    const moveScale=n.combat.attack?.startsWith('light')?.28:n.combat.attack==='heavy'?.08:n.combat.attack==='counter'?.18:1;
    const target=axis*(n.onGround?PHYSICS.runSpeed:PHYSICS.airSpeed)*moveScale;
    n.vx=approach(n.vx,target,(n.onGround?3300:1550)*dt);
    if(!n.onGround)n.vy+=PHYSICS.gravity*dt;
  }

  const nextX=Math.max(120,Math.min(WORLD.width-180,n.x+n.vx*dt));
  const nextGround=groundFn(nextX);
  n.x=nextX;
  n.y+=n.vy*dt;
  const descending=n.vy>=0;
  if(descending&&n.y>=nextGround){n.y=nextGround;n.vy=0;n.onGround=true;n.airDashUsed=false;}else n.onGround=false;

  const landed=!wasGrounded&&n.onGround;
  const impactVelocity=p.vy;
  n.animation=stepAnimationState(
    p.animation??createAnimationState(),
    n,
    axis,
    dt,
    {landed,hardLand:landed&&impactVelocity>920,facingChanged:previousFacing!==n.facing},
  );
  return n;
}
