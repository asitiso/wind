import {COLORS,PLAYER,VIEW,WORLD,ATTACKS} from './constants.js';
import {animationPose} from './AnimationState.js';
import {enemyThreatProgress} from './EnemyAI.js';
import {groundSlopeAt,groundYAt} from './Terrain.js';
import {UPPER_RUINS,upperRuinsGroundYAt,upperRuinsProgress,upperRuinsSlopeAt} from './UpperRuins.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
export class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.images={};this.ready=false;this.frame=0}
  async load(){
    const load=(k,src)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>{this.images[k]=i;resolve()};i.onerror=reject;i.src=src});
    await Promise.all([load('world','./assets/generated/world-backdrop.png'),load('combat','./assets/generated/combat-backdrop.png'),load('boss','./assets/generated/boss-backdrop.png'),load('player','./assets/generated/player-lyria.svg'),load('enemy','./assets/generated/enemy-knight.svg'),load('elite','./assets/generated/enemy-ruin-knight.svg'),load('raptor','./assets/generated/enemy-wind-raptor.svg')]);this.ready=true;
  }
  resize(){const dpr=Math.min(2,devicePixelRatio||1);const rect=this.canvas.getBoundingClientRect();const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h}this.ctx.setTransform(w/VIEW.width,0,0,h/VIEW.height,0,0)}
  render(game){
    this.resize();this.frame++;const c=this.ctx;const {camera,player,world}=game;const shake=camera.shake>0?{x:(Math.random()-.5)*camera.shake*2,y:(Math.random()-.5)*camera.shake}: {x:0,y:0};
    c.save();c.clearRect(0,0,VIEW.width,VIEW.height);c.translate(VIEW.width/2,VIEW.height/2);c.scale(camera.zoom,camera.zoom);c.translate(-VIEW.width/2+shake.x,-VIEW.height/2+shake.y);c.translate(0,-camera.y);
    if(world.upperRuins?.entered)this.drawUpperRuinsInterior(c,camera,world);
    else if(world.shrine?.entered)this.drawShrineInterior(c,camera,world);
    else{this.drawSky(c,camera,world);this.drawFarRuins(c,camera);this.drawMidRuins(c,camera,world);}
    this.drawGround(c,camera,world);
    this.drawArenaBarrier(c,camera,world);
    if(!world.shrine?.entered&&!world.upperRuins?.entered)this.drawProps(c,camera,world);
    if(!world.shrine?.entered&&!world.upperRuins?.entered)this.drawAirDashGate(c,camera,world,player);
    if(world.upperRuins?.entered)this.drawUpperEnemies(c,camera,world);else this.drawEnemies(c,camera,world);
    this.drawWindSlashes(c,camera,world);this.drawPlayer(c,camera,player);this.drawExecutionFx(c,camera,world);this.drawParticles(c,camera,world);this.drawForeground(c,camera,world);c.restore();
    this.drawVignette(c,game);
  }
  sx(x,camera,factor=1){return x-camera.x*factor}

  drawUpperRuinsInterior(c,camera,world){
    c.save();
    const sky=c.createLinearGradient(0,-120,0,VIEW.height);sky.addColorStop(0,'#315a7d');sky.addColorStop(.38,'#7fa9bb');sky.addColorStop(.72,'#d5c4a4');sky.addColorStop(1,'#53686b');c.fillStyle=sky;c.fillRect(0,-180,VIEW.width,VIEW.height+360);
    const sunX=1500-camera.x*.08;c.globalCompositeOperation='screen';const sun=c.createRadialGradient(sunX,210,16,sunX,210,420);sun.addColorStop(0,'rgba(255,238,183,.7)');sun.addColorStop(.25,'rgba(255,207,135,.22)');sun.addColorStop(1,'rgba(255,207,135,0)');c.fillStyle=sun;c.fillRect(0,0,VIEW.width,760);c.globalCompositeOperation='source-over';
    c.globalAlpha=.20;c.fillStyle='#253c52';
    for(let i=0;i<8;i++){const x=-220+i*420-camera.x*.12;const top=180-(i%3)*48;c.beginPath();c.moveTo(x,610);c.lineTo(x+90,top+130);c.lineTo(x+190,top);c.lineTo(x+300,610);c.closePath();c.fill();}
    c.globalAlpha=.22;c.fillStyle='#1c303e';
    for(let i=0;i<8;i++){const x=150+i*520-camera.x*.20;const y=160+(i%3)*120;c.fillRect(x,y,58,340);c.beginPath();c.arc(x+29,y,70,Math.PI,0);c.fill();}
    c.globalAlpha=.35;
    for(let i=0;i<7;i++){const x=120+i*700-camera.x*.28;const y=220+(i%2)*140;c.fillStyle='#344c52';c.beginPath();c.moveTo(x,y);c.lineTo(x+150,y-42);c.lineTo(x+290,y+6);c.lineTo(x+210,y+95);c.lineTo(x+30,y+82);c.closePath();c.fill();}
    c.globalAlpha=.75;c.strokeStyle='#7e8d87';c.lineWidth=18;
    for(let wx=1280;wx<UPPER_RUINS.endX;wx+=740){const x=this.sx(wx,camera);const gy=upperRuinsGroundYAt(wx);c.beginPath();c.arc(x,gy-240,120,Math.PI,0);c.stroke();c.fillStyle='rgba(93,107,101,.65)';c.fillRect(x-136,gy-236,28,236);c.fillRect(x+108,gy-236,28,236);}
    const claimed=new Set(world.upperRuins.fragmentIds??[]);
    for(const f of UPPER_RUINS.fragments){if(claimed.has(f.id))continue;const x=this.sx(f.x,camera),y=f.y;if(x<-180||x>VIEW.width+180)continue;c.save();c.translate(x,y);c.rotate(world.time*.45);c.globalCompositeOperation='screen';const g=c.createRadialGradient(0,0,4,0,0,105);g.addColorStop(0,'rgba(229,251,255,.92)');g.addColorStop(.28,'rgba(94,211,255,.35)');g.addColorStop(1,'rgba(94,211,255,0)');c.fillStyle=g;c.fillRect(-120,-120,240,240);c.strokeStyle='#dff8ff';c.lineWidth=4;c.beginPath();c.moveTo(0,-38);c.lineTo(28,0);c.lineTo(0,38);c.lineTo(-28,0);c.closePath();c.stroke();c.rotate(-world.time*.9);c.strokeStyle='#6fd7ff';c.lineWidth=3;c.beginPath();c.arc(0,0,50,0,Math.PI*2);c.stroke();c.restore();}
    c.globalCompositeOperation='source-over';
    for(let i=0;i<28;i++){const x=((i*181+world.time*54)-camera.x*.10)%2500-160;const y=160+(i*83)%620;c.globalAlpha=.08+(i%5)*.025;c.strokeStyle='#e6f9ff';c.lineWidth=1.5+(i%2);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+84,y-22,x+172,y+3);c.stroke();}
    const progress=upperRuinsProgress(camera.x+VIEW.width*.5);c.globalAlpha=.18+.12*progress;c.fillStyle='#dff7ff';c.fillRect(0,0,VIEW.width,VIEW.height);
    c.restore();
  }
  drawAirDashGate(c,camera,world,player){
    const gate=world.upperRuins?.gateX;if(!gate)return;
    const x=this.sx(gate,camera),gy=groundYAt(gate);if(x<-260||x>VIEW.width+260)return;
    const unlocked=player.airDashUnlocked;
    c.save();c.translate(x,gy-168);
    c.globalAlpha=unlocked?.92:.42;c.strokeStyle=unlocked?'#bceeff':'#7d928e';c.lineWidth=8;c.beginPath();c.arc(0,0,96,-2.65,.15);c.stroke();
    c.lineWidth=4;c.beginPath();c.arc(0,0,69,.2,2.92);c.stroke();
    c.fillStyle=unlocked?'rgba(118,218,255,.15)':'rgba(90,105,99,.08)';c.beginPath();c.arc(0,0,112,0,Math.PI*2);c.fill();
    c.globalCompositeOperation='screen';c.strokeStyle=unlocked?'rgba(224,250,255,.9)':'rgba(180,196,190,.25)';c.lineWidth=3;
    for(let i=0;i<5;i++){const phase=world.time*(unlocked?2.8:1.1)+i*1.2;c.beginPath();c.arc(Math.sin(phase)*14,Math.cos(phase*.7)*9,42+i*12,phase,phase+1.2);c.stroke();}
    c.globalCompositeOperation='source-over';
    c.fillStyle=unlocked?'#dff8ff':'#a9b6b1';c.font='700 11px Georgia';c.textAlign='center';c.fillText(unlocked?'WIND STEP':'SEALED WIND',0,-126);
    c.restore();
  }
  drawShrineInterior(c,camera,world){
    c.save();
    const bg=c.createLinearGradient(0,0,0,VIEW.height);
    bg.addColorStop(0,'#07101c');bg.addColorStop(.48,'#12232b');bg.addColorStop(1,'#101612');
    c.fillStyle=bg;c.fillRect(0,-180,VIEW.width,VIEW.height+360);
    const altarX=this.sx(world.shrine.altarX,camera);
    const moon=c.createRadialGradient(altarX,185,10,altarX,240,520);
    moon.addColorStop(0,'rgba(177,226,255,.28)');moon.addColorStop(.55,'rgba(91,155,186,.08)');moon.addColorStop(1,'rgba(91,155,186,0)');
    c.fillStyle=moon;c.fillRect(0,-100,VIEW.width,920);
    c.globalAlpha=.52;c.strokeStyle='#50656c';c.lineWidth=22;
    for(let i=-1;i<6;i++){
      const x=i*410-(camera.x-4280)*.12;
      c.beginPath();c.moveTo(x+84,770);c.lineTo(x+84,170);c.arc(x+205,170,121,Math.PI,0);c.lineTo(x+326,770);c.stroke();
      c.strokeStyle='rgba(132,154,154,.2)';c.lineWidth=5;c.beginPath();c.arc(x+205,170,92,Math.PI,0);c.stroke();c.strokeStyle='#50656c';c.lineWidth=22;
    }
    c.globalAlpha=.72;
    for(let i=0;i<7;i++){
      const x=80+i*310-(camera.x-4280)*.32;c.fillStyle=i%2?'#293733':'#33413d';c.fillRect(x,232,54,560);
      c.fillStyle='rgba(164,174,151,.25)';c.fillRect(x+8,246,7,520);c.fillRect(x-11,220,76,24);
    }
    c.globalCompositeOperation='screen';
    const beam=c.createLinearGradient(altarX-170,60,altarX+170,760);beam.addColorStop(0,'rgba(174,229,255,.03)');beam.addColorStop(.55,'rgba(174,229,255,.17)');beam.addColorStop(1,'rgba(174,229,255,0)');
    c.fillStyle=beam;c.beginPath();c.moveTo(altarX-110,0);c.lineTo(altarX+120,0);c.lineTo(altarX+340,805);c.lineTo(altarX-330,805);c.closePath();c.fill();
    c.globalCompositeOperation='source-over';c.globalAlpha=1;
    c.save();c.translate(altarX,groundYAt(world.shrine.altarX)+10);
    c.fillStyle='#273837';c.fillRect(-130,-96,260,96);c.fillStyle='#6d7566';c.fillRect(-146,-112,292,24);c.fillStyle='#1d2d30';c.fillRect(-55,-208,110,96);
    c.strokeStyle='#89dcff';c.lineWidth=5;c.globalCompositeOperation='screen';c.beginPath();c.arc(0,-160,42,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(-32,-160);c.lineTo(32,-160);c.moveTo(0,-192);c.lineTo(0,-128);c.stroke();
    c.fillStyle='rgba(107,209,255,.16)';c.beginPath();c.arc(0,-160,72,0,Math.PI*2);c.fill();c.restore();
    c.restore();
  }
  drawExecutionFx(c,camera,world){
    const fx=world.executionFx;if(!fx)return;
    const t=1-fx.time/fx.max;const a=Math.max(0,1-t);
    const x=this.sx(fx.x,camera),y=fx.y-150;
    c.save();c.globalCompositeOperation='screen';
    c.strokeStyle=`rgba(255,249,218,${.9*a})`;c.lineWidth=32*(1-t)+7;c.beginPath();c.arc(x,y,120+t*240,-2.7,.42);c.stroke();
    c.strokeStyle=`rgba(119,210,255,${.78*a})`;c.lineWidth=8;c.beginPath();c.arc(x,y,160+t*290,-2.75,.5);c.stroke();
    c.fillStyle=`rgba(255,255,255,${.2*a})`;c.beginPath();c.arc(x,y,50+t*120,0,Math.PI*2);c.fill();
    c.restore();
  }
  drawSky(c,camera,world){
    const img=this.images.world;c.save();const drift=camera.x*.10;c.globalAlpha=.92;c.drawImage(img,-80-drift*.08,-145,2080,1170);c.fillStyle='rgba(118,181,220,.13)';c.fillRect(0,0,VIEW.width,VIEW.height);c.restore();
    c.save();c.globalAlpha=.28;for(let i=0;i<10;i++){const x=((i*370-world.time*8)-camera.x*.055)%2400-180;const y=80+(i%4)*88;c.fillStyle='rgba(255,255,255,.46)';c.beginPath();c.ellipse(x,y,160,35,0,0,Math.PI*2);c.fill()}c.restore();
  }
  drawFarRuins(c,camera){
    c.save();
    c.globalAlpha=.18;
    const off=-camera.x*.16;
    c.translate(off,0);
    c.fillStyle='#6b8291';
    for(let i=0;i<8;i++){
      const x=260+i*760;
      const base=675-(i%3)*18;
      c.beginPath();
      c.moveTo(x-160,base);
      c.lineTo(x-35,base-145-(i%2)*45);
      c.lineTo(x+90,base-65);
      c.lineTo(x+190,base);
      c.closePath();
      c.fill();
    }
    c.restore();
  }
  drawMidRuins(c,camera,world){
    c.save();
    const drift=-camera.x*.31;
    c.translate(drift,0);
    c.globalAlpha=.13;
    for(let i=0;i<7;i++){
      const x=180+i*540+(world.time*6)%140;
      const y=515+(i%3)*58;
      const grad=c.createRadialGradient(x,y,10,x,y,190);
      grad.addColorStop(0,'rgba(230,246,249,.65)');
      grad.addColorStop(1,'rgba(230,246,249,0)');
      c.fillStyle=grad;
      c.beginPath();c.ellipse(x,y,220,48,0,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  drawGround(c,camera,world){
    c.save();
    const surface=[];const floorFn=world.upperRuins?.entered?upperRuinsGroundYAt:groundYAt;
    for(let x=-80;x<=VIEW.width+80;x+=36){const wx=x+camera.x;surface.push([x,floorFn(wx)+34]);}
    if(world.upperRuins?.entered){
      const grad=c.createLinearGradient(0,650,0,VIEW.height);grad.addColorStop(0,'rgba(86,101,92,.96)');grad.addColorStop(.34,'rgba(51,66,60,.98)');grad.addColorStop(1,'rgba(17,28,28,1)');
      c.fillStyle=grad;c.beginPath();c.moveTo(surface[0][0],surface[0][1]-8);for(const [x,y] of surface)c.lineTo(x,y-8);c.lineTo(VIEW.width+80,VIEW.height+180);c.lineTo(-80,VIEW.height+180);c.closePath();c.fill();
      c.strokeStyle='rgba(218,230,205,.76)';c.lineWidth=5;c.beginPath();surface.forEach(([x,y],i)=>i?c.lineTo(x,y-28):c.moveTo(x,y-28));c.stroke();
      c.globalCompositeOperation='screen';c.strokeStyle='rgba(106,211,255,.25)';c.lineWidth=3;for(let x=-20;x<VIEW.width+80;x+=160){const wx=x+camera.x,top=upperRuinsGroundYAt(wx)-14;c.beginPath();c.moveTo(x,top);c.lineTo(x+42,top-12);c.lineTo(x+88,top+4);c.stroke();}c.globalCompositeOperation='source-over';
    }else if(world.shrine?.entered){
      const grad=c.createLinearGradient(0,690,0,VIEW.height);grad.addColorStop(0,'rgba(58,68,65,.92)');grad.addColorStop(.38,'rgba(29,38,36,.96)');grad.addColorStop(1,'rgba(8,13,14,1)');
      c.fillStyle=grad;c.beginPath();c.moveTo(surface[0][0],surface[0][1]);for(const [x,y] of surface)c.lineTo(x,y);c.lineTo(VIEW.width+80,VIEW.height+180);c.lineTo(-80,VIEW.height+180);c.closePath();c.fill();
      c.strokeStyle='rgba(151,168,157,.72)';c.lineWidth=4;c.beginPath();surface.forEach(([x,y],i)=>i?c.lineTo(x,y-18):c.moveTo(x,y-18));c.stroke();
      for(let x=-40;x<VIEW.width+100;x+=118){const wx=x+camera.x;const top=groundYAt(wx)+17;c.fillStyle='rgba(102,112,106,.22)';c.fillRect(x,top,106,34);c.strokeStyle='rgba(191,208,196,.12)';c.strokeRect(x,top,106,34);}
    }else{
      const grad=c.createLinearGradient(0,690,0,VIEW.height);
      grad.addColorStop(0,'rgba(70,91,59,.24)');grad.addColorStop(.4,'rgba(35,55,39,.38)');grad.addColorStop(1,'rgba(10,23,18,.74)');
      c.fillStyle=grad;c.beginPath();c.moveTo(surface[0][0],surface[0][1]);for(const [x,y] of surface)c.lineTo(x,y);c.lineTo(VIEW.width+80,VIEW.height+180);c.lineTo(-80,VIEW.height+180);c.closePath();c.fill();
      c.strokeStyle='rgba(226,210,160,.9)';c.lineWidth=5;c.beginPath();surface.forEach(([x,y],i)=>i?c.lineTo(x,y-18):c.moveTo(x,y-18));c.stroke();
      for(let x=-60;x<VIEW.width+100;x+=92){const wx=x+camera.x;const top=groundYAt(wx)+18;c.save();c.translate(x,top);c.rotate(groundSlopeAt(wx));c.fillStyle='rgba(90,95,78,.34)';c.fillRect(-6,-2,82,28);c.strokeStyle='rgba(190,176,138,.25)';c.lineWidth=2;c.strokeRect(-6,-2,82,28);c.restore();}
    }
    c.restore();
  }
  drawArenaBarrier(c,camera,world){
    if(!world.arena?.active)return;
    c.save();
    c.globalCompositeOperation='screen';
    for(const wx of [world.arena.left,world.arena.right]){
      const x=this.sx(wx,camera);if(x<-90||x>VIEW.width+90)continue;const gy=groundYAt(wx);
      for(let i=0;i<7;i++){
        const phase=world.time*3+i*.9;const sway=Math.sin(phase)*18;
        c.strokeStyle=`rgba(157,222,255,${.10+i*.025})`;c.lineWidth=2+i*.7;c.beginPath();c.moveTo(x,gy+45);c.bezierCurveTo(x+sway,gy-65,x-sway*.7,gy-185,x+sway*.5,gy-330);c.stroke();
      }
      c.strokeStyle='rgba(230,248,255,.72)';c.lineWidth=4;c.beginPath();c.moveTo(x,gy+20);c.lineTo(x,gy-300);c.stroke();
      c.fillStyle='rgba(110,205,255,.15)';c.beginPath();c.ellipse(x,gy-125,42,205,0,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  drawProps(c,camera,world){
    for(const p of world.props){
      const x=this.sx(p.x,camera);
      if(x<-280||x>VIEW.width+280)continue;
      c.save();
      c.translate(x,groundYAt(p.x)+12);
      c.globalAlpha=.72;
      const stone='#717a70',edge='#a5ad98',dark='#48534a';
      if(p.type==='pillar'){
        c.fillStyle=dark;c.fillRect(-28,-p.h,56,p.h);
        c.fillStyle=stone;c.fillRect(-20,-p.h+8,40,p.h-10);
        c.fillStyle=edge;c.fillRect(-32,-p.h-4,64,16);
        c.fillRect(-35,-18,70,18);
        for(let y=-p.h+38;y<-30;y+=54){c.fillStyle='rgba(190,200,174,.22)';c.fillRect(-15,y,30,4)}
      }else if(p.type==='arch'){
        c.strokeStyle=stone;c.lineWidth=26;c.beginPath();c.arc(0,-116,112,Math.PI,0);c.stroke();
        c.fillStyle=dark;c.fillRect(-128,-120,30,134);c.fillRect(98,-120,30,134);
        c.fillStyle=edge;c.fillRect(-134,-124,42,12);c.fillRect(92,-124,42,12);
      }else if(p.type==='statue'){
        c.globalAlpha=.42;c.fillStyle='#687b72';c.beginPath();c.ellipse(0,-p.h*.78,43,58,0,0,Math.PI*2);c.fill();
        c.beginPath();c.moveTo(-60,-p.h*.62);c.lineTo(58,-p.h*.62);c.lineTo(38,-38);c.lineTo(-44,-38);c.closePath();c.fill();
        c.strokeStyle='#aebba8';c.lineWidth=7;c.beginPath();c.arc(0,-p.h*.82,82,0,Math.PI*2);c.stroke();
      }else{
        c.fillStyle=dark;c.fillRect(-105,-175,210,175);
        c.fillStyle=stone;c.fillRect(-92,-165,184,153);
        c.fillStyle=edge;c.beginPath();c.moveTo(-125,-175);c.lineTo(0,-p.h);c.lineTo(125,-175);c.closePath();c.fill();
        c.fillStyle='#25342f';c.fillRect(-24,-105,48,105);
      }
      c.restore();
    }
  }
  drawPlayer(c,camera,p){
    const x=this.sx(p.x,camera),y=p.y;
    const speed=Math.abs(p.vx),run=Math.min(1,speed/520),t=p.animClock;
    const pose=animationPose(p.animation,p);
    const attack=p.combat.attack;
    const at=attack?p.combat.attackTime/ATTACKS[attack].duration:0;
    const img=this.images.player;
    const h=304,w=h*(360/560);
    c.save();
    c.translate(x+pose.x,y+pose.y);
    c.rotate(pose.rotation);
    c.scale(p.facing*pose.scaleX,pose.scaleY);
    c.save();c.scale(1/(p.facing*pose.scaleX),1/pose.scaleY);c.globalAlpha=.26;c.fillStyle='#07111a';c.beginPath();c.ellipse(0,8,76,15,0,0,Math.PI*2);c.fill();c.restore();
    const capePull=Math.min(1,Math.abs(p.vx)/520)*.9+pose.cape;
    c.save();c.globalAlpha=.52;c.strokeStyle='#a51d2e';c.lineWidth=18;c.lineCap='round';c.beginPath();c.moveTo(-34,-218);c.bezierCurveTo(-82-capePull*34,-207,-100-capePull*72,-178+Math.sin(t*7)*8,-78-capePull*106,-168);c.stroke();c.strokeStyle='#d64a4e';c.lineWidth=5;c.stroke();c.restore();
    if(p.dash>0){for(let i=1;i<=4;i++){c.globalAlpha=(p.airDashActive>0?.13:.085)*(5-i);if(p.airDashActive>0){c.save();c.globalCompositeOperation='screen';c.filter='brightness(1.35) saturate(1.2)';c.drawImage(img,-w*.47-i*42,-h+7,w,h);c.restore();}else c.drawImage(img,-w*.47-i*30,-h+7,w,h);}}
    if(p.airDashActive>0){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.82;c.strokeStyle='#b9f2ff';c.lineWidth=9;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-80-i*32,-190+i*22);c.lineTo(-260-i*48,-190+i*22);c.stroke();}c.restore();}
    c.globalAlpha=p.hurt>0?.62+.38*Math.sin(p.hurt*70):1;
    const attackLean=attack?Math.sin(Math.min(1,at)*Math.PI)*(attack==='counter'?22:10):0;
    c.drawImage(img,-w*.47+attackLean,-h+7,w,h);
    if(attack){
      const alpha=Math.sin(Math.min(1,at)*Math.PI);
      c.save();c.globalCompositeOperation='screen';c.globalAlpha=alpha*.92;
      c.strokeStyle=attack==='heavy'?'#ffd987':attack==='counter'?'#fff2b0':'#83d7ff';c.lineWidth=attack==='heavy'||attack==='counter'?22:14;
      c.beginPath();c.arc(25,-145,attack==='counter'?218:attack==='heavy'?205:168,-1.65,attack==='counter'?1.08:.92);c.stroke();
      c.strokeStyle='#fff';c.lineWidth=4;c.stroke();c.restore();
    }
    if(p.combat.parryTimer>0){
      const a=p.combat.parryTimer/.22;c.save();c.globalCompositeOperation='screen';c.globalAlpha=a;c.strokeStyle='#ffe6a7';c.lineWidth=7;c.beginPath();c.arc(12,-150,82+(1-a)*26,0,Math.PI*2);c.stroke();c.strokeStyle='#aee9ff';c.lineWidth=3;c.beginPath();c.arc(12,-150,58+(1-a)*18,0,Math.PI*2);c.stroke();c.restore();
    }
    if(p.combat.perfectTimer>0){
      const a=Math.min(1,p.combat.perfectTimer/.62);c.save();c.scale(1/p.facing,1);c.globalCompositeOperation='screen';c.globalAlpha=.28+.42*a;c.strokeStyle='#bdeaff';c.lineWidth=5;c.beginPath();c.ellipse(0,-142,104+(1-a)*34,174+(1-a)*24,0,0,Math.PI*2);c.stroke();c.restore();
    }
    c.restore();
  }
  drawWindSlashes(c,camera,world){
    for(const s of world.windSlashes??[]){const x=this.sx(s.x,camera),a=Math.max(0,s.life/s.maxLife);c.save();c.translate(x,s.y);c.scale(Math.sign(s.vx)||1,1);c.globalCompositeOperation='screen';c.globalAlpha=.75*a;c.strokeStyle='#a9eaff';c.lineWidth=12;c.beginPath();c.arc(0,0,72,-1.0,1.0);c.stroke();c.strokeStyle='#f4fdff';c.lineWidth=3;c.beginPath();c.arc(0,0,82,-1.08,1.08);c.stroke();c.restore();}
  }
  drawUpperEnemies(c,camera,world){
    for(const e of world.upperEnemies??[]){if(e.dead)continue;const x=this.sx(e.x,camera),y=e.y;if(x<-220||x>VIEW.width+220)continue;c.save();c.translate(x,y);c.scale(e.facing,1);
      if(e.state==='windup'){const t=Math.min(1,e.stateTime/.48);c.globalCompositeOperation='screen';c.strokeStyle=`rgba(255,93,72,${.35+t*.6})`;c.lineWidth=6;c.beginPath();c.arc(0,0,70+t*42,0,Math.PI*2);c.stroke();c.globalCompositeOperation='source-over';}
      if(e.state==='dive'){c.rotate(-.18*e.facing);c.translate(14,0);}
      c.globalAlpha=e.hurt>0?.58+.42*Math.sin(e.hurt*80):1;const img=this.images.raptor;c.drawImage(img,-105,-78,210,154);c.restore();
      c.fillStyle='rgba(6,12,18,.72)';c.fillRect(x-54,y-98,108,7);c.fillStyle='#d34d4f';c.fillRect(x-52,y-96,104*(e.hp/e.maxHp),3);
    }
  }
  drawEnemies(c,camera,world){
    for(const e of world.enemies){
      const img=e.type==='elite'?this.images.elite:this.images.enemy;
      if(e.dead)continue;
      const x=this.sx(e.x,camera);if(x<-220||x>VIEW.width+220)continue;
      c.save();c.translate(x,e.y);c.scale(e.facing,1);
      if(e.hurt>0)c.globalAlpha=.55+.45*Math.sin(e.hurt*80);
      const tele=enemyThreatProgress(e);
      if(tele>0){
        c.save();c.globalCompositeOperation='screen';const v=e.attackVariant;
        if(v==='guardbreak'){
          c.strokeStyle=`rgba(255,48,42,${.48+tele*.48})`;c.lineWidth=9;c.beginPath();c.arc(0,-148,82+tele*54,0,Math.PI*2);c.stroke();
          c.lineWidth=12;c.beginPath();c.moveTo(-64,-214);c.lineTo(70,-82);c.moveTo(70,-214);c.lineTo(-64,-82);c.stroke();
          c.fillStyle=`rgba(255,24,24,${tele*.13})`;c.beginPath();c.ellipse(110,-28,210*tele,34,0,0,Math.PI*2);c.fill();
        }else if(v==='dash'){
          c.strokeStyle=`rgba(124,224,255,${.38+tele*.55})`;c.lineWidth=7;c.beginPath();c.moveTo(20,-142);c.lineTo(105+tele*190,-142);c.stroke();
          c.lineWidth=2;c.beginPath();c.moveTo(80,-172);c.lineTo(240+tele*110,-172);c.moveTo(70,-112);c.lineTo(220+tele*95,-112);c.stroke();
        }else if(v==='heavy'){
          c.strokeStyle=`rgba(255,191,78,${.38+tele*.58})`;c.lineWidth=11;c.beginPath();c.arc(0,-148,92+tele*34,-2.7,.15);c.stroke();
          c.fillStyle=`rgba(255,145,42,${tele*.11})`;c.beginPath();c.ellipse(110,-18,190*tele,27,0,0,Math.PI*2);c.fill();
        }else{
          c.strokeStyle=`rgba(255,113,82,${.24+tele*.58})`;c.lineWidth=7;c.beginPath();c.arc(0,-150,88+tele*24,0,Math.PI*2);c.stroke();
        }
        c.restore();
      }
      const elite=e.type==='elite';
      if(elite){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.14+.08*Math.sin(world.time*5);c.fillStyle=e.state==='execution'?'#ffe8a1':e.hp/e.maxHp<.5?'#ff6c5d':'#d7b873';c.beginPath();c.ellipse(0,-142,96,150,0,0,Math.PI*2);c.fill();c.restore();}
      const h=elite?292:e.type==='shield'?252:238,w=elite?h*(300/500):h*(250/430);
      if(e.state==='execution'){c.translate(0,26);c.rotate(-.09*e.facing);c.scale(1,.78);}
      else if(elite&&e.state==='windup'&&e.attackVariant==='dash'){c.rotate(-.11*e.facing);c.translate(18,6);}
      c.drawImage(img,-w*.5,-h+3,w,h);
      if(e.type==='shield'){
        c.fillStyle='#2f3b4a';c.strokeStyle='#c0a46d';c.lineWidth=5;c.beginPath();c.roundRect(-78,-172,54,84,9);c.fill();c.stroke();c.strokeStyle='rgba(230,220,185,.45)';c.lineWidth=2;c.beginPath();c.moveTo(-51,-162);c.lineTo(-51,-100);c.stroke();
      }else if(e.type==='archer'){
        c.strokeStyle='#8b6745';c.lineWidth=6;c.beginPath();c.arc(58,-142,48,-Math.PI/2,Math.PI/2);c.stroke();c.beginPath();c.moveTo(58,-190);c.lineTo(58,-94);c.stroke();
      }else if(elite){
        c.strokeStyle='#d8bc78';c.lineWidth=6;c.beginPath();c.moveTo(-20,-270);c.lineTo(0,-312);c.lineTo(20,-270);c.stroke();c.fillStyle='#8a2630';c.beginPath();c.moveTo(-26,-222);c.lineTo(-106,-184);c.lineTo(-74,-114);c.lineTo(-12,-160);c.closePath();c.fill();
      }
      c.restore();
      const pct=e.hp/e.maxHp;const width=elite?154:100;c.fillStyle='#08111acc';c.fillRect(x-width/2,e.y-(elite?332:278),width,elite?11:8);c.fillStyle=e.state==='execution'?'#ffe67c':e.state==='stagger'?'#f1d47b':elite?'#b72e36':'#d9484e';c.fillRect(x-width/2+2,e.y-(elite?329:276),(width-4)*pct,elite?6:4);
      if(elite){c.fillStyle=e.state==='execution'?'#ffe890':'#f0dfb5';c.font='700 12px Georgia';c.textAlign='center';c.fillText(e.state==='execution'?'EXECUTION READY':'RUIN KNIGHT',x,e.y-344);}
    }
  }
  drawParticles(c,camera,world){for(const p of world.particles){const x=this.sx(p.x,camera),a=clamp(p.life/p.max,0,1);c.globalAlpha=a;c.fillStyle=p.kind==='spark'?'#ffeec0':p.kind==='dust'?'#d4c5a8':'#bfe9ff';c.beginPath();c.arc(x,p.y,p.size*a,0,Math.PI*2);c.fill()}c.globalAlpha=1}
  drawForeground(c,camera,world){
    c.save();
    if(world.upperRuins?.entered){
      for(let i=0;i<46;i++){const x=((i*139+world.time*28)-camera.x*.11)%2200-120;const y=150+(i*73)%760;c.globalAlpha=.09+(i%5)*.018;c.fillStyle=i%4===0?'#d8f5ff':'#d8e6de';c.beginPath();c.arc(x,y,1.4+(i%3),0,Math.PI*2);c.fill();}
      const fog=c.createLinearGradient(0,700,0,1080);fog.addColorStop(0,'rgba(204,234,228,0)');fog.addColorStop(1,'rgba(32,55,52,.54)');c.globalAlpha=1;c.fillStyle=fog;c.fillRect(0,680,VIEW.width,400);
    }else if(world.shrine?.entered){
      for(let i=0;i<34;i++){
        const x=((i*173+world.time*13)-camera.x*.08)%2100-80;const y=230+(i*71)%620+Math.sin(world.time*.8+i)*14;
        c.globalAlpha=.12+(i%4)*.025;c.fillStyle=i%3===0?'#b7e6ff':'#d9dfd7';c.beginPath();c.arc(x,y,1.5+(i%3),0,Math.PI*2);c.fill();
      }
      const fog=c.createLinearGradient(0,690,0,1080);fog.addColorStop(0,'rgba(151,192,190,0)');fog.addColorStop(1,'rgba(26,46,44,.58)');c.globalAlpha=1;c.fillStyle=fog;c.fillRect(0,650,VIEW.width,430);
    }else{
      for(const g of world.grassSeeds){
        const x=g.x-camera.x*1.10;if(x<-80||x>VIEW.width+80)continue;const base=groundYAt(g.x)+138;const sway=Math.sin(world.time*2+g.phase)*8;
        c.strokeStyle='rgba(34,68,39,.72)';c.lineWidth=4;c.beginPath();c.moveTo(x,base);c.quadraticCurveTo(x+sway,base-38-g.h*.45,x+sway*.55,base-76-g.h);c.stroke();
      }
      for(const f of world.flowers??[]){const x=f.x-camera.x*1.04;if(x<-40||x>VIEW.width+40)continue;const y=groundYAt(f.x)+44;c.globalAlpha=.72;c.fillStyle=f.phase%2>1?'#f5e7ac':'#edf4f3';c.beginPath();c.arc(x+Math.sin(world.time*2+f.phase)*3,y-34,f.size,0,Math.PI*2);c.fill();}
      c.globalAlpha=.34;const grad=c.createLinearGradient(0,760,0,1080);grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(1,'rgba(10,29,21,.93)');c.fillStyle=grad;c.fillRect(0,740,VIEW.width,340);
    }
    c.restore();
  }
  drawVignette(c,game){const g=c.createRadialGradient(VIEW.width/2,VIEW.height*.45,300,VIEW.width/2,VIEW.height*.55,900);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(1,7,12,.42)');c.fillStyle=g;c.fillRect(0,0,VIEW.width,VIEW.height);if(game.perfectDodgeSlow>0){c.fillStyle=`rgba(154,211,235,${Math.min(.12,game.perfectDodgeSlow*.26)})`;c.fillRect(0,0,VIEW.width,VIEW.height)}if(game.hitStop>0){c.fillStyle=`rgba(255,255,255,${Math.min(.18,game.hitStop*1.8)})`;c.fillRect(0,0,VIEW.width,VIEW.height)}}
}
