import {VIEW,WORLD} from './constants.js';
import {compressShake} from './PresentationPolish.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

export function cameraTarget(player,state='exploration',options={}){
  const dir=Math.abs(player.vx??0)>36?Math.sign(player.vx):player.facing||1;
  const speed=Math.min(1,Math.abs(player.vx??0)/520);
  const terrainElevation=player.y-WORLD.groundY;
  const jumpLift=player.onGround?0:Math.min(0,player.y-WORLD.groundY)*.18-34;
  const focusX=Number.isFinite(options.focusX)?options.focusX:null;
  if(focusX!==null&&(state==='boss'||state==='combat')){
    const defaultBlend=state==='boss'?.42:.20;
    const blend=clamp(Number.isFinite(options.focusBlend)?options.focusBlend:defaultBlend,.10,.58);
    const framed=lerp(player.x,focusX,blend);
    const leadScale=clamp(Number.isFinite(options.leadScale)?options.leadScale:1,0,1.25);
    const lead=(state==='boss'?0:dir*58)*leadScale;
    return {x:framed+lead-VIEW.width*(state==='boss'?.50:.43),y:terrainElevation*.68+jumpLift};
  }
  const directional=dir*lerp(138,270,speed);
  const baseBias=state==='boss'?dir*22:state==='combat'?dir*74:directional;
  return {x:player.x+baseBias-VIEW.width*.38,y:terrainElevation*.68+jumpLift};
}

export function stepCamera(camera,player,dt,state='exploration',options={}){
  const target=cameraTarget(player,state,options);
  const followMultiplier=clamp(Number.isFinite(options.followMultiplier)?options.followMultiplier:1,.75,1.4);
  const follow=1-Math.exp(-dt*(state==='boss'?6.2:state==='combat'?7.7:5.6)*followMultiplier);
  const worldWidth=Math.max(VIEW.width,Number.isFinite(options.worldWidth)?options.worldWidth:WORLD.width);
  const maxX=Math.max(0,worldWidth-VIEW.width);
  const x=clamp(camera.x+(target.x-camera.x)*follow,0,maxX);
  const y=camera.y+(target.y-camera.y)*(1-Math.exp(-dt*(player.onGround?4.6:3.5)*Math.min(1.2,followMultiplier)));
  let zoomTarget=state==='boss'?.91:state==='combat'?.958:1;
  if(state==='boss'&&Number.isFinite(options.focusX)){
    const distance=Math.abs(options.focusX-player.x);
    zoomTarget=clamp(.92-Math.max(0,distance-650)/3000*.08,.84,.92);
  }
  const zoomBias=clamp(Number.isFinite(options.zoomBias)?options.zoomBias:0,-.05,.05);
  zoomTarget=clamp(zoomTarget+zoomBias,.82,1.045);
  const zoom=camera.zoom+(zoomTarget-camera.zoom)*(1-Math.exp(-dt*5.4*followMultiplier));
  return {...camera,x,y,zoom};
}

export function cameraShake(camera,amount){
  const impulse=compressShake(amount);
  return {...camera,shake:Math.max((camera.shake??0)*.90,impulse)};
}
export function settleCameraShake(camera,dt){
  const current=Math.max(0,camera.shake??0);
  const decay=current>18?58:current>8?68:82;
  return {...camera,shake:Math.max(0,current-dt*decay)};
}
