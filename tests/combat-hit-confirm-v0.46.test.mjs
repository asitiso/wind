import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyHitConfirm,registerHitConfirm,stepHitConfirm,hitConfirmQuality,hitConfirmPermission,clearHitConfirm,HIT_CONFIRM_WINDOWS} from '../src/game/CombatHitConfirm.js';

test('empty hit confirm is inert',()=>assert.deepEqual(emptyHitConfirm(),{active:false,ttl:0,max:0,quality:null,attack:null,enemyId:null,serial:0,contact:false,offensive:false}));
test('guarded contact does not grant offensive hit confirm',()=>{const s=registerHitConfirm(emptyHitConfirm(),{guarded:true,attack:'light'});assert.equal(s.contact,true);assert.equal(s.offensive,false);assert.equal(s.quality,'guarded');});
test('damaging light hit grants short offensive confirm',()=>{const s=registerHitConfirm(emptyHitConfirm(),{damage:20,attack:'light'});assert.equal(s.offensive,true);assert.equal(s.ttl,HIT_CONFIRM_WINDOWS.light);});
test('heavy hit retains confirm longer than light',()=>assert.ok(registerHitConfirm(emptyHitConfirm(),{damage:90}).ttl>registerHitConfirm(emptyHitConfirm(),{damage:20}).ttl));
test('critical wins quality classification',()=>assert.equal(hitConfirmQuality({critical:true,damage:1}),'critical'));
test('break wins over raw damage classification',()=>assert.equal(hitConfirmQuality({broken:true,damage:10}),'break'));
test('explicit tier is respected',()=>assert.equal(hitConfirmQuality({tier:'medium',damage:2}),'medium'));
test('confirm expires deterministically',()=>{let s=registerHitConfirm(emptyHitConfirm(),{damage:30});s=stepHitConfirm(s,s.max+.01);assert.equal(s.active,false);assert.equal(s.ttl,0);});
test('negative dt does not extend timer',()=>{const s=registerHitConfirm(emptyHitConfirm(),{damage:30});assert.equal(stepHitConfirm(s,-1).ttl,s.ttl);});
test('window authoring is safely clamped',()=>{assert.equal(registerHitConfirm(emptyHitConfirm(),{window:2}).ttl,.24);assert.equal(registerHitConfirm(emptyHitConfirm(),{window:.001}).ttl,.045);});
test('confirm only matches the attack that produced it when authored',()=>{const s=registerHitConfirm(emptyHitConfirm(),{attack:'heavy',damage:90});assert.equal(hitConfirmPermission(s,'light').boost,false);assert.equal(hitConfirmPermission(s,'heavy').boost,true);});
test('guard contact may soften defensive response only',()=>{const s=registerHitConfirm(emptyHitConfirm(),{attack:'light',guarded:true});assert.equal(hitConfirmPermission(s,'light',{forAction:'defense'}).boost,true);assert.equal(hitConfirmPermission(s,'light',{forAction:'attack'}).boost,false);});
test('clear preserves serial for diagnostics',()=>{const s=registerHitConfirm(emptyHitConfirm(),{damage:10});assert.equal(clearHitConfirm(s).serial,s.serial);});
test('new hit replaces old confirm and increments serial',()=>{const a=registerHitConfirm(emptyHitConfirm(),{damage:10});const b=registerHitConfirm(a,{damage:90});assert.equal(b.serial,a.serial+1);assert.equal(b.quality,'heavy');});
