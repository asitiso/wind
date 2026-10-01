import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayer,stepPlayer} from '../src/game/Player.js';
import {createWorld} from '../src/game/World.js';
import {groundYAt} from '../src/game/Terrain.js';
import {canEnterUpperRuins,claimUpperRuinsFragment,claimWindMemory} from '../src/game/Progression.js';
import {UPPER_RUINS} from '../src/game/UpperRuins.js';

function input({down=[],pressed=[],released=[]}={}){
  const d=new Set(down),p=new Set(pressed),r=new Set(released);
  return {isDown:k=>d.has(k),justPressed:k=>p.has(k),justReleased:k=>r.has(k)};
}

test('air dash is locked before the first memory and becomes one-use-per-airtime after unlock',()=>{
  let player=createPlayer();
  player={...player,onGround:false,y:groundYAt(player.x)-120,vy:-80,dashCooldown:0,stamina:100};
  let next=stepPlayer(player,input({pressed:['dash']}),.016);
  assert.equal(next.dash,0);
  assert.equal(next.airDashActive,0);

  player={...player,airDashUnlocked:true,airDashUsed:false,dashCooldown:0,stamina:100};
  next=stepPlayer(player,input({pressed:['dash']}),.016);
  assert.ok(next.airDashActive>0);
  assert.equal(next.airDashUsed,true);
  assert.ok(next.vx>1000);

  const second=stepPlayer({...next,dash:0,airDashActive:0,dashCooldown:0},input({pressed:['dash']}),.016);
  assert.equal(second.dash,0);
});

test('wind memory unlocks air dash and enables the previously sealed upper ruin gate',()=>{
  const world=createWorld();
  const player=createPlayer();
  world.eliteDefeated=true;world.shrine.entered=true;player.x=world.shrine.altarX;
  assert.equal(claimWindMemory(world,player),true);
  assert.equal(world.memory.windSwordsman,true);
  assert.equal(world.shrine.memoryClaimed,true);
  assert.equal(player.airDashUnlocked,true);

  world.shrine.entered=false;
  player.x=world.upperRuins.gateX;
  player.y=groundYAt(world.upperRuins.gateX)-110;
  player.airDashActive=.12;
  assert.equal(canEnterUpperRuins(world,player),true);
});

test('upper ruins expands into three one-time memory fragment rewards',()=>{
  const world=createWorld();const player=createPlayer();world.upperRuins.entered=true;player.memory=40;
  for(const [index,fragment] of UPPER_RUINS.fragments.entries()){
    player.x=fragment.x;player.y=fragment.y+120;
    assert.equal(claimUpperRuinsFragment(world,player)?.id,fragment.id);
    assert.equal(world.upperRuins.fragmentIds.length,index+1);
  }
  assert.equal(world.upperRuins.fragmentClaimed,true);
  assert.equal(player.memory,94);
  assert.equal(claimUpperRuinsFragment(world,player),false);
});
