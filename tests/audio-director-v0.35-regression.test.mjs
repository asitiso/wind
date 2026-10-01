import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mixPolicyForMode,
  prioritizeAudioEvents,
  duckingForEvent,
  audioModeForState,
  audioSceneForWorld,
  deriveAudioEvents,
  AudioDirector,
} from '../src/game/AudioDirector.js';

test('mode mix keeps SFX clearest in combat/boss and suppresses pause',()=>{
  assert.equal(mixPolicyForMode('combat').sfx,.57);
  assert.equal(mixPolicyForMode('boss').sfx,.60);
  assert.ok(mixPolicyForMode('story').music < mixPolicyForMode('exploration').music);
  assert.ok(mixPolicyForMode('paused').master < mixPolicyForMode('exploration').master);
});

test('event priority keeps decisive cues when many events collide',()=>{
  const events=prioritizeAudioEvents(['jump','hit','lightSwing','parry','finisher','hurt'], 'combat', 4);
  assert.deepEqual(events,['finisher','parry','hurt','hit']);
});

test('story mode filters routine combat clutter',()=>{
  const events=prioritizeAudioEvents(['lightSwing','hit','dash','memoryAwaken','worldChange','heal'], 'story', 4);
  assert.deepEqual(events,['worldChange','memoryAwaken','heal']);
  assert.deepEqual(prioritizeAudioEvents(['finisher','parry'],'paused',4),[]);
});

test('ducking policy exists only for decisive cues',()=>{
  assert.deepEqual(duckingForEvent('parry'),{strength:.42,duration:.13});
  assert.deepEqual(duckingForEvent('finisher'),{strength:.22,duration:.38});
  assert.equal(duckingForEvent('lightSwing'),null);
});

test('existing mode and scene precedence remain unchanged',()=>{
  assert.equal(audioModeForState({paused:true,story:true,boss:true}), 'paused');
  assert.equal(audioModeForState({story:true,boss:true}), 'story');
  assert.equal(audioModeForState({boss:true,nearEnemy:true}), 'boss');
  assert.equal(audioModeForState({nearEnemy:true}), 'combat');
  assert.equal(audioModeForState({}), 'exploration');
  assert.equal(audioSceneForWorld({upperRuins:{entered:true},starTower:{entered:true}}), 'starTower');
});

test('existing edge triggered event derivation remains intact',()=>{
  const prev={attack:null,dash:false,airDash:false,onGround:true,hp:100,hurt:false,memoryStyle:'wind',skillCooldown:0,comboCount:0,perfectText:'',memoryReveal:false,phaseReveal:false,worldReveal:false,execution:false};
  const next={...prev,attack:'heavy-1',dash:true,onGround:false,hp:88,hurt:true,comboCount:1,perfectText:'PERFECT PARRY'};
  const events=deriveAudioEvents(prev,next);
  assert.deepEqual(events,['heavySwing','dash','jump','hurt','hit','parry']);
});

function param(value=0){
  return {value,calls:[],setTargetAtTime(v,t,c){this.value=v;this.calls.push([v,t,c]);}};
}
function fakeBus(value=0){return {gain:param(value)};}

test('mix updates only when targets change, avoiding per-frame automation buildup',()=>{
  const d=new AudioDirector({target:{addEventListener(){}}});
  d.ctx={currentTime:10};
  d.master=fakeBus(.72);d.musicBus=fakeBus(.20);d.ambienceBus=fakeBus(.13);d.sfxBus=fakeBus(.52);
  d.mixCache={master:.72,music:.20,ambience:.13,sfx:.52};
  d.updateMix('exploration');
  assert.equal(d.master.gain.calls.length,0);
  assert.equal(d.musicBus.gain.calls.length,0);
  d.updateMix('combat');
  assert.equal(d.master.gain.calls.length,0);
  assert.equal(d.musicBus.gain.calls.length,1);
  assert.equal(d.ambienceBus.gain.calls.length,1);
  assert.equal(d.sfxBus.gain.calls.length,1);
  d.updateMix('combat');
  assert.equal(d.musicBus.gain.calls.length,1);
});

test('event cooldown suppresses rapid repetitive low-value SFX',()=>{
  const d=new AudioDirector({target:{addEventListener(){}}});
  d.ctx={currentTime:1};
  assert.equal(d.canPlayEvent('hit'),true);
  d.ctx.currentTime=1.02;
  assert.equal(d.canPlayEvent('hit'),false);
  d.ctx.currentTime=1.05;
  assert.equal(d.canPlayEvent('hit'),true);
  assert.equal(d.canPlayEvent('finisher'),true);
  assert.equal(d.canPlayEvent('finisher'),true);
});

test('ducking changes music/ambience targets and restores after expiry',()=>{
  const d=new AudioDirector({target:{addEventListener(){}}});
  d.mode='combat';d.ctx={currentTime:3};
  d.master=fakeBus(.72);d.musicBus=fakeBus(.17);d.ambienceBus=fakeBus(.10);d.sfxBus=fakeBus(.57);
  d.mixCache={master:.72,music:.17,ambience:.10,sfx:.57};
  d.applyDucking('parry');
  assert.ok(d.musicBus.gain.value < .17);
  assert.ok(d.ambienceBus.gain.value < .10);
  d.ctx.currentTime=3.2;d.duckStrength=1;d.updateMix('combat');
  assert.equal(d.musicBus.gain.value,.17);
  assert.equal(d.ambienceBus.gain.value,.10);
});

test('unpausing does not leave the paused master mix stuck',()=>{
  const d=new AudioDirector({target:{addEventListener(){}}});
  d.ctx={currentTime:5};d.mode='paused';
  d.master=fakeBus(.22);d.musicBus=fakeBus(.025);d.ambienceBus=fakeBus(.02);d.sfxBus=fakeBus(.10);
  d.mixCache={master:.22,music:.025,ambience:.02,sfx:.10};
  d.setPaused(false);
  assert.equal(d.master.gain.value,.72);
  assert.equal(d.musicBus.gain.value,.20);
});
