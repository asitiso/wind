import {ENEMY_PROFILES,WORLD} from './constants.js';
import {groundYAt} from './Terrain.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function enemyProfile(enemy){
  const base=ENEMY_PROFILES[enemy.type]??ENEMY_PROFILES.sword;
  if(enemy.type!=='elite'||enemy.hp/enemy.maxHp>=.5)return base;
  return {...base,speed:base.speed*1.18,windup:base.windup*.82,recover:base.recover*.88,damage:base.damage+6};
}

export function chooseEliteAttack(serial,enraged=false){
  const normal=['slash','dash','heavy','guardbreak'];
  const rage=['dash','slash','guardbreak','heavy'];
  return (enraged?rage:normal)[Math.max(0,serial-1)%4];
}

export function enemyThreatProgress(enemy){
  if(enemy.state!=='windup')return 0;
  const p=enemyProfile(enemy);
  const mult=enemy.attackVariant==='heavy'?1.55:enemy.attackVariant==='guardbreak'?1.28:enemy.attackVariant==='dash'?.82:1;
  return clamp(enemy.stateTime/(p.windup*mult),0,1);
}

export function staggerEnemy(enemy,duration=.7){
  return {...enemy,state:'stagger',stateTime:0,stagger:duration,hurt:Math.max(enemy.hurt,.28)};
}

function eliteStrike(e,p){
  const v=e.attackVariant;
  if(v==='dash')return {serial:e.attackSerial,damage:Math.round(p.damage*1.05),range:p.range+96,projectile:false,heavy:false,parryable:true,variant:v};
  if(v==='heavy')return {serial:e.attackSerial,damage:Math.round(p.damage*1.48),range:p.range+42,projectile:false,heavy:true,parryable:true,variant:v};
  if(v==='guardbreak')return {serial:e.attackSerial,damage:Math.round(p.damage*1.62),range:p.range+62,projectile:false,heavy:true,parryable:false,guardBreak:true,variant:v};
  return {serial:e.attackSerial,damage:p.damage,range:p.range,projectile:false,heavy:false,parryable:true,variant:'slash'};
}

export function stepEnemyAI(enemy,player,dt){
  if(enemy.dead)return {enemy,strike:null};
  const p=enemyProfile(enemy);
  let e={...enemy,hurt:Math.max(0,enemy.hurt-dt),stateTime:enemy.stateTime+dt};
  const dx=e.x-player.x;
  const distance=Math.abs(dx);
  e.facing=dx>0?-1:1;
  e.y=groundYAt(e.x);

  if(e.state==='execution'){
    e.executionWindow=Math.max(0,(e.executionWindow??0)-dt);
    if(e.executionWindow<=0){e.state='approach';e.stateTime=0;e.executionWindow=0;if(e.maxPoise)e.poise=Math.max(38,Math.round(e.maxPoise*.32));}
    return {enemy:e,strike:null};
  }

  if(e.state==='stagger'||e.state==='broken'){
    const duration=e.state==='broken'?1.7:Math.max(.55,e.stagger||.9);
    if(e.state==='broken'&&e.type==='elite'&&e.hp<=Math.max(1,e.maxHp*.22)&&e.stateTime>.48){
      e.state='execution';e.stateTime=0;e.executionWindow=2.2;return {enemy:e,strike:null};
    }
    if(e.stateTime>duration){e.state='approach';e.stateTime=0;e.stagger=0;if(e.maxPoise)e.poise=e.maxPoise;}
    return {enemy:e,strike:null};
  }

  if(distance<680&&e.state==='idle'){e.state='approach';e.stateTime=0;}
  if(e.state==='approach'){
    const preferred=p.preferred;
    if(e.type==='archer'&&distance<preferred-105){
      e.x+=Math.sign(dx)*p.speed*dt;
    }else if(distance>preferred+28){
      e.x-=Math.sign(dx)*p.speed*dt;
    }else{
      e.state='windup';e.stateTime=0;e.attackSerial=(e.attackSerial||0)+1;
      e.attackVariant=e.type==='elite'?chooseEliteAttack(e.attackSerial,e.hp/e.maxHp<.5):'slash';
    }
    e.x=clamp(e.x,100,WORLD.width-100);e.y=groundYAt(e.x);
  }else if(e.state==='windup'){
    const mult=e.attackVariant==='heavy'?1.55:e.attackVariant==='guardbreak'?1.28:e.attackVariant==='dash'?.82:1;
    const windup=p.windup*mult;
    if(e.type==='elite'&&e.attackVariant==='dash'&&e.stateTime>windup*.46){
      const step=Math.min(180*dt,Math.max(0,distance-92));
      e.x-=Math.sign(dx)*step*2.35;
      e.y=groundYAt(e.x);
    }
    if(e.stateTime>=windup){
      const strike=e.type==='elite'?eliteStrike(e,p):{
        serial:e.attackSerial,damage:p.damage,range:e.type==='archer'?p.range:p.range,projectile:e.type==='archer',heavy:false,parryable:true,variant:'slash',
      };
      e.state='recover';e.stateTime=0;
      return {enemy:e,strike};
    }
  }else if(e.state==='recover'&&e.stateTime>p.recover){
    e.state='approach';e.stateTime=0;
  }
  return {enemy:e,strike:null};
}
