import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.addEventListener=()=>{};
globalThis.document={querySelector:()=>null,createTextNode:t=>t};
const {Game}=await import('../src/game/Game.js');
const {groundYAt}=await import('../src/game/Terrain.js');

function gameHarness(){return new Game({getContext:()=>({})});}

test('altar memory -> shrine exit -> air-dash gate -> upper ruins is one connected progression loop',()=>{
  const game=gameHarness();
  game.world.eliteDefeated=true;game.world.shrine.entered=true;game.player.x=game.world.shrine.altarX;
  assert.equal(game.claimMemory(),true);
  assert.equal(game.player.airDashUnlocked,true);

  game.player.x=game.world.shrine.exitX;
  assert.equal(game.leaveShrine(),true);
  assert.equal(game.world.shrine.entered,false);
  assert.equal(game.world.shrine.completed,true);

  game.player.x=game.world.upperRuins.gateX;
  game.player.y=groundYAt(game.player.x)-100;
  game.player.airDashActive=.15;
  assert.equal(game.enterUpperRuins(),true);
  assert.equal(game.world.upperRuins.entered,true);
  assert.equal(game.world.upperRuins.discovered,true);
});
