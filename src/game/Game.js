import {Input} from './Input.js';
import {Renderer} from './Renderer.js';
import {createPlayer,stepPlayer} from './Player.js';
import {createWorld} from './World.js';
import {attackData,attackIsActive,openPerfectDodge} from './Combat.js';
import {burst,stepParticles} from './Effects.js';
import {cameraShake,settleCameraShake,stepCamera} from './CameraDirector.js';
import {staggerEnemy,stepEnemyAI} from './EnemyAI.js';
import {groundYAt} from './Terrain.js';
import {WORLD} from './constants.js';
import {UPPER_RUINS,upperRuinsGapAt,upperRuinsGroundYAt,upperRuinsProgress,stepFlyingEnemy} from './UpperRuins.js';
import {emitWindSlash,stepWindSlashes} from './WindMemoryStyle.js';
import {canClaimUpperRuinsFragment,canClaimWindMemory,canEnterUpperRuins,canLeaveShrine,claimUpperRuinsFragment,claimWindMemory} from './Progression.js';
import {beginCombatFlowFrame,combatFlowCameraOptions,createCombatFlowRuntime,endCombatFlowFrame,registerCombatFlowHit,renderCombatFlow,takeCombatFlowPositionAssist} from './CombatFlowRuntime.js';

const dist=(a,b)=>Math.abs(a-b);

export class Game{
  constructor(canvas){
    this.canvas=canvas;this.input=new Input();this.renderer=new Renderer(canvas);this.player=createPlayer();
    this.world=createWorld();this.camera={x:0,y:0,zoom:1,shake:0};this.time=0;this.hitStop=0;this.last=0;
    this.running=false;this.combatClock=0;this.comboCount=0;this.uiClock=0;this.perfectText='';
    this.perfectDodgeSlow=0;this.eliteIntroShown=false;this.shrineTransition=0;this.lastAnimFrame=-1;
    this.memoryReveal=0;this.upperRuinsReveal=0;
    this.combatFlow=createCombatFlowRuntime();
  }
  async start(){
    await this.renderer.load();this.running=true;requestAnimationFrame(t=>this.loop(t));
    setTimeout(()=>document.querySelector('#loading')?.classList.add('hidden'),450);
    setTimeout(()=>document.querySelector('#regionTitle')?.classList.add('show'),650);
    setTimeout(()=>document.querySelector('#regionTitle')?.classList.remove('show'),4200);
  }
  loop(t){
    if(!this.running)return;
    const raw=Math.min(.033,Math.max(0,(t-this.last)/1000||.016));this.last=t;
    const dt=this.hitStop>0?0:raw;this.time+=raw;this.world.time+=raw;
    if(this.hitStop>0)this.hitStop=Math.max(0,this.hitStop-raw);
    this.perfectDodgeSlow=Math.max(0,this.perfectDodgeSlow-raw);
    this.shrineTransition=Math.max(0,this.shrineTransition-raw);
    this.memoryReveal=Math.max(0,this.memoryReveal-raw);this.upperRuinsReveal=Math.max(0,this.upperRuinsReveal-raw);
    if(this.world.executionFx){this.world.executionFx.time=Math.max(0,this.world.executionFx.time-raw);if(this.world.executionFx.time<=0)this.world.executionFx=null;}
    this.update(dt,raw);this.renderer.render(this);renderCombatFlow(this.canvas,this.combatFlow,{player:this.player,camera:this.camera});this.updateUI();this.input.endFrame();requestAnimationFrame(n=>this.loop(n));
  }
  registerPerfectDodge(enemy){
    this.player={...this.player,combat:openPerfectDodge(this.player.combat),memory:Math.min(100,this.player.memory+14)};
    enemy.dodgedSerial=enemy.attackSerial;
    this.perfectDodgeSlow=.38;this.perfectText='PERFECT DODGE · J COUNTER';this.combatClock=1.8;
    this.camera=cameraShake(this.camera,7);
    burst(this.world,this.player.x-this.player.facing*18,this.player.y-130,'spark',24);
  }
  registerParry(enemy){
    this.player.combat.perfectTimer=.5;this.player.combat.counterWindow=.58;this.player.memory=Math.min(100,this.player.memory+18);
    Object.assign(enemy,staggerEnemy(enemy,1.0));
    this.perfectText='PERFECT PARRY · J COUNTER';this.combatClock=1.8;this.hitStop=.10;
    this.camera=cameraShake(this.camera,16);burst(this.world,enemy.x,enemy.y-150,'spark',30);
  }
  performExecution(enemy){
    if(enemy.dead||enemy.state!=='execution')return false;
    enemy.dead=true;enemy.hp=0;enemy.executionWindow=0;
    this.world.eliteDefeated=true;this.world.arena.active=false;
    this.world.executionFx={x:enemy.x,y:enemy.y,time:.95,max:.95};
    this.player.x=enemy.x-this.player.facing*118;this.player.y=groundYAt(this.player.x);this.player.vx=0;this.player.vy=0;
    this.player.combat={...this.player.combat,attack:'counter',attackTime:.04,counterWindow:0,hitIds:new Set([enemy.id])};
    this.player.memory=Math.min(100,this.player.memory+30);
    this.hitStop=.16;this.perfectDodgeSlow=.55;this.camera=cameraShake(this.camera,27);
    burst(this.world,enemy.x,enemy.y-145,'spark',58);burst(this.world,enemy.x,enemy.y-120,'hit',32);
    this.perfectText='EXECUTION · 폐허의 기사를 쓰러뜨렸다';this.combatClock=3.4;
    document.querySelector('#questMain')?.replaceChildren(document.createTextNode('무너진 신전으로 향하라'));
    document.querySelector('#questSub')?.replaceChildren(document.createTextNode('기사 뒤편의 봉인이 풀렸습니다. 신전 안으로 들어가세요.'));
    return true;
  }
  enterShrine(){
    if(this.world.shrine.entered||!this.world.eliteDefeated)return;
    this.world.shrine.entered=true;this.world.shrine.discovered=true;this.shrineTransition=1.15;
    this.player.x=5050;this.player.y=groundYAt(this.player.x);this.player.vx=0;this.player.vy=0;
    this.camera={...this.camera,x:4280,y:0,zoom:1,shake:0};
    this.perfectText='DISCOVERED · 무너진 신전 내부';this.combatClock=2.8;
    const title=document.querySelector('#regionTitle');
    if(title){title.querySelector('small')?.replaceChildren(document.createTextNode('ANCIENT SANCTUM'));title.querySelector('strong')?.replaceChildren(document.createTextNode('무너진 신전'));title.querySelector('span')?.replaceChildren(document.createTextNode('기억의 문양이 어둠 속에서 빛난다'));title.classList.add('show');setTimeout(()=>title.classList.remove('show'),3100);}
    document.querySelector('#questMain')?.replaceChildren(document.createTextNode('별빛 제단을 조사하라'));
    document.querySelector('#questSub')?.replaceChildren(document.createTextNode('신전 깊은 곳의 푸른 문양으로 향하세요.'));
  }

  claimMemory(){
    if(!claimWindMemory(this.world,this.player))return false;
    this.memoryReveal=4.4;this.hitStop=.10;this.perfectDodgeSlow=.42;this.camera=cameraShake(this.camera,11);
    burst(this.world,this.world.shrine.altarX,groundYAt(this.world.shrine.altarX)-165,'spark',46);
    this.perfectText='MEMORY AWAKENED · AIR DASH';this.combatClock=3.8;
    document.querySelector('#questMain')?.replaceChildren(document.createTextNode('초원의 상층 폐허로 돌아가라'));
    document.querySelector('#questSub')?.replaceChildren(document.createTextNode('신전을 나가 오래된 폐허의 끊어진 바람 문양을 찾아보세요.'));
    return true;
  }
  leaveShrine(){
    if(!canLeaveShrine(this.world,this.player))return false;
    this.world.shrine.entered=false;this.world.shrine.exited=true;this.shrineTransition=1.05;
    this.player.x=4740;this.player.y=groundYAt(this.player.x);this.player.vx=-80;this.player.vy=0;this.player.facing=-1;
    this.camera={...this.camera,x:3920,y:0,zoom:1,shake:0};
    this.perfectText='BACKTRACK · 새 힘으로 이전 길을 다시 보라';this.combatClock=3.1;
    const title=document.querySelector('#regionTitle');
    if(title){title.querySelector('small')?.replaceChildren(document.createTextNode('WINDRISE FRONTIER'));title.querySelector('strong')?.replaceChildren(document.createTextNode('바람이 잠든 초원'));title.querySelector('span')?.replaceChildren(document.createTextNode('새로운 바람이 오래된 길을 가리킨다'));title.classList.add('show');setTimeout(()=>title.classList.remove('show'),2800);}
    return true;
  }
  enterUpperRuins(){
    if(!canEnterUpperRuins(this.world,this.player))return false;
    this.world.upperRuins.entered=true;this.world.upperRuins.discovered=true;this.world.upperRuins.checkpointX=UPPER_RUINS.spawnX;this.shrineTransition=1.0;this.upperRuinsReveal=3.2;
    this.player.x=UPPER_RUINS.spawnX;this.player.y=upperRuinsGroundYAt(this.player.x);this.player.vx=180;this.player.vy=0;this.player.facing=1;this.player.dash=0;this.player.airDashActive=0;this.player.airDashUsed=false;
    this.camera={...this.camera,x:360,y:-52,zoom:.96,shake:0};
    this.perfectText='DISCOVERED · 바람의 상층 폐허';this.combatClock=3;
    const title=document.querySelector('#regionTitle');
    if(title){title.querySelector('small')?.replaceChildren(document.createTextNode('UPPER RUINS · WIND CORRIDOR'));title.querySelector('strong')?.replaceChildren(document.createTextNode('바람의 상층 폐허'));title.querySelector('span')?.replaceChildren(document.createTextNode('끊어진 회랑 위로 바람길이 이어진다'));title.classList.add('show');setTimeout(()=>title.classList.remove('show'),3000);}
    document.querySelector('#questMain')?.replaceChildren(document.createTextNode('바람의 잔향 3개를 회수하라'));
    document.querySelector('#questSub')?.replaceChildren(document.createTextNode('점프 후 Air Dash로 끊어진 회랑을 건너세요.'));
    return true;
  }
  leaveUpperRuins(){
    if(!this.world.upperRuins.entered||this.player.x>UPPER_RUINS.exitX+70)return false;
    this.world.upperRuins.entered=false;this.shrineTransition=.9;
    this.player.x=2080;this.player.y=groundYAt(this.player.x);this.player.vx=0;this.player.vy=0;this.player.facing=1;
    this.camera={...this.camera,x:1180,y:0,zoom:1,shake:0};
    return true;
  }
  claimUpperFragment(){
    const fragment=claimUpperRuinsFragment(this.world,this.player);if(!fragment)return false;
    const count=this.world.upperRuins.fragmentIds.length,total=UPPER_RUINS.fragments.length;
    this.perfectText=`MEMORY FRAGMENT · 바람의 잔향 ${count}/${total}`;this.combatClock=3;this.hitStop=.08;this.camera=cameraShake(this.camera,9);
    burst(this.world,fragment.x,fragment.y,'spark',38);
    if(count>=total){
      document.querySelector('#questMain')?.replaceChildren(document.createTextNode('상층 거점의 바람 문양에 도달하라'));
      document.querySelector('#questSub')?.replaceChildren(document.createTextNode('세 잔향이 하나의 바람길을 가리킵니다.'));
    }else{
      document.querySelector('#questMain')?.replaceChildren(document.createTextNode(`바람의 잔향을 더 찾아라 (${count}/${total})`));
      document.querySelector('#questSub')?.replaceChildren(document.createTextNode('비행 마물의 움직임과 푸른 빛을 따라가세요.'));
    }
    return true;
  }
  applyStrike(enemy,strike){
    const d=dist(enemy.x,this.player.x);
    const enemyCenterY=enemy.type==='flying'?enemy.y:enemy.y-120;
    const vertical=Math.abs(enemyCenterY-(this.player.y-130));
    const canReach=d<strike.range&&vertical<(strike.airborne?220:190);
    if(!canReach)return;
    if(this.player.dodgeWindow>0&&enemy.dodgedSerial!==strike.serial){this.registerPerfectDodge(enemy);return;}
    if(this.player.dash>0)return;
    if(this.player.combat.parryTimer>0&&strike.parryable!==false){this.registerParry(enemy);return;}
    if(this.player.combat.parryTimer>0&&strike.parryable===false){
      this.player.stamina=0;this.player.combat.parryTimer=0;this.perfectText='GUARD BREAK · 붉은 공격은 회피하세요';this.combatClock=2.1;
    }
    this.player.hp=Math.max(0,this.player.hp-strike.damage);this.player.hurt=.22;
    this.camera=cameraShake(this.camera,strike.guardBreak?22:strike.heavy?17:12);this.hitStop=strike.guardBreak?.095:strike.heavy?.075:.055;
    burst(this.world,this.player.x,this.player.y-140,'hit',strike.guardBreak?30:strike.heavy?24:16);
  }
  update(dt,raw){
    const controlDt=this.shrineTransition>0?0:dt;
    const terrainFn=this.world.upperRuins.entered?upperRuinsGroundYAt:groundYAt;
    const activeEnemies=this.world.upperRuins.entered?this.world.upperEnemies:this.world.enemies;
    const beforePlayer=this.player;
    const flow=beginCombatFlowFrame(this.combatFlow,this.input,controlDt,{player:this.player,attackData:attackData(this.player.combat),transitionLocked:this.shrineTransition>0,enemies:activeEnemies,bossMode:Boolean(this.world.arena.active)});
    this.combatFlow=flow.runtime;
    this.player=stepPlayer(this.player,flow.input,controlDt,terrainFn);
    this.combatFlow=endCombatFlowFrame(this.combatFlow,beforePlayer,this.player,{attackData:attackData(this.player.combat),dashActive:this.player.dash>0});
    const assist=takeCombatFlowPositionAssist(this.combatFlow,this.player,{terrainFn,minX:120,maxX:WORLD.width-180});
    this.combatFlow=assist.runtime;this.player=assist.player;
    if(this.world.shrine.entered){this.player.x=Math.max(4900,Math.min(6120,this.player.x));this.player.y=groundYAt(this.player.x);}
    if(this.world.upperRuins.entered){
      this.player.x=Math.max(UPPER_RUINS.startX,Math.min(UPPER_RUINS.endX,this.player.x));
      const gap=upperRuinsGapAt(this.player.x);
      if(this.player.x>2350)this.world.upperRuins.checkpointX=Math.max(this.world.upperRuins.checkpointX,2380);
      if(this.player.x>3900)this.world.upperRuins.checkpointX=Math.max(this.world.upperRuins.checkpointX,3900);
      if(gap&&this.player.y>UPPER_RUINS.fallY-45){
        this.player.x=this.world.upperRuins.checkpointX;this.player.y=upperRuinsGroundYAt(this.player.x);this.player.vx=0;this.player.vy=0;this.player.airDashUsed=false;this.player.hp=Math.max(1,this.player.hp-18);
        this.camera=cameraShake(this.camera,12);this.perfectText='FALL RECOVER · 마지막 바람 표식으로 복귀';this.combatClock=1.8;
      }
    }

    if(this.player.animation?.state==='run'&&this.player.animation.frame!==this.lastAnimFrame&&(this.player.animation.frame===0||this.player.animation.frame===3)){
      burst(this.world,this.player.x-this.player.facing*22,this.player.y+2,'dust',3);
    }
    this.lastAnimFrame=this.player.animation?.frame??-1;

    const eliteNow=this.world.enemies.find(e=>e.type==='elite'&&!e.dead);
    if(this.input.justPressed('execute')){
      if(eliteNow?.state==='execution'&&dist(eliteNow.x,this.player.x)<285)this.performExecution(eliteNow);
      else if(canClaimWindMemory(this.world,this.player))this.claimMemory();
      else if(canLeaveShrine(this.world,this.player))this.leaveShrine();
      else if(canClaimUpperRuinsFragment(this.world,this.player))this.claimUpperFragment();
      else if(this.world.upperRuins.entered&&this.player.x<1515)this.leaveUpperRuins();
    }
    if(canEnterUpperRuins(this.world,this.player))this.enterUpperRuins();

    if(eliteNow&&!this.world.arena.active&&!this.world.shrine.entered&&this.player.x>this.world.arena.left+70&&this.player.x<this.world.arena.right-40){this.world.arena.active=true;}
    if(this.world.arena.active&&eliteNow){this.player.x=Math.max(this.world.arena.left+34,Math.min(this.world.arena.right-34,this.player.x));}
    if(this.player.dash>0&&Math.random()<raw*28)burst(this.world,this.player.x-this.player.facing*35,this.player.y-10,'dust',2);

    emitWindSlash(this.world,this.player);
    stepWindSlashes(this.world,controlDt,activeEnemies);
    const active=attackIsActive(this.player.combat);const data=attackData(this.player.combat);
    if(active&&data){
      for(const e of activeEnemies){
        if(e.dead||e.state==='execution'||this.player.combat.hitIds.has(e.id))continue;
        const inFront=(e.x-this.player.x)*this.player.facing>0;
        const enemyCenterY=e.type==='flying'?e.y:e.y-130;
        const verticalOk=Math.abs(enemyCenterY-(this.player.y-130))<(e.type==='flying'?210:150);
        if(inFront&&verticalOk&&dist(e.x,this.player.x)<data.range){
          const guarded=e.type==='shield'&&e.state!=='stagger'&&this.player.combat.attack!=='heavy'&&this.player.combat.attack!=='counter';
          const broken=e.state==='broken';
          const damage=guarded?Math.round(data.damage*.24):Math.round(data.damage*(broken?1.28:1));
          const lethal=e.type==='elite'&&e.hp-damage<=0;
          e.hp=lethal?1:e.hp-damage;e.hurt=.14;e.facing=e.x>this.player.x?-1:1;this.player.combat.hitIds.add(e.id);
          this.comboCount++;this.combatClock=1.4;this.player.memory=Math.min(100,this.player.memory+(guarded?2:6));
          this.combatFlow=registerCombatFlowHit(this.combatFlow,{attack:this.player.combat.attack,enemyId:e.id,damage,guarded,broken,critical:this.player.combat.attack==='counter',tier:guarded?'guarded':broken?'break':'light'});
          burst(this.world,e.x,e.y-150,'spark',guarded?10:22);burst(this.world,e.x,e.y-145,'hit',guarded?6:12);
          this.hitStop=Math.max(this.hitStop,guarded?.035:data.hitStop);this.camera=cameraShake(this.camera,guarded?4:data.shake);
          if(lethal){
            e.poise=0;e.state='broken';e.stateTime=.54;e.hurt=.5;this.perfectText='FINISH READY · E 처형';this.combatClock=2.4;
          }else if(e.type==='elite'&&!guarded&&!broken){
            e.poise=Math.max(0,e.poise-Math.round(data.stagger*100));
            if(e.poise<=0){e.state='broken';e.stateTime=0;e.hurt=.5;this.perfectText=e.hp<=e.maxHp*.22?'FINISH READY · E 처형':'BREAK · 지금이 공격 기회';this.combatClock=2;this.hitStop=Math.max(this.hitStop,.12);this.camera=cameraShake(this.camera,19);burst(this.world,e.x,e.y-148,'spark',42);}
          }else if(e.type!=='elite'&&(this.player.combat.attack==='counter'||this.player.combat.attack==='heavy')){
            Object.assign(e,staggerEnemy(e,this.player.combat.attack==='counter'?1.2:.72));
          }
          if(e.hp<=0&&!e.dead){
            e.dead=true;burst(this.world,e.x,e.y-115,'dust',32);
          }
        }
      }
    }

    const enemyDt=controlDt*(this.perfectDodgeSlow>0?.24:1);
    if(this.world.upperRuins.entered){
      for(let i=0;i<this.world.upperEnemies.length;i++){
        const result=stepFlyingEnemy(this.world.upperEnemies[i],this.player,enemyDt,this.world.time);
        this.world.upperEnemies[i]=result.enemy;if(result.strike)this.applyStrike(this.world.upperEnemies[i],result.strike);
      }
    }else if(!this.world.shrine.entered){
      for(let i=0;i<this.world.enemies.length;i++){
        const current=this.world.enemies[i];const result=stepEnemyAI(current,this.player,enemyDt);
        this.world.enemies[i]=result.enemy;if(result.strike)this.applyStrike(this.world.enemies[i],result.strike);
      }
    }

    const elite=this.world.enemies.find(e=>e.type==='elite'&&!e.dead);
    if(!this.world.upperRuins.entered&&!this.world.shrine.entered&&elite&&!this.eliteIntroShown&&Math.abs(elite.x-this.player.x)<720){
      this.eliteIntroShown=true;this.perfectText='ELITE · 폐허의 기사';this.combatClock=2.1;
      document.querySelector('#eliteBanner')?.classList.add('show');setTimeout(()=>document.querySelector('#eliteBanner')?.classList.remove('show'),2300);
    }

    if(this.world.eliteDefeated&&!this.world.shrine.entered&&!this.world.shrine.completed&&!this.world.upperRuins.entered&&this.player.x>this.world.shrine.gateX)this.enterShrine();
    if(this.world.upperRuins.entered&&this.world.upperRuins.fragmentClaimed&&!this.world.upperRuins.summitReached&&this.player.x>UPPER_RUINS.summitX){
      this.world.upperRuins.summitReached=true;this.perfectText='ROUTE SECURED · 상층 거점 발견';this.combatClock=3.2;this.camera=cameraShake(this.camera,8);
      document.querySelector('#questMain')?.replaceChildren(document.createTextNode('바람의 상층 폐허 탐사 완료'));
      document.querySelector('#questSub')?.replaceChildren(document.createTextNode('새 기억이 전투와 이동 모두에서 길을 열었습니다.'));
    }

    this.combatClock=Math.max(0,this.combatClock-raw);
    if(this.combatClock===0){this.comboCount=0;this.perfectText='';}
    const nearEnemy=activeEnemies.some(e=>!e.dead&&Math.abs(e.x-this.player.x)<620);
    const cameraOptions=combatFlowCameraOptions(this.combatFlow,{bossMode:Boolean(this.world.arena.active)});
    this.camera=stepCamera(this.camera,this.player,controlDt,nearEnemy||this.combatClock>0?'combat':'exploration',cameraOptions);
    this.camera=settleCameraShake(this.camera,raw);stepParticles(this.world,dt);
    if(!this.world.shrine.entered&&!this.world.upperRuins.entered&&this.player.x>WORLD.width-520){
      this.player.x=720;this.camera.x=0;document.querySelector('#regionTitle')?.classList.add('show');
      setTimeout(()=>document.querySelector('#regionTitle')?.classList.remove('show'),2600);
    }
  }
  updateUI(){
    const hp=document.querySelector('#hpBar'),st=document.querySelector('#staminaBar'),mem=document.querySelector('#memoryBar');
    if(hp)hp.style.width=`${this.player.hp/320*100}%`;if(st)st.style.width=`${this.player.stamina}%`;if(mem)mem.style.width=`${this.player.memory}%`;
    const cr=document.querySelector('#combatReadout');const combo=document.querySelector('#comboText');const text=document.querySelector('#combatText');
    if(cr){
      cr.classList.toggle('show',this.combatClock>0||this.player.combat.counterWindow>0);
      if(combo)combo.textContent=this.comboCount>0?`${this.comboCount} HITS`:this.player.combat.counterWindow>0?'COUNTER READY':'COMBAT';
      if(text)text.textContent=this.perfectText||(this.player.combat.counterWindow>0?'J · 반격베기':'검격을 이어 적의 자세를 무너뜨려라');
    }
    const elite=this.world.enemies.find(e=>e.type==='elite');const bossHud=document.querySelector('#miniBossHud');
    if(bossHud&&elite){
      const visible=!elite.dead&&(this.world.arena.active||Math.abs(elite.x-this.player.x)<760);bossHud.classList.toggle('show',visible);
      const hpFill=document.querySelector('#miniBossHp'),poiseFill=document.querySelector('#miniBossPoise');
      if(hpFill)hpFill.style.width=`${Math.max(0,elite.hp/elite.maxHp*100)}%`;
      if(poiseFill)poiseFill.style.width=`${elite.maxPoise?Math.max(0,elite.poise/elite.maxPoise*100):0}%`;
      bossHud.classList.toggle('broken',elite.state==='broken'||elite.state==='execution');
    }
    const execute=document.querySelector('#executionPrompt');
    if(execute&&elite)execute.classList.toggle('show',!elite.dead&&elite.state==='execution'&&dist(elite.x,this.player.x)<330);
    const interaction=document.querySelector('#interactionPrompt');
    if(interaction){
      let label='';
      if(canClaimWindMemory(this.world,this.player))label='E · 별빛 제단에서 기억 흡수';
      else if(canLeaveShrine(this.world,this.player))label='E · 신전을 나가 초원으로 돌아가기';
      else if(canClaimUpperRuinsFragment(this.world,this.player))label='E · 기억 조각 회수';
      else if(this.world.upperRuins.entered&&this.player.x<UPPER_RUINS.exitX+105)label='E · 초원으로 돌아가기';
      interaction.textContent=label;interaction.classList.toggle('show',Boolean(label));
    }
    const memoryReveal=document.querySelector('#memoryReveal');
    memoryReveal?.classList.toggle('show',this.memoryReveal>0);
    const airHint=document.querySelector('#airDashHint');
    if(airHint){
      const nearGate=!this.world.shrine.entered&&!this.world.upperRuins.entered&&Math.abs(this.player.x-this.world.upperRuins.gateX)<430;
      airHint.classList.toggle('show',nearGate);
      airHint.classList.toggle('locked',nearGate&&!this.player.airDashUnlocked);
      const strong=airHint.querySelector('strong'),span=airHint.querySelector('span');
      if(strong)strong.textContent=this.player.airDashUnlocked?'SPACE → SHIFT · AIR DASH':'바람의 힘이 필요하다';
      if(span)span.textContent=this.player.airDashUnlocked?'공중에서 한 번 대시해 높은 문양을 통과하세요.':'신전의 기억을 얻으면 이 길이 열릴 것 같습니다.';
    }
    const dashSkill=document.querySelector('#dashSkillLabel');
    if(dashSkill)dashSkill.textContent=this.player.airDashUnlocked?'회피 / Air Dash':'회피 대시';
    const upperHud=document.querySelector('#upperRuinsHud');
    if(upperHud){
      upperHud.classList.toggle('show',this.world.upperRuins.entered);
      const fill=document.querySelector('#upperRuinsProgress');if(fill)fill.style.width=`${upperRuinsProgress(this.player.x)*100}%`;
      const count=this.world.upperRuins.fragmentIds?.length??0,total=UPPER_RUINS.fragments.length;const label=document.querySelector('#upperRuinsFragments');if(label)label.textContent=`바람의 잔향 ${count} / ${total}`;
    }
    const curtain=document.querySelector('#sceneCurtain');
    if(curtain){
      const t=this.shrineTransition/1.15;curtain.classList.toggle('active',this.shrineTransition>0);curtain.style.opacity=String(this.shrineTransition>0?Math.sin(Math.min(1,t)*Math.PI)*.96:0);
    }
    document.querySelector('#hud')?.classList.toggle('hud--quiet',this.combatClock<=0&&this.time<3.5);
  }
}
