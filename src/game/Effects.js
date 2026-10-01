export function burst(world,x,y,kind='hit',count=18){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;const speed=(kind==='dust'?90:160)+Math.random()*(kind==='dust'?180:360);
    world.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-(kind==='dust'?10:80),life:.25+Math.random()*.35,max:.6,size:kind==='spark'?2+Math.random()*4:4+Math.random()*10,kind});
  }
}
export function stepParticles(world,dt){
  world.particles=world.particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=520*dt;p.vx*=Math.pow(.1,dt);return p.life>0});
}
