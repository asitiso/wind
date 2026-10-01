import {WORLD,ENEMY_PROFILES} from './constants.js';
import {groundYAt} from './Terrain.js';
import {createUpperRuinsEnemies,UPPER_RUINS} from './UpperRuins.js';

function enemy(id,type,x){
  const profile=ENEMY_PROFILES[type];
  return {
    id,type,x,y:groundYAt(x),hp:profile.hp,maxHp:profile.hp,facing:-1,state:'idle',stateTime:0,
    attackClock:0,hurt:0,dead:false,attackSerial:0,dodgedSerial:-1,attackVariant:'slash',stagger:0,
    poise:type==='elite'?120:0,maxPoise:type==='elite'?120:0,executionWindow:0,
  };
}

export function createWorld(){
  return {
    enemies:[
      enemy('soldier-1','sword',1760),
      enemy('shield-1','shield',2670),
      enemy('archer-1','archer',3200),
      enemy('elite-ruin-knight','elite',4040),
    ],
    props:[
      {type:'pillar',x:1110,h:260},{type:'pillar',x:1290,h:180},{type:'arch',x:2070,h:310},
      {type:'banner',x:3660,h:330},{type:'statue',x:4230,h:460},{type:'shrine',x:5420,h:380},
    ],
    grassSeeds:Array.from({length:180},(_,i)=>({x:(i*179)%WORLD.width+20,h:20+(i*31)%54,phase:(i*17)%60/10})),
    flowers:Array.from({length:74},(_,i)=>({x:(i*263+90)%WORLD.width,phase:(i*23)%37/10,size:3+(i%4)})),
    particles:[],time:0,
    eliteDefeated:false,
    arena:{active:false,left:3500,right:4540},
    shrine:{entered:false,gateX:5350,altarX:5800,exitX:5000,discovered:false,memoryClaimed:false,completed:false},
    memory:{windSwordsman:false},
    upperRuins:{gateX:1985,entered:false,discovered:false,fragmentX:UPPER_RUINS.fragments[2].x,fragmentClaimed:false,fragmentIds:[],checkpointX:UPPER_RUINS.spawnX,completed:false},
    upperEnemies:createUpperRuinsEnemies(),
    windSlashes:[],
    executionFx:null,
  };
}
