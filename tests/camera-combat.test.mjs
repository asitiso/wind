import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraTarget,stepCamera} from '../src/game/CameraDirector.js';
import {createCombatState,requestLight,stepCombat} from '../src/game/Combat.js';

test('exploration camera shows more space in facing direction',()=>{
  const right=cameraTarget({x:1600,vx:520,facing:1,y:820},'exploration');
  const left=cameraTarget({x:1600,vx:-520,facing:-1,y:820},'exploration');
  assert.ok(right.x>left.x);
});

test('combat camera zooms out gradually',()=>{
  const camera=stepCamera({x:0,y:0,zoom:1,shake:0},{x:1600,vx:0,facing:1,y:820},.2,'combat');
  assert.ok(camera.zoom<1);
  assert.ok(camera.zoom>.94);
});

test('light combo queues into second strike',()=>{
  let c=requestLight(createCombatState());
  assert.equal(c.attack,'light1');
  c={...c,queuedLight:true};
  c=stepCombat(c,.31);
  assert.equal(c.attack,'light2');
  assert.equal(c.comboIndex,2);
});
