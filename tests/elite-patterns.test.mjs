import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseEliteAttack,stepEnemyAI} from '../src/game/EnemyAI.js';
import {createWorld} from '../src/game/World.js';

test('ruin knight cycles through four readable sword patterns',()=>{
  assert.deepEqual([1,2,3,4,5].map(n=>chooseEliteAttack(n,false)),['slash','dash','heavy','guardbreak','slash']);
  assert.deepEqual([1,2,3,4].map(n=>chooseEliteAttack(n,true)),['dash','slash','guardbreak','heavy']);
});

test('guard break pattern produces an unparryable heavy strike',()=>{
  const world=createWorld();
  const base=world.enemies.find(e=>e.type==='elite');
  let elite={...base,state:'windup',stateTime:.49,attackVariant:'guardbreak',attackSerial:4};
  const player={x:elite.x-170};
  const result=stepEnemyAI(elite,player,.2);
  assert.ok(result.strike);
  assert.equal(result.strike.parryable,false);
  assert.equal(result.strike.guardBreak,true);
});

test('low-health broken elite opens a dedicated execution window',()=>{
  const world=createWorld();
  const base=world.enemies.find(e=>e.type==='elite');
  const elite={...base,hp:70,state:'broken',stateTime:.55};
  const result=stepEnemyAI(elite,{x:elite.x-150},.05);
  assert.equal(result.enemy.state,'execution');
  assert.ok(result.enemy.executionWindow>2);
});
