import {WORLD} from './constants.js';

const segments=[
  {a:0,b:1080,ya:820,yb:820,kind:'meadow'},
  {a:1080,b:1510,ya:820,yb:758,kind:'hill-rise'},
  {a:1510,b:2180,ya:758,yb:758,kind:'upper-ruins'},
  {a:2180,b:2490,ya:758,yb:812,kind:'hill-fall'},
  {a:2490,b:3260,ya:812,yb:812,kind:'low-road'},
  {a:3260,b:3620,ya:812,yb:718,kind:'ruin-rise'},
  {a:3620,b:4510,ya:718,yb:718,kind:'elite-terrace'},
  {a:4510,b:4880,ya:718,yb:804,kind:'shrine-descent'},
  {a:4880,b:WORLD.width,ya:804,yb:804,kind:'shrine-road'},
];

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);

export function terrainSegmentAt(x){
  const px=clamp(x,0,WORLD.width);
  return segments.find(s=>px>=s.a&&px<=s.b)??segments.at(-1);
}

export function groundYAt(x){
  const s=terrainSegmentAt(x);
  if(s.ya===s.yb)return s.ya;
  const t=clamp((x-s.a)/(s.b-s.a),0,1);
  return s.ya+(s.yb-s.ya)*smooth(t);
}

export function groundSlopeAt(x){
  const left=groundYAt(x-8),right=groundYAt(x+8);
  return Math.atan2(right-left,16);
}

export function terrainSegments(){return segments.map(s=>({...s}));}
