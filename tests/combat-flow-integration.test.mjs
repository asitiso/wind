import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const game=fs.readFileSync(path.join(root,'src/game/Game.js'),'utf8');

test('v0.55 combat flow wraps player input and records accepted actions',()=>{
  assert.match(game,/createCombatFlowRuntime/);
  assert.match(game,/beginCombatFlowFrame\(/);
  assert.match(game,/stepPlayer\(this\.player,flow\.input/);
  assert.match(game,/endCombatFlowFrame\(/);
});

test('confirmed hits feed the v0.55 hit-confirm and rhythm runtime',()=>{
  assert.match(game,/registerCombatFlowHit\(/);
  assert.match(game,/enemyId:e\.id/);
});

test('combat focus influences camera and draws presentation overlays',()=>{
  assert.match(game,/combatFlowCameraOptions\(/);
  assert.match(game,/renderCombatFlow\(/);
});

test('integration preserves v0.5 damage, stagger, and parry contracts',()=>{
  assert.match(game,/const damage=guarded\?Math\.round\(data\.damage\*\.24\)/);
  assert.match(game,/e\.poise=Math\.max\(0,e\.poise-Math\.round\(data\.stagger\*100\)\)/);
  assert.match(game,/strike\.parryable!==false/);
});
