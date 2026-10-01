import {combatMomentVisual} from './CombatMomentDirector.js';

const TONES={
  cool:['126,211,255','224,247,255'],star:['148,205,255','240,227,255'],steel:['220,244,255','255,255,255'],starSteel:['176,221,255','255,236,255'],
  warm:['255,220,164','255,249,230'],memory:['202,196,255','255,236,255'],break:['255,218,154','255,246,220'],execution:['255,184,140','255,239,218'],final:['255,230,174','255,255,244'],
};

function rgba(rgb,a){return `rgba(${rgb},${Math.max(0,Math.min(1,a))})`;}

export function renderCombatMomentOverlay(canvas,state,{reducedMotion=false,anchor=null}={}){
  const v=combatMomentVisual(state);if(!v.active||!canvas?.getContext)return false;
  const ctx=canvas.getContext('2d');if(!ctx)return false;
  const w=canvas.width||1920,h=canvas.height||1080,[primary,secondary]=TONES[v.tone]??TONES.cool;
  const ax=Math.max(0,Math.min(w,Number.isFinite(anchor?.x)?anchor.x:w*.5)),ay=Math.max(0,Math.min(h,Number.isFinite(anchor?.y)?anchor.y:h*.5));
  ctx.save();
  ctx.globalCompositeOperation='screen';
  ctx.fillStyle=rgba(primary,v.flash*(reducedMotion?.55:1));ctx.fillRect(0,0,w,h);
  ctx.globalCompositeOperation='source-over';
  const grad=ctx.createRadialGradient(ax,ay,Math.min(w,h)*.12,ax,ay,Math.max(w,h)*.72);
  grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(1,`rgba(3,8,18,${v.vignette})`);ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
  if(!reducedMotion){
    const radius=Math.min(w,h)*(.12+v.ring*.075),alpha=Math.min(.42,.08+v.ring*.20);
    ctx.strokeStyle=rgba(secondary,alpha);ctx.lineWidth=2+v.ring*2.2;ctx.beginPath();ctx.arc(ax,ay,radius,0,Math.PI*2);ctx.stroke();
    if(v.ring>.8){ctx.strokeStyle=rgba(primary,alpha*.62);ctx.lineWidth=1.25;ctx.beginPath();ctx.arc(ax,ay,radius*1.38,0,Math.PI*2);ctx.stroke();}
  }
  ctx.restore();return true;
}
