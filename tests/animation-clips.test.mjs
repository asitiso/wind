import test from 'node:test';
import assert from 'node:assert/strict';
import {ANIMATION_CLIPS,clipFrame} from '../src/game/AnimationClips.js';

test('core movement clips are explicit frame sequences',()=>{
  for(const name of ['idle','run-start','run','run-stop','turn','jump-rise','jump-apex','fall','land','hard-land','dash','attack']){
    assert.ok(ANIMATION_CLIPS[name]);
    assert.ok(ANIMATION_CLIPS[name].frames.length>=2);
  }
});

test('run clip advances discrete frames and loops',()=>{
  const a=clipFrame('run',0);
  const b=clipFrame('run',.09);
  const c=clipFrame('run',.47);
  assert.notEqual(a.index,b.index);
  assert.ok(c.index>=0&&c.index<ANIMATION_CLIPS.run.frames.length);
});
