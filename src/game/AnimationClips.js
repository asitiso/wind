const F=(duration,pose={})=>({duration,...pose});

export const ANIMATION_CLIPS={
  idle:{loop:true,frames:[
    F(.22,{y:0,rot:0,sy:1,cape:.04}),F(.22,{y:-2,rot:-.006,sy:1.006,cape:.09}),F(.22,{y:-1,rot:.004,sy:1.003,cape:.03}),F(.22,{y:1,rot:.006,sy:.998,cape:-.03}),
  ]},
  'run-start':{loop:false,frames:[
    F(.055,{x:-2,y:2,rot:-.08,sx:1.04,sy:.965,cape:.58}),F(.055,{x:2,y:-4,rot:-.065,sx:1.02,sy:1.02,cape:.72}),F(.055,{x:6,y:-1,rot:-.04,sx:1.01,sy:.99,cape:.82}),F(.055,{x:4,y:-5,rot:-.025,sx:1.01,sy:1.015,cape:.76}),
  ]},
  run:{loop:true,frames:[
    F(.075,{x:0,y:3,rot:-.035,sy:.99,cape:.78}),F(.075,{x:4,y:-5,rot:-.02,sy:1.015,cape:.88}),F(.075,{x:8,y:1,rot:-.03,sy:.995,cape:.82}),F(.075,{x:4,y:-6,rot:-.016,sy:1.018,cape:.9}),F(.075,{x:0,y:3,rot:-.035,sy:.99,cape:.8}),F(.075,{x:-3,y:-4,rot:-.024,sy:1.014,cape:.87}),
  ]},
  'run-stop':{loop:false,frames:[
    F(.07,{x:5,y:2,rot:.07,sx:.985,sy:1.02,cape:.58}),F(.07,{x:2,y:0,rot:.04,sx:.995,sy:1.01,cape:.38}),F(.07,{x:0,y:0,rot:.015,sx:1,sy:1,cape:.18}),
  ]},
  turn:{loop:false,frames:[
    F(.055,{x:0,y:3,rot:.075,sx:.95,sy:1.03,cape:.54}),F(.055,{x:-3,y:0,rot:.02,sx:.9,sy:1.04,cape:.35}),F(.055,{x:0,y:-2,rot:-.035,sx:.98,sy:1.02,cape:.48}),
  ]},
  'jump-rise':{loop:true,frames:[F(.11,{y:-2,rot:-.055,sx:.985,sy:1.035,cape:.38}),F(.11,{y:-5,rot:-.035,sx:.99,sy:1.025,cape:.28})]},
  'jump-apex':{loop:true,frames:[F(.12,{y:-6,rot:.008,sx:1.018,sy:.988,cape:.08}),F(.12,{y:-7,rot:.016,sx:1.02,sy:.985,cape:.02})]},
  fall:{loop:true,frames:[F(.12,{y:-3,rot:.05,sx:1.025,sy:.985,cape:-.10}),F(.12,{y:-1,rot:.065,sx:1.03,sy:.98,cape:-.15})]},
  land:{loop:false,frames:[F(.055,{y:7,sx:1.07,sy:.91,cape:.22}),F(.055,{y:3,sx:1.035,sy:.96,cape:.16}),F(.07,{y:0,sx:1,sy:1,cape:.10})]},
  'hard-land':{loop:false,frames:[F(.07,{y:11,sx:1.12,sy:.85,cape:.34}),F(.07,{y:7,sx:1.08,sy:.9,cape:.28}),F(.07,{y:3,sx:1.03,sy:.96,cape:.18}),F(.09,{y:0,sx:1,sy:1,cape:.1})]},
  dash:{loop:true,frames:[F(.06,{x:10,y:1,rot:-.12,sx:1.09,sy:.95,cape:1}),F(.06,{x:14,y:-2,rot:-.10,sx:1.075,sy:.96,cape:.94})]},
  attack:{loop:false,frames:[F(.06,{x:0,y:0,rot:-.02,cape:.42}),F(.07,{x:7,y:-2,rot:-.06,cape:.58}),F(.07,{x:13,y:1,rot:.035,cape:.68}),F(.10,{x:5,y:0,rot:.01,cape:.38})]},
};

export function clipFrame(state,time){
  const clip=ANIMATION_CLIPS[state]??ANIMATION_CLIPS.idle;
  const total=clip.frames.reduce((sum,f)=>sum+f.duration,0)||1;
  let t=clip.loop?((time%total)+total)%total:Math.min(Math.max(0,time),Math.max(0,total-1e-6));
  let acc=0;
  for(let i=0;i<clip.frames.length;i++){
    acc+=clip.frames[i].duration;
    if(t<acc||i===clip.frames.length-1)return {index:i,frame:clip.frames[i],progress:total?Math.min(1,time/total):0,total};
  }
  return {index:0,frame:clip.frames[0],progress:0,total};
}
