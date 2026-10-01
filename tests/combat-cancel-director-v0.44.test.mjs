import test from 'node:test';
import assert from 'node:assert/strict';
import {attackTimeline,attackCommitment,cancelWindowForAction,playerControlLocked,combatActionPermission,makeCombatReleaseGate,cancelWindowDebug} from '../src/game/CombatCancelDirector.js';

const data={startup:.10,active:.12,recovery:.28,cancelStart:.24,cancelEnd:.46,damage:32};
const player=(elapsed=.3,attack='light')=>({hp:320,reaction:{state:'idle'},recovery:{state:'ready'},combat:{attack,attackTime:elapsed,counterWindow:0}});

test('timeline respects authored cancel bounds',()=>{const t=attackTimeline(data);assert.equal(t.cancelStart,.24);assert.equal(t.cancelEnd,.46);assert.equal(t.duration,.5);});
test('timeline builds safe fallback when cancel metadata is absent',()=>{const t=attackTimeline({startup:.08,active:.1,recovery:.22});assert.ok(t.cancelStart>=.08);assert.ok(t.cancelEnd<=.4);});
test('startup cannot be cancelled by attack spam',()=>{const p=cancelWindowForAction('light',{attack:'light',attackElapsed:.05,data});assert.equal(p.allowed,false);});
test('attack cancel opens in authored late window',()=>{assert.equal(cancelWindowForAction('heavy',{attack:'light',attackElapsed:.30,data}).allowed,true);});
test('cancel closes after authored end',()=>{assert.equal(cancelWindowForAction('light',{attack:'light',attackElapsed:.49,data}).allowed,false);});
test('dash may open slightly earlier after hit confirm but never inside startup',()=>{const no=cancelWindowForAction('dash',{attack:'light',attackElapsed:.215,data,hitConfirmed:false});const yes=cancelWindowForAction('dash',{attack:'light',attackElapsed:.215,data,hitConfirmed:true});assert.equal(no.allowed,false);assert.equal(yes.allowed,true);assert.ok(yes.start>=data.startup);});
test('jump cancel is intentionally later than attack cancel',()=>{const a=cancelWindowForAction('light',{attack:'light',attackElapsed:.3,data});const j=cancelWindowForAction('jump',{attack:'light',attackElapsed:.3,data});assert.ok(j.start>a.start);});
test('skill cancel is later than standard attack link',()=>{const a=cancelWindowForAction('light',{attack:'light',attackElapsed:.3,data});const s=cancelWindowForAction('skill1',{attack:'light',attackElapsed:.3,data});assert.ok(s.start>a.start);});
test('heavy attacks preserve more commitment before attack-to-attack cancel',()=>{const light=cancelWindowForAction('light',{attack:'light',attackElapsed:.31,data});const heavy=cancelWindowForAction('light',{attack:'heavy',attackElapsed:.31,data:{...data,damage:82}});assert.ok(heavy.start>=light.start);});
test('defensive cancel on heavy remains possible in the latter active/recovery section',()=>{const p=cancelWindowForAction('dash',{attack:'heavy',attackElapsed:.30,data:{...data,damage:82}});assert.equal(p.allowed,true);});
test('counter attacks can link to another attack quickly',()=>{const p=cancelWindowForAction('heavy',{attack:'counter',attackElapsed:.19,data});assert.ok(p.start<data.cancelStart);});
test('counterWindow overrides ordinary cancel timing for light/heavy',()=>{const p=player(.05);p.combat.counterWindow=.4;assert.equal(combatActionPermission(p,'heavy',{data}).reason,'counter-window');});
test('counterWindow does not make jump free',()=>{const p=player(.05);p.combat.counterWindow=.4;assert.equal(combatActionPermission(p,'jump',{data}).allowed,false);});
test('idle player can accept buffered combat action immediately',()=>{const p=player(0,null);assert.equal(combatActionPermission(p,'light',{data}).allowed,true);});
test('knockdown blocks buffered release',()=>{const p=player(0,null);p.reaction.state='knockdown';assert.equal(playerControlLocked(p),true);assert.equal(combatActionPermission(p,'dash',{data}).allowed,false);});
test('death blocks release',()=>{const p=player(0,null);p.hp=0;assert.equal(combatActionPermission(p,'light',{data}).allowed,false);});
test('transition lock blocks release without touching player state',()=>{assert.equal(combatActionPermission(player(0,null),'light',{transitionLocked:true}).allowed,false);});
test('release gate can layer a resource-specific extra gate',()=>{const gate=makeCombatReleaseGate(player(.3),{attackData:data,extraGate:a=>a!=='heavy'});assert.equal(gate('light'),true);assert.equal(gate('heavy'),false);});
test('debug output is compact and stable',()=>{assert.deepEqual(cancelWindowDebug(player(.3),'light',{data}),{action:'light',allowed:true,reason:'cancel-window',start:.24,end:.46,progress:.6});});
test('attack commitment classification supports heavy/counter/skill',()=>{assert.equal(attackCommitment('moonHeavy',{}),'heavy');assert.equal(attackCommitment('counter',{}),'counter');assert.equal(attackCommitment('skillSlash',{}),'skill');});
