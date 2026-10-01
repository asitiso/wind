export const UPPER_RUINS={
  startX:980,
  endX:5480,
  spawnX:1080,
  exitX:1010,
  summitX:5180,
  fallY:1090,
  gaps:[
    {left:1780,right:2290,respawnX:1660,label:'첫 번째 바람 틈'},
    {left:3260,right:3830,respawnX:3120,label:'부서진 회랑'},
  ],
  fragments:[
    {id:'echo-1',x:2620,y:592,label:'바람의 잔향 I'},
    {id:'echo-2',x:4200,y:520,label:'바람의 잔향 II'},
    {id:'echo-3',x:5050,y:455,label:'바람의 잔향 III'},
  ],
};

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const segments=[
  {a:900,b:1500,ya:790,yb:742},
  {a:1500,b:1780,ya:742,yb:700},
  {a:1780,b:2290,ya:1115,yb:1115,gap:true},
  {a:2290,b:2850,ya:690,yb:638},
  {a:2850,b:3260,ya:638,yb:610},
  {a:3260,b:3830,ya:1115,yb:1115,gap:true},
  {a:3830,b:4460,ya:596,yb:548},
  {a:4460,b:5480,ya:548,yb:500},
];

export function upperRuinsSegmentAt(x){
  const px=clamp(x,segments[0].a,segments.at(-1).b);
  return segments.find(s=>px>=s.a&&px<=s.b)??segments.at(-1);
}
export function upperRuinsGroundYAt(x){
  const s=upperRuinsSegmentAt(x);
  if(s.ya===s.yb)return s.ya;
  const t=clamp((x-s.a)/(s.b-s.a),0,1);
  return s.ya+(s.yb-s.ya)*smooth(t);
}
export function upperRuinsSlopeAt(x){
  const l=upperRuinsGroundYAt(x-8),r=upperRuinsGroundYAt(x+8);
  return Math.atan2(r-l,16);
}
export function upperRuinsGapAt(x){return UPPER_RUINS.gaps.find(g=>x>g.left&&x<g.right)??null;}
export function upperRuinsProgress(x){return clamp((x-UPPER_RUINS.startX)/(UPPER_RUINS.endX-UPPER_RUINS.startX),0,1);}

export function createUpperFlyingEnemy(id,x,y,phase=0){
  return {id,type:'flying',x,y,homeX:x,homeY:y,hp:120,maxHp:120,facing:-1,state:'hover',stateTime:phase,attackSerial:0,dodgedSerial:-1,hurt:0,dead:false,attackVariant:'dive',phase};
}

export function createUpperRuinsEnemies(){
  return [
    createUpperFlyingEnemy('wind-raptor-1',2480,430,.2),
    createUpperFlyingEnemy('wind-raptor-2',2920,380,1.1),
    createUpperFlyingEnemy('wind-raptor-3',4060,355,.7),
    createUpperFlyingEnemy('wind-raptor-4',4540,330,1.8),
  ];
}

export function stepFlyingEnemy(enemy,player,dt,time=0){
  if(enemy.dead)return {enemy,strike:null};
  let e={...enemy,hurt:Math.max(0,enemy.hurt-dt),stateTime:enemy.stateTime+dt};
  const dx=player.x-e.x,dy=player.y-150-e.y,d=Math.hypot(dx,dy);
  e.facing=dx>=0?1:-1;
  if(e.state==='stagger'){
    e.y-=18*dt;
    if(e.stateTime>.55){e.state='hover';e.stateTime=0;}
    return {enemy:e,strike:null};
  }
  if(e.state==='hover'){
    e.x+=(e.homeX+Math.sin(time*.9+e.phase)*84-e.x)*dt*1.8;
    e.y+=(e.homeY+Math.sin(time*2.0+e.phase)*32-e.y)*dt*2.1;
    if(d<650&&e.stateTime>1.0){e.state='windup';e.stateTime=0;e.attackSerial++;}
  }else if(e.state==='windup'){
    e.y-=24*dt;
    if(e.stateTime>.48){e.state='dive';e.stateTime=0;}
  }else if(e.state==='dive'){
    const speed=610;
    const len=Math.max(1,Math.hypot(dx,dy));e.x+=dx/len*speed*dt;e.y+=dy/len*speed*dt;
    if(d<125){e.state='recover';e.stateTime=0;return {enemy:e,strike:{serial:e.attackSerial,damage:18,range:145,projectile:false,heavy:false,parryable:true,variant:'dive',airborne:true}};}
    if(e.stateTime>.82){e.state='recover';e.stateTime=0;}
  }else if(e.state==='recover'){
    e.x+=(e.homeX-e.x)*dt*1.4;e.y+=(e.homeY-e.y)*dt*1.6;
    if(e.stateTime>.75){e.state='hover';e.stateTime=0;}
  }
  return {enemy:e,strike:null};
}
