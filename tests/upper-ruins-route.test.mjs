import test from 'node:test';
import assert from 'node:assert/strict';
import {UPPER_RUINS,createUpperRuinsEnemies,upperRuinsGapAt,upperRuinsGroundYAt,upperRuinsProgress} from '../src/game/UpperRuins.js';

test('upper ruins is a multi-screen route with two real fall gaps and three fragments',()=>{
  assert.ok(UPPER_RUINS.endX-UPPER_RUINS.startX>4000);
  assert.equal(UPPER_RUINS.gaps.length,2);
  assert.equal(UPPER_RUINS.fragments.length,3);
  for(const gap of UPPER_RUINS.gaps){
    const middle=(gap.left+gap.right)/2;
    assert.equal(upperRuinsGapAt(middle)?.label,gap.label);
    assert.ok(upperRuinsGroundYAt(middle)>1000);
  }
  assert.equal(upperRuinsProgress(UPPER_RUINS.startX),0);
  assert.equal(upperRuinsProgress(UPPER_RUINS.endX),1);
});

test('upper ruins introduces dedicated flying enemies',()=>{
  const enemies=createUpperRuinsEnemies();
  assert.equal(enemies.length,4);
  assert.ok(enemies.every(e=>e.type==='flying'&&e.y<500&&e.hp>0));
});
