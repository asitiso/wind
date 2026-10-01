import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.addEventListener=()=>{};
globalThis.document={querySelector:()=>null};

const {Game}=await import('../src/game/Game.js');

function gameHarness(){
  const canvas={getContext:()=>({})};
  return new Game(canvas);
}

test('execution defeats the elite, drops arena barriers, and preserves the finish FX',()=>{
  const game=gameHarness();
  const elite=game.world.enemies.find(e=>e.type==='elite');
  elite.state='execution';elite.executionWindow=2;
  game.world.arena.active=true;
  game.player.x=elite.x-120;game.player.facing=1;
  assert.equal(game.performExecution(elite),true);
  assert.equal(elite.dead,true);
  assert.equal(game.world.eliteDefeated,true);
  assert.equal(game.world.arena.active,false);
  assert.ok(game.world.executionFx?.time>0);
});

test('shrine transition only opens after the ruin knight is defeated',()=>{
  const locked=gameHarness();
  locked.enterShrine();
  assert.equal(locked.world.shrine.entered,false);

  const open=gameHarness();
  open.world.eliteDefeated=true;
  open.enterShrine();
  assert.equal(open.world.shrine.entered,true);
  assert.ok(open.shrineTransition>1);
  assert.equal(open.player.x,5050);
});
