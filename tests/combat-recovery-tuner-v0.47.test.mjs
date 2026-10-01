import test from 'node:test';
import assert from 'node:assert/strict';
import {recoveryCancelTrim,tuneAttackCancelData,recoveryFlowSnapshot,RECOVERY_FLOW} from '../src/game/CombatRecoveryTuner.js';
import {attackTimeline} from '../src/game/CombatCancelDirector.js';

const light={startup:.08,active:.10,recovery:.30,cancelStart:.27,cancelEnd:.47,duration:.48,damage:28};
const heavy={startup:.16,active:.15,recovery:.42,cancelStart:.53,cancelEnd:.71,duration:.73,damage:82};

test('light receives more base recovery trim than heavy',()=>assert.ok(recoveryCancelTrim('light',light)>recoveryCancelTrim('heavy',heavy)));
test('hit confirm increases trim without exceeding cap',()=>{const a=recoveryCancelTrim('light',light),b=recoveryCancelTrim('light',light,{hitConfirmed:true});assert.ok(b>a);assert.ok(b<=RECOVERY_FLOW.light.maxTrim);});
test('heavy commitment stays conservative even on confirm',()=>assert.ok(recoveryCancelTrim('heavy',heavy,{hitConfirmed:true})<=RECOVERY_FLOW.heavy.maxTrim));
test('startup values are never modified',()=>{const t=tuneAttackCancelData('light',light,{hitConfirmed:true});assert.equal(t.startup,light.startup);});
test('duration values are never modified',()=>{const t=tuneAttackCancelData('light',light,{hitConfirmed:true});assert.equal(t.duration,light.duration);});
test('cancel start may move earlier but never before active commitment floor',()=>{const t=tuneAttackCancelData('light',light,{hitConfirmed:true});assert.ok(t.cancelStart<light.cancelStart);assert.ok(t.cancelStart>=light.startup+light.active*.44);});
test('cancel end is not shortened',()=>assert.ok(tuneAttackCancelData('light',light,{hitConfirmed:true}).cancelEnd>=light.cancelEnd));
test('combo depth has small bounded benefit',()=>assert.ok(recoveryCancelTrim('light',light,{comboDepth:3})>recoveryCancelTrim('light',light,{comboDepth:0})));
test('airborne benefit remains tiny',()=>assert.ok(recoveryCancelTrim('light',light,{airborne:true})-recoveryCancelTrim('light',light)<.006));
test('zero recovery still remains bounded',()=>assert.ok(recoveryCancelTrim('light',{duration:.4,startup:.1,active:.2,recovery:0})<=RECOVERY_FLOW.light.maxTrim));
test('counter recovery is responsive but bounded',()=>{const v=recoveryCancelTrim('counter',{...light,damage:60},{hitConfirmed:true});assert.ok(v<=RECOVERY_FLOW.counter.maxTrim);assert.ok(v>0);});
test('skill commitment receives minimal trim',()=>assert.ok(recoveryCancelTrim('skillBurst',{...heavy,damage:100},{hitConfirmed:true})<=RECOVERY_FLOW.skill.maxTrim));
test('authored cancel end remains valid after tuning',()=>{const tl=attackTimeline(tuneAttackCancelData('light',light,{hitConfirmed:true}));assert.ok(tl.cancelEnd>=tl.cancelStart);});
test('snapshot reports stable rounded values',()=>{const s=recoveryFlowSnapshot('light',light,{hitConfirmed:true});assert.equal(s.attack,'light');assert.equal(s.commitment,'light');assert.ok(s.trim>0);});
