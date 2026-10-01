import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorld} from '../src/game/World.js';
import {enemyProfile,enemyThreatProgress,stepEnemyAI} from '../src/game/EnemyAI.js';

test('vertical slice includes a dedicated elite with posture and an arena gate',()=>{
  const world=createWorld();
  const elite=world.enemies.find(e=>e.type==='elite');
  assert.ok(elite);
  assert.equal(elite.maxPoise,120);
  assert.equal(elite.poise,120);
  assert.ok(world.arena.left<elite.x&&elite.x<world.arena.right);
});

test('ruin knight becomes faster below half health',()=>{
  const world=createWorld();
  const elite=world.enemies.find(e=>e.type==='elite');
  const normal=enemyProfile(elite);
  const enraged=enemyProfile({...elite,hp:elite.maxHp*.4});
  assert.ok(enraged.speed>normal.speed);
  assert.ok(enraged.windup<normal.windup);
});

test('heavy elite telegraph exposes readable buildup before the strike',()=>{
  const world=createWorld();
  const elite={...world.enemies.find(e=>e.type==='elite'),state:'windup',stateTime:.25,attackVariant:'heavy'};
  assert.ok(enemyThreatProgress(elite)>0);
  const result=stepEnemyAI(elite,{x:elite.x-180},.01);
  assert.equal(result.strike,null);
});
