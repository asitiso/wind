import {clipFrame} from './AnimationClips.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,t,a)=>v<t?Math.min(t,v+a):Math.max(t,v-a);

export function createAnimationState(){
  return {state:'idle',time:0,runBlend:0,turn:0,land:0,lastFacing:1,lastGrounded:true,frame:0};
}

export function stepAnimationState(anim,player,inputAxis,dt,events={}){
  let state=anim.state;
  let time=anim.time+dt;
  const speed=Math.abs(player.vx);
  const running=player.onGround&&speed>65&&!player.combat.attack&&player.dash<=0;
  const facingChanged=player.facing!==anim.lastFacing;

  if(player.combat.attack)state='attack';
  else if(player.dash>0)state='dash';
  else if(!player.onGround){
    if(player.vy<-120)state='jump-rise';
    else if(Math.abs(player.vy)<=150)state='jump-apex';
    else state='fall';
  }else if(events.landed)state=events.hardLand?'hard-land':'land';
  else if(facingChanged&&speed>80)state='turn';
  else if(running&&anim.runBlend<.22)state='run-start';
  else if(running)state='run';
  else if(anim.runBlend>.32)state='run-stop';
  else state='idle';

  if(state!==anim.state)time=0;
  const runBlend=approach(anim.runBlend,running?1:0,dt*(running?5.8:7.5));
  const turn=Math.max(0,(facingChanged ? .18 : anim.turn)-dt);
  const land=Math.max(0,(events.landed ? .22 : anim.land)-dt);
  const sampled=clipFrame(state,time);

  return {state,time,runBlend,turn,land,lastFacing:player.facing,lastGrounded:player.onGround,frame:sampled.index};
}

export function animationPose(anim,player){
  const sampled=clipFrame(anim.state,anim.time);
  const f=sampled.frame;
  let x=f.x??0,y=f.y??0,rotation=(f.rot??0)*player.facing,scaleX=f.sx??1,scaleY=f.sy??1,cape=f.cape??0;
  if(anim.state==='idle'){
    y+=Math.sin(anim.time*2.6)*1.4;
    cape+=Math.sin(anim.time*2)*.08;
  }
  if(anim.state==='attack'){
    const attack=player.combat.attack;
    const strength=attack==='counter'?1.28:attack==='heavy'?1.1:1;
    x*=strength;rotation*=strength;cape*=strength;
  }
  if(anim.state==='run')cape+=Math.sin(anim.time*10)*.05;
  if(anim.state==='land'||anim.state==='hard-land'){
    const k=1-clamp(sampled.progress,0,1);y+=k*(anim.state==='hard-land'?3:1);
  }
  return {x,y,rotation,scaleX,scaleY,cape,frame:sampled.index,frameProgress:sampled.progress};
}
