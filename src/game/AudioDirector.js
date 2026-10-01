const BOSS_TYPES=new Set(['guardian','fireGiant','crystalGolem','cathedralBoss','desertBoss','silverRival','silverRival2','moonlessKing']);

export const AUDIO_SCENES={
  field:{root:146.83,tempo:72,scale:[0,3,5,7,10],air:'wind',brightness:1700},
  upperRuins:{root:164.81,tempo:82,scale:[0,2,5,7,9],air:'highWind',brightness:2400},
  guardian:{root:130.81,tempo:76,scale:[0,3,5,6,10],air:'stoneWind',brightness:1250},
  redForest:{root:138.59,tempo:78,scale:[0,3,5,7,8],air:'embers',brightness:1050},
  ashenCave:{root:110.00,tempo:64,scale:[0,3,5,7,10],air:'cave',brightness:720},
  undergroundCity:{root:123.47,tempo:68,scale:[0,2,5,7,10],air:'water',brightness:920},
  cathedral:{root:116.54,tempo:62,scale:[0,3,5,7,10],air:'cathedral',brightness:760},
  starDesert:{root:155.56,tempo:74,scale:[0,2,4,7,9],air:'sand',brightness:1450},
  starTower:{root:174.61,tempo:70,scale:[0,2,5,7,11],air:'stars',brightness:2100},
  moonlessCastle:{root:103.83,tempo:66,scale:[0,1,5,7,8],air:'void',brightness:620},
};

const AUDIO_MIX={
  exploration:{music:.20,ambience:.13,sfx:.52,master:.72},
  combat:{music:.17,ambience:.10,sfx:.57,master:.72},
  boss:{music:.20,ambience:.08,sfx:.60,master:.74},
  story:{music:.08,ambience:.07,sfx:.58,master:.70},
  paused:{music:.025,ambience:.02,sfx:.10,master:.22},
};

const EVENT_PRIORITY={
  finisher:100,bossPhase:96,worldChange:94,memoryAwaken:92,parry:90,break:88,perfectDodge:86,counter:84,skill:78,hurt:74,heal:68,
  heavySwing:62,airDash:56,dash:52,hit:48,lightSwing:44,memorySwap:42,land:30,jump:26,
};

const EVENT_COOLDOWN={
  hit:.045,lightSwing:.065,heavySwing:.09,dash:.09,airDash:.12,jump:.08,land:.10,hurt:.10,heal:.16,skill:.14,memorySwap:.12,
};

const STORY_ALLOWED=new Set(['finisher','bossPhase','worldChange','memoryAwaken','memorySwap','heal']);
const DUCKING={
  parry:{strength:.42,duration:.13},break:{strength:.48,duration:.20},perfectDodge:{strength:.58,duration:.10},counter:{strength:.58,duration:.10},
  bossPhase:{strength:.30,duration:.34},worldChange:{strength:.36,duration:.46},memoryAwaken:{strength:.40,duration:.40},finisher:{strength:.22,duration:.38},
};

export function mixPolicyForMode(mode='exploration'){
  return AUDIO_MIX[mode]??AUDIO_MIX.exploration;
}

export function prioritizeAudioEvents(events=[],mode='exploration',limit=4){
  const unique=[...new Set(events)];
  const filtered=mode==='paused'?[]:mode==='story'?unique.filter(event=>STORY_ALLOWED.has(event)):unique;
  return filtered.sort((a,b)=>(EVENT_PRIORITY[b]??0)-(EVENT_PRIORITY[a]??0)).slice(0,Math.max(0,limit));
}

export function duckingForEvent(name){
  return DUCKING[name]??null;
}

export function audioSceneForWorld(world={}){
  if(world.moonlessCastle?.entered)return 'moonlessCastle';
  if(world.starTower?.entered)return 'starTower';
  if(world.starDesert?.entered)return 'starDesert';
  if(world.sunkenCathedral?.entered)return 'cathedral';
  if(world.undergroundCity?.entered)return 'undergroundCity';
  if(world.ashenCave?.entered)return 'ashenCave';
  if(world.redForest?.entered)return 'redForest';
  if(world.guardianArena?.entered)return 'guardian';
  if(world.upperRuins?.entered)return 'upperRuins';
  return 'field';
}

export function audioModeForState({paused=false,story=false,boss=false,nearEnemy=false,combatClock=0}={}){
  if(paused)return 'paused';
  if(story)return 'story';
  if(boss)return 'boss';
  if(nearEnemy||combatClock>0)return 'combat';
  return 'exploration';
}

export function storyAudioActive(game={}){
  const keys=['memoryReveal','secondMemoryReveal','moonMemoryReveal','starMemoryReveal','guardianIntro','bossPhaseReveal','guardianFinishReveal','worldChangeReveal','fireGiantIntro','fireGiantPhaseReveal','fireGiantFinishReveal','forestWorldChangeReveal','golemIntro','golemPhaseReveal','ancientCityReveal','cathedralBossReveal','cathedralFinishReveal','desertBossReveal','desertBossPhaseReveal','desertBossFinishReveal','desertWorldChangeReveal','kingReveal','kingPhaseReveal','kingFinishReveal','kingWorldChangeReveal','epilogueReveal','ngPlusReveal'];
  return keys.some(key=>(game[key]??0)>.05)||(game.shrineTransition??0)>.05;
}

export function audioSnapshot(game={}){
  const p=game.player??{};
  return {
    attack:p.combat?.attack??null,
    dash:(p.dash??0)>0,
    airDash:(p.airDashActive??0)>0,
    onGround:p.onGround!==false,
    hp:Number.isFinite(p.hp)?p.hp:0,
    hurt:(p.hurt??0)>0,
    memoryStyle:p.memoryStyle??'wind',
    skillCooldown:Number.isFinite(p.windSkillCooldown)?p.windSkillCooldown:0,
    comboCount:Number.isFinite(game.comboCount)?game.comboCount:0,
    perfectText:game.perfectText??'',
    memoryReveal:(game.memoryReveal??0)>.05||(game.secondMemoryReveal??0)>.05||(game.moonMemoryReveal??0)>.05||(game.starMemoryReveal??0)>.05,
    phaseReveal:(game.bossPhaseReveal??0)>.05||(game.fireGiantPhaseReveal??0)>.05||(game.golemPhaseReveal??0)>.05||(game.desertBossPhaseReveal??0)>.05||(game.kingPhaseReveal??0)>.05,
    worldReveal:(game.worldChangeReveal??0)>.05||(game.forestWorldChangeReveal??0)>.05||(game.desertWorldChangeReveal??0)>.05||(game.kingWorldChangeReveal??0)>.05,
    execution:Boolean(game.world?.executionFx),
  };
}

export function deriveAudioEvents(prev,next){
  if(!prev)return [];
  const events=[];
  if(next.attack&&next.attack!==prev.attack){
    if(next.attack==='counter')events.push('counter');
    else if(/heavy/i.test(next.attack))events.push('heavySwing');
    else events.push('lightSwing');
  }
  if(next.airDash&&!prev.airDash)events.push('airDash');
  else if(next.dash&&!prev.dash)events.push('dash');
  if(!next.onGround&&prev.onGround)events.push('jump');
  if(next.onGround&&!prev.onGround)events.push('land');
  if(next.hp<prev.hp||next.hurt&&!prev.hurt)events.push('hurt');
  if(next.hp>prev.hp)events.push('heal');
  if(next.comboCount>prev.comboCount)events.push('hit');
  if(next.skillCooldown>prev.skillCooldown+.2)events.push('skill');
  if(next.memoryStyle!==prev.memoryStyle)events.push('memorySwap');
  if(next.memoryReveal&&!prev.memoryReveal)events.push('memoryAwaken');
  if(next.phaseReveal&&!prev.phaseReveal)events.push('bossPhase');
  if(next.worldReveal&&!prev.worldReveal)events.push('worldChange');
  if(next.execution&&!prev.execution)events.push('finisher');
  if(next.perfectText!==prev.perfectText){
    if(/PERFECT DODGE|STAR STEP/.test(next.perfectText))events.push('perfectDodge');
    if(/PARRY/.test(next.perfectText))events.push('parry');
    if(/BREAK/.test(next.perfectText))events.push('break');
  }
  return [...new Set(events)];
}

const freq=(root,semitone,octave=0)=>root*Math.pow(2,(semitone+octave*12)/12);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export class AudioDirector{
  constructor({target=globalThis,canvas=null}={}){
    this.target=target;this.canvas=canvas;this.ctx=null;this.master=null;this.musicBus=null;this.ambienceBus=null;this.sfxBus=null;this.noiseBuffer=null;
    this.scene='field';this.mode='exploration';this.muted=false;this.paused=false;this.prev=null;this.nextBeatAt=0;this.stepIndex=0;this.ambientSource=null;this.ambientFilter=null;this.ambientGain=null;this.drone=null;this.droneGain=null;
    this.eventLastAt=new Map();this.duckUntil=0;this.duckStrength=1;this.mixCache={};
    this.unlockHandler=()=>this.unlock();
    target?.addEventListener?.('keydown',this.unlockHandler,{passive:true});canvas?.addEventListener?.('pointerdown',this.unlockHandler,{passive:true});
  }
  supported(){return Boolean(this.target?.AudioContext||this.target?.webkitAudioContext)}
  ensureContext(){
    if(this.ctx||!this.supported())return this.ctx;
    const Ctx=this.target.AudioContext||this.target.webkitAudioContext;this.ctx=new Ctx();
    this.master=this.ctx.createGain();this.musicBus=this.ctx.createGain();this.ambienceBus=this.ctx.createGain();this.sfxBus=this.ctx.createGain();
    this.musicBus.connect(this.master);this.ambienceBus.connect(this.master);this.sfxBus.connect(this.master);this.master.connect(this.ctx.destination);
    const mix=mixPolicyForMode(this.mode);this.master.gain.value=this.muted?0:mix.master;this.musicBus.gain.value=mix.music;this.ambienceBus.gain.value=mix.ambience;this.sfxBus.gain.value=mix.sfx;this.mixCache={master:this.master.gain.value,music:mix.music,ambience:mix.ambience,sfx:mix.sfx};
    this.noiseBuffer=this.createNoiseBuffer();this.createAmbience();return this.ctx;
  }
  unlock(){const ctx=this.ensureContext();ctx?.resume?.().catch?.(()=>{});}
  createNoiseBuffer(){
    if(!this.ctx)return null;const length=Math.max(1,Math.floor(this.ctx.sampleRate*2));const buffer=this.ctx.createBuffer(1,length,this.ctx.sampleRate);const data=buffer.getChannelData(0);let last=0;
    for(let i=0;i<length;i++){const white=Math.random()*2-1;last=last*.985+white*.015;data[i]=white*.42+last*.58;}return buffer;
  }
  createAmbience(){
    if(!this.ctx||!this.noiseBuffer)return;this.ambientSource=this.ctx.createBufferSource();this.ambientSource.buffer=this.noiseBuffer;this.ambientSource.loop=true;this.ambientFilter=this.ctx.createBiquadFilter();this.ambientFilter.type='lowpass';this.ambientGain=this.ctx.createGain();this.ambientGain.gain.value=.16;this.ambientSource.connect(this.ambientFilter);this.ambientFilter.connect(this.ambientGain);this.ambientGain.connect(this.ambienceBus);this.ambientSource.start();
    this.drone=this.ctx.createOscillator();this.drone.type='sine';this.droneGain=this.ctx.createGain();this.droneGain.gain.value=.018;this.drone.connect(this.droneGain);this.droneGain.connect(this.ambienceBus);this.drone.start();
  }
  toggleMuted(){this.muted=!this.muted;if(this.master&&this.ctx){const mix=mixPolicyForMode(this.mode);const target=this.muted?0:mix.master;this.master.gain.setTargetAtTime(target,this.ctx.currentTime,.035);this.mixCache.master=target;}return this.muted}
  setPaused(value){this.paused=Boolean(value);const mode=this.paused?'paused':this.mode==='paused'?'exploration':this.mode;this.updateMix(mode);}
  updateMix(mode=this.mode){
    if(!this.ctx||!this.master||!this.musicBus||!this.ambienceBus||!this.sfxBus)return;const now=this.ctx.currentTime;const mix=mixPolicyForMode(mode);const duck=now<this.duckUntil?this.duckStrength:1;
    const targets={master:this.muted?0:mix.master,music:mix.music*duck,ambience:mix.ambience*Math.max(.45,duck),sfx:mix.sfx};
    const apply=(key,param,timeConstant)=>{if(Math.abs((this.mixCache[key]??-1)-targets[key])<.001)return;param.setTargetAtTime(targets[key],now,timeConstant);this.mixCache[key]=targets[key];};
    apply('master',this.master.gain,.06);apply('music',this.musicBus.gain,.055);apply('ambience',this.ambienceBus.gain,.07);apply('sfx',this.sfxBus.gain,.035);
  }
  applyDucking(name){
    if(!this.ctx)return;const spec=duckingForEvent(name);if(!spec)return;const now=this.ctx.currentTime;this.duckUntil=Math.max(this.duckUntil,now+spec.duration);this.duckStrength=Math.min(this.duckStrength,spec.strength);this.updateMix(this.mode);
  }
  canPlayEvent(name){
    if(!this.ctx)return false;const cooldown=EVENT_COOLDOWN[name]??0;if(cooldown<=0)return true;const now=this.ctx.currentTime;const last=this.eventLastAt.get(name)??-Infinity;if(now-last<cooldown)return false;this.eventLastAt.set(name,now);return true;
  }
  tone({frequency=440,duration=.1,gain=.08,type='sine',bus='sfx',when=0,slide=0}){
    if(!this.ctx||this.ctx.state!=='running'||this.muted)return;const now=this.ctx.currentTime+when;const osc=this.ctx.createOscillator(),amp=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(frequency,now);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,frequency+slide),now+duration);amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+.008);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(amp);amp.connect(bus==='music'?this.musicBus:bus==='ambience'?this.ambienceBus:this.sfxBus);osc.start(now);osc.stop(now+duration+.03);
  }
  noise({duration=.09,gain=.06,highpass=500,when=0}){
    if(!this.ctx||this.ctx.state!=='running'||this.muted||!this.noiseBuffer)return;const now=this.ctx.currentTime+when;const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),amp=this.ctx.createGain();src.buffer=this.noiseBuffer;filter.type='highpass';filter.frequency.value=highpass;amp.gain.setValueAtTime(Math.max(.0002,gain),now);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);src.connect(filter);filter.connect(amp);amp.connect(this.sfxBus);src.start(now);src.stop(now+duration+.02);
  }
  playSfx(name){
    if(!this.ctx||this.ctx.state!=='running'||this.muted||!this.canPlayEvent(name))return;this.applyDucking(name);
    const p=AUDIO_SCENES[this.scene]??AUDIO_SCENES.field;
    if(name==='hit'){this.noise({duration:.055,gain:.055,highpass:680});this.tone({frequency:210,duration:.065,gain:.035,type:'triangle',slide:-55});}
    else if(name==='skill'){this.noise({duration:.16,gain:.065,highpass:1100});[0,5,12].forEach((s,i)=>this.tone({frequency:freq(p.root,s,2),duration:.20,gain:.038,type:'triangle',when:i*.028}));}
    else if(name==='lightSwing'){this.noise({duration:.075,gain:.045,highpass:1450});this.tone({frequency:740,duration:.065,gain:.025,type:'triangle',slide:-280});}
    else if(name==='heavySwing'){this.noise({duration:.13,gain:.075,highpass:820});this.tone({frequency:310,duration:.14,gain:.055,type:'sawtooth',slide:-160});}
    else if(name==='counter'){this.tone({frequency:880,duration:.08,gain:.06,type:'triangle'});this.tone({frequency:1320,duration:.13,gain:.045,type:'sine',when:.035});this.noise({duration:.11,gain:.07,highpass:1800});}
    else if(name==='dash'){this.noise({duration:.11,gain:.055,highpass:900});this.tone({frequency:280,duration:.10,gain:.025,type:'triangle',slide:220});}
    else if(name==='airDash'){this.noise({duration:.18,gain:.07,highpass:1100});this.tone({frequency:420,duration:.16,gain:.05,type:'sine',slide:520});}
    else if(name==='jump')this.tone({frequency:320,duration:.08,gain:.022,type:'sine',slide:120});
    else if(name==='land'){this.noise({duration:.07,gain:.032,highpass:180});this.tone({frequency:95,duration:.08,gain:.022,type:'sine',slide:-28});}
    else if(name==='hurt'){this.noise({duration:.11,gain:.075,highpass:300});this.tone({frequency:150,duration:.12,gain:.05,type:'sawtooth',slide:-55});}
    else if(name==='heal'){[0,4,7,12].forEach((s,i)=>this.tone({frequency:freq(220,s),duration:.22,gain:.032,type:'sine',when:i*.045}));}
    else if(name==='perfectDodge'){this.tone({frequency:freq(p.root,7,2),duration:.17,gain:.055,type:'sine',slide:260});this.tone({frequency:freq(p.root,12,2),duration:.22,gain:.04,type:'triangle',when:.035});}
    else if(name==='parry'){this.tone({frequency:1760,duration:.055,gain:.075,type:'square'});this.tone({frequency:880,duration:.11,gain:.05,type:'triangle',when:.018});this.noise({duration:.08,gain:.08,highpass:2200});}
    else if(name==='break'){this.tone({frequency:92,duration:.25,gain:.085,type:'sawtooth',slide:-24});this.noise({duration:.22,gain:.095,highpass:180});}
    else if(name==='memorySwap'){[0,5,9].forEach((s,i)=>this.tone({frequency:freq(p.root,s,1),duration:.16,gain:.035,type:'triangle',when:i*.035}));}
    else if(name==='memoryAwaken'){[0,5,7,12,17].forEach((s,i)=>this.tone({frequency:freq(p.root,s,1),duration:.55,gain:.04,type:'sine',when:i*.09}));}
    else if(name==='bossPhase'){this.tone({frequency:p.root/2,duration:.55,gain:.09,type:'sawtooth',slide:p.root*.18});this.noise({duration:.28,gain:.09,highpass:120});}
    else if(name==='worldChange'){[0,5,9,12,16].forEach((s,i)=>this.tone({frequency:freq(p.root,s,1),duration:.75,gain:.038,type:'sine',when:i*.11}));}
    else if(name==='finisher'){this.noise({duration:.24,gain:.12,highpass:520});this.tone({frequency:74,duration:.42,gain:.11,type:'sawtooth',slide:-30});this.tone({frequency:1480,duration:.18,gain:.065,type:'triangle',when:.035,slide:420});}
  }
  updateAmbience(profile,mode){
    if(!this.ctx||!this.ambientFilter||!this.ambientGain||!this.drone)return;const now=this.ctx.currentTime;const modeGain=mode==='paused'?.02:mode==='story'?.09:mode==='boss'?.10:.15;this.ambientFilter.frequency.setTargetAtTime(profile.brightness,now,.4);this.ambientGain.gain.setTargetAtTime(modeGain,now,.5);this.drone.frequency.setTargetAtTime(profile.root/2,now,.5);this.droneGain.gain.setTargetAtTime(mode==='boss'?.032:mode==='combat'?.024:.018,now,.5);
  }
  scheduleMusic(profile,mode){
    if(!this.ctx||this.ctx.state!=='running'||this.muted||mode==='paused')return;const now=this.ctx.currentTime;if(this.nextBeatAt<now-.5)this.nextBeatAt=now+.02;if(now+.09<this.nextBeatAt)return;
    const beat=60/profile.tempo;const step=this.stepIndex++;const scale=profile.scale;const semitone=scale[step%scale.length];const boss=mode==='boss',combat=mode==='combat';
    const octave=boss?0:combat?1:1;const gain=boss?.052:combat?.038:mode==='story'?.026:.022;this.tone({frequency:freq(profile.root,semitone,octave),duration:Math.min(.62,beat*.78),gain,type:boss?'sawtooth':combat?'triangle':'sine',bus:'music',when:Math.max(0,this.nextBeatAt-now)});
    if(step%4===0)this.tone({frequency:freq(profile.root,scale[(step+2)%scale.length],octave-1),duration:beat*1.8,gain:gain*.55,type:'sine',bus:'music',when:Math.max(0,this.nextBeatAt-now)});
    if(combat||boss){this.noise({duration:.035,gain:boss?.03:.018,highpass:boss?110:180,when:Math.max(0,this.nextBeatAt-now)});}
    this.nextBeatAt+=beat*(boss?.5:combat?.5:1);
  }
  step(game,dt,{nearEnemy=false,boss=false}={}){
    const scene=audioSceneForWorld(game?.world);const story=storyAudioActive(game);const mode=audioModeForState({paused:this.paused,story,boss,nearEnemy,combatClock:game?.combatClock??0});
    if(scene!==this.scene){this.scene=scene;this.nextBeatAt=this.ctx?.currentTime??0;this.stepIndex=0;}
    this.mode=mode;const profile=AUDIO_SCENES[scene]??AUDIO_SCENES.field;const next=audioSnapshot(game);const rawEvents=deriveAudioEvents(this.prev,next);const events=prioritizeAudioEvents(rawEvents,mode,4);this.prev=next;
    if(this.ctx&&this.ctx.currentTime>=this.duckUntil)this.duckStrength=1;this.updateMix(mode);this.updateAmbience(profile,mode);for(const event of events)this.playSfx(event);this.scheduleMusic(profile,mode);return {scene,mode,events};
  }
}

export function isBossEnemyType(type){return BOSS_TYPES.has(type)}
