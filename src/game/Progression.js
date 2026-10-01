import {groundYAt} from './Terrain.js';
import {UPPER_RUINS} from './UpperRuins.js';

export const WIND_MEMORY={
  id:'wind-swordsman',
  name:'바람의 검사 기억',
  subtitle:'끊어진 길을 가르는 첫 번째 바람',
  ability:'Air Dash',
};

export function canClaimWindMemory(world,player){
  return Boolean(
    world?.shrine?.entered&&
    world.eliteDefeated&&
    !world.shrine.memoryClaimed&&
    Math.abs(player.x-world.shrine.altarX)<210
  );
}

export function claimWindMemory(world,player){
  if(!canClaimWindMemory(world,player))return false;
  world.shrine.memoryClaimed=true;
  world.shrine.completed=true;
  world.memory.windSwordsman=true;
  player.airDashUnlocked=true;
  player.airDashUsed=false;
  player.memory=100;
  return true;
}

export function canLeaveShrine(world,player){
  return Boolean(
    world?.shrine?.entered&&
    world.shrine.memoryClaimed&&
    player.x<world.shrine.exitX+95
  );
}

export function canEnterUpperRuins(world,player){
  if(!world?.memory?.windSwordsman||world.shrine.entered||world.upperRuins.entered)return false;
  const gate=world.upperRuins.gateX;
  const highEnough=player.y<groundYAt(gate)-72;
  const crossing=Math.abs(player.x-gate)<165;
  return Boolean(player.airDashActive>0&&highEnough&&crossing);
}

export function nearbyUpperRuinsFragment(world,player){
  if(!world?.upperRuins?.entered)return null;
  const claimed=new Set(world.upperRuins.fragmentIds??[]);
  return UPPER_RUINS.fragments.find(f=>!claimed.has(f.id)&&Math.abs(player.x-f.x)<150&&Math.abs((player.y-120)-f.y)<190)??null;
}

export function canClaimUpperRuinsFragment(world,player){return Boolean(nearbyUpperRuinsFragment(world,player));}

export function claimUpperRuinsFragment(world,player){
  const fragment=nearbyUpperRuinsFragment(world,player);if(!fragment)return false;
  world.upperRuins.fragmentIds=[...(world.upperRuins.fragmentIds??[]),fragment.id];
  world.upperRuins.fragmentClaimed=world.upperRuins.fragmentIds.length>=UPPER_RUINS.fragments.length;
  world.upperRuins.completed=world.upperRuins.fragmentClaimed;
  player.memory=Math.min(100,player.memory+18);
  return fragment;
}
