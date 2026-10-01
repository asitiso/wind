import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBAT_PRESENTATION,
  telegraphVisual,
  telegraphReach,
  impactTier,
  impactFeedback,
  phaseTransitionProfile,
  OPENING_PACING,
} from '../src/game/CombatPresentation.js';

test('telegraph color language remains unchanged',()=>{
  const safe=telegraphVisual({progress:1,parryable:true});
  const danger=telegraphVisual({progress:1,parryable:false});
  assert.equal(safe.danger,false);
  assert.equal(danger.danger,true);
  assert.match(safe.stroke,/142,211,255/);
  assert.match(danger.stroke,/255,72,86/);
});

test('telegraph progress remains clamped and boss line stays stronger',()=>{
  const normal=telegraphVisual({progress:4,boss:false});
  const boss=telegraphVisual({progress:4,boss:true});
  assert.ok(normal.pulse<=1.42);
  assert.ok(boss.lineWidth>normal.lineWidth);
});

test('telegraph reach keeps the existing minimum contract',()=>{
  assert.equal(telegraphReach(0),90);
  assert.ok(telegraphReach(300,1)>300);
});

test('guarded hits are deliberately quiet',()=>{
  const f=impactFeedback({damage:120,shake:30,hitStop:.2},{guarded:true,critical:true});
  assert.equal(f.tier,'guarded');
  assert.equal(f.sparkCount,6);
  assert.equal(f.hitCount,2);
  assert.ok(f.hitStop<=.028);
  assert.ok(f.shake<=3);
});

test('light hits keep quick short feedback',()=>{
  const f=impactFeedback({damage:28,shake:4,hitStop:.04});
  assert.equal(f.tier,'light');
  assert.equal(f.hitStop,.04);
  assert.equal(f.shake,4);
  assert.equal(f.sparkCount,14);
});

test('medium hits get a distinct middle weight band',()=>{
  const f=impactFeedback({damage:54,shake:4,hitStop:.035});
  assert.equal(f.tier,'medium');
  assert.equal(f.hitStop,.048);
  assert.equal(f.shake,5);
  assert.ok(f.sparkCount>COMBAT_PRESENTATION.impact.light.sparkCount);
});

test('heavy hits are no longer clamped down by weak source values',()=>{
  const f=impactFeedback({damage:78,shake:4,hitStop:.04});
  assert.equal(f.tier,'heavy');
  assert.equal(f.hitStop,.068);
  assert.equal(f.shake,8);
  assert.ok(f.hitStop>impactFeedback({damage:30,shake:4,hitStop:.04}).hitStop);
});

test('critical attacks promote to finisher feedback regardless of base damage',()=>{
  const f=impactFeedback({damage:30,shake:3,hitStop:.03},{critical:true});
  assert.equal(f.tier,'finisher');
  assert.equal(f.hitStop,.09);
  assert.equal(f.shake,11);
  assert.equal(f.sparkCount,36);
});

test('extreme authoring values are capped to prevent camera abuse',()=>{
  const f=impactFeedback({damage:999,shake:200,hitStop:2});
  assert.equal(f.tier,'finisher');
  assert.equal(f.hitStop,.115);
  assert.equal(f.shake,16);
});

test('impact tiers can also be inferred from authored hit stop or shake',()=>{
  assert.equal(impactTier({damage:20,shake:13,hitStop:.02}),'heavy');
  assert.equal(impactTier({damage:20,shake:2,hitStop:.052}),'medium');
  assert.equal(impactTier({damage:20,shake:2,hitStop:.10}),'finisher');
});

test('non-finite attack data fails safely into light feedback',()=>{
  const f=impactFeedback({damage:NaN,shake:Infinity,hitStop:NaN});
  assert.equal(f.tier,'light');
  assert.equal(f.hitStop,.034);
  assert.equal(f.shake,3);
});

test('visual density rises monotonically with impact tier',()=>{
  const tiers=['guarded','light','medium','heavy','finisher'];
  for(let i=1;i<tiers.length;i++){
    const prev=COMBAT_PRESENTATION.impact[tiers[i-1]];
    const next=COMBAT_PRESENTATION.impact[tiers[i]];
    assert.ok(next.sparkCount>prev.sparkCount);
    assert.ok(next.hitCount>prev.hitCount);
    assert.ok(next.flash>prev.flash);
    assert.ok(next.ringScale>prev.ringScale);
  }
});

test('phase transition timing remains compatible with existing callers',()=>{
  assert.deepEqual(phaseTransitionProfile(2),{duration:2.35,combatClock:2.4,hitStop:.075,shake:15});
  assert.deepEqual(phaseTransitionProfile(2,{rival:true}),{duration:2.25,combatClock:2.35,hitStop:.06,shake:13});
  assert.deepEqual(phaseTransitionProfile(3),{duration:2.65,combatClock:2.6,hitStop:.10,shake:18});
});

test('opening pacing positions are untouched',()=>{
  assert.deepEqual(OPENING_PACING,{firstEnemyX:1480,shieldEnemyX:2180,archerEnemyX:2680,eliteEnemyX:3650,arenaLeft:3240,arenaRight:4260});
});
