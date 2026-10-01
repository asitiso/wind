export const WIND_SLASH={speed:980,life:.72,damage:34,range:94};
export function canEmitWindSlash(world,player){return Boolean(world?.memory?.windSwordsman&&player?.combat?.attack==='light3'&&player.combat.attackTime>=.105&&player.combat.attackTime<=.23&&!player.combat.hitIds.has('__wind_slash'));}
export function emitWindSlash(world,player){
  if(!canEmitWindSlash(world,player))return null;
  player.combat.hitIds.add('__wind_slash');
  const slash={id:`wind-${world.time.toFixed(3)}`,x:player.x+player.facing*112,y:player.y-148,vx:player.facing*WIND_SLASH.speed,life:WIND_SLASH.life,maxLife:WIND_SLASH.life,damage:WIND_SLASH.damage,hitIds:new Set()};
  world.windSlashes.push(slash);return slash;
}
export function stepWindSlashes(world,dt,enemies){
  for(const s of world.windSlashes){s.x+=s.vx*dt;s.life-=dt;for(const e of enemies){if(e.dead||s.hitIds.has(e.id))continue;if(Math.abs(e.x-s.x)<WIND_SLASH.range&&Math.abs((e.type==='flying'?e.y:e.y-130)-s.y)<150){e.hp=Math.max(0,e.hp-s.damage);e.hurt=.18;s.hitIds.add(e.id);if(e.hp<=0)e.dead=true;else if(e.type==='flying'){e.state='stagger';e.stateTime=0;}}}}
  world.windSlashes=world.windSlashes.filter(s=>s.life>0);
}
