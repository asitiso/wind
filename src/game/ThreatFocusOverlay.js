import {projectWorldToScreen,clampCombatAnchor} from './SpatialCombatAnchor.js';
import {threatFocusSignal} from './ThreatFocusDirector.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function worldThreatPoint(target){return {x:target?.x??0,y:(target?.y??0)-Math.max(100,(target?.visualHeight??240)*.58)};}
function onScreen(p,w,h,pad=42){return p.x>=pad&&p.x<=w-pad&&p.y>=pad&&p.y<=h-pad;}

export function renderThreatFocusOverlay(canvas,runtime,{camera=null,reducedMotion=false,suppress=false,projector=null}={}){
  const s=threatFocusSignal(runtime);if(!s.active||suppress||!canvas?.getContext)return false;
  const ctx=canvas.getContext('2d');if(!ctx)return false;
  const w=canvas.width||1920,h=canvas.height||1080,world=worldThreatPoint(s.target),raw=typeof projector==='function'?projector(world,camera,canvas):projectWorldToScreen(world,camera,canvas),inside=onScreen(raw,w,h,56);
  const anchor=clampCombatAnchor(raw,canvas,{marginX:.04,marginY:.055});
  const rgb=s.parryState==='danger'?'255,92,102':s.parryState==='parryable'?'136,220,255':'255,196,118';
  const alpha=.18+s.intensity*.26;
  ctx.save();ctx.globalCompositeOperation='screen';
  if(inside){
    const r=22+s.intensity*16+(reducedMotion?0:Math.sin((s.progress??0)*Math.PI)*7);
    ctx.strokeStyle=`rgba(${rgb},${alpha})`;ctx.lineWidth=s.urgent?3.4:2.2;ctx.beginPath();ctx.arc(anchor.x,anchor.y,r,Math.PI*.12,Math.PI*.88);ctx.stroke();
    ctx.beginPath();ctx.arc(anchor.x,anchor.y,r,Math.PI*1.12,Math.PI*1.88);ctx.stroke();
  }else{
    const cx=w*.5,cy=h*.5,dx=anchor.x-cx,dy=anchor.y-cy,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len;
    const size=s.urgent?19:15,px=anchor.x,py=anchor.y;
    ctx.fillStyle=`rgba(${rgb},${.28+s.intensity*.38})`;ctx.beginPath();ctx.moveTo(px+ux*size,py+uy*size);ctx.lineTo(px-uy*size*.65,py+ux*size*.65);ctx.lineTo(px+uy*size*.65,py-ux*size*.65);ctx.closePath();ctx.fill();
  }
  ctx.restore();return true;
}
