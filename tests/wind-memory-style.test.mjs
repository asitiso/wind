import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/World.js';
import {createPlayer} from '../src/game/Player.js';
import {canEmitWindSlash,emitWindSlash,stepWindSlashes} from '../src/game/WindMemoryStyle.js';

test('wind swordsman memory turns light-3 into a ranged wind slash',()=>{
  const world=createWorld();const player=createPlayer();
  world.memory.windSwordsman=true;player.combat.attack='light3';player.combat.attackTime=.14;player.combat.hitIds=new Set();
  assert.equal(canEmitWindSlash(world,player),true);
  const slash=emitWindSlash(world,player);
  assert.ok(slash&&world.windSlashes.length===1);
  assert.equal(canEmitWindSlash(world,player),false);
});

test('wind slash can stagger an airborne target',()=>{
  const world=createWorld();const enemy=world.upperEnemies[0];
  world.windSlashes=[{id:'t',x:enemy.x-20,y:enemy.y,vx:100,life:.4,maxLife:.4,damage:34,hitIds:new Set()}];
  const hp=enemy.hp;stepWindSlashes(world,.016,[enemy]);
  assert.ok(enemy.hp<hp);assert.equal(enemy.state,'stagger');
});
