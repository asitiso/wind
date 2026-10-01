import {ATTACKS} from './constants.js';
export function createCombatState(){return {attack:null,attackTime:0,comboIndex:0,comboTimer:0,queuedLight:false,parryTimer:0,perfectTimer:0,counterWindow:0,hitIds:new Set()}}
export function requestLight(c){
  if(!c.attack&&c.counterWindow>0)return {...c,attack:'counter',attackTime:0,comboIndex:0,comboTimer:.5,queuedLight:false,counterWindow:0,perfectTimer:0,hitIds:new Set()};
  if(!c.attack)return {...c,attack:'light1',attackTime:0,comboIndex:1,comboTimer:.5,queuedLight:false,hitIds:new Set()};
  if(c.attack?.startsWith('light'))return {...c,queuedLight:true};
  return c;
}
export function requestHeavy(c,stamina){if(c.attack||stamina<ATTACKS.heavy.stamina)return c;return {...c,attack:'heavy',attackTime:0,comboTimer:0,queuedLight:false,hitIds:new Set()}}
export function startParry(c){if(c.attack)return c;return {...c,parryTimer:.22}}
export function openPerfectDodge(c){return {...c,perfectTimer:.62,counterWindow:.62,attack:null,attackTime:0,queuedLight:false,hitIds:new Set()}}
export function stepCombat(c,dt){
  let next={...c,comboTimer:Math.max(0,c.comboTimer-dt),parryTimer:Math.max(0,c.parryTimer-dt),perfectTimer:Math.max(0,c.perfectTimer-dt),counterWindow:Math.max(0,c.counterWindow-dt)};
  if(!c.attack)return c.comboTimer<=dt?{...next,comboIndex:0}:next;
  const data=ATTACKS[c.attack];const attackTime=c.attackTime+dt;
  next.attackTime=attackTime;
  if(attackTime>=data.duration){
    if(c.queuedLight&&c.attack!=='heavy'&&c.attack!=='counter'){
      const n=c.attack==='light1'?'light2':c.attack==='light2'?'light3':'light1';
      return {...next,attack:n,attackTime:0,comboIndex:n==='light1'?1:n==='light2'?2:3,comboTimer:.54,queuedLight:false,hitIds:new Set()};
    }
    next.attack=null;next.attackTime=0;next.queuedLight=false;next.hitIds=new Set();
  }
  return next;
}
export function attackIsActive(c){if(!c.attack)return false;const d=ATTACKS[c.attack];return c.attackTime>=d.activeStart&&c.attackTime<=d.activeEnd}
export function attackData(c){return c.attack?ATTACKS[c.attack]:null}
