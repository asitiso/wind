import test from 'node:test';
import assert from 'node:assert/strict';
import {groundYAt} from '../src/game/Terrain.js';
import {createAnimationState,stepAnimationState} from '../src/game/AnimationState.js';
import {createCombatState,openPerfectDodge,requestLight} from '../src/game/Combat.js';

test('terrain contains real elevated traversal instead of one flat ground line',()=>{
  assert.equal(groundYAt(700),820);
  assert.ok(groundYAt(1750)<780);
  assert.ok(groundYAt(3900)<740);
  assert.ok(groundYAt(5200)>790);
});

test('movement animation enters run-start before full run',()=>{
  let a=createAnimationState();
  const player={vx:320,onGround:true,combat:{attack:null},dash:0,vy:0,facing:1};
  a=stepAnimationState(a,player,1,.016,{});
  assert.equal(a.state,'run-start');
  for(let i=0;i<20;i++)a=stepAnimationState(a,player,1,.016,{});
  assert.equal(a.state,'run');
});

test('perfect dodge opens a dedicated counter attack window',()=>{
  let c=openPerfectDodge(createCombatState());
  assert.ok(c.counterWindow>.5);
  c=requestLight(c);
  assert.equal(c.attack,'counter');
  assert.equal(c.counterWindow,0);
});
