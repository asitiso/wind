export const VIEW={width:1920,height:1080};
export const WORLD={width:6200,groundY:820,startX:680};
export const PHYSICS={gravity:2900,runSpeed:520,airSpeed:440,jumpSpeed:1120,dashSpeed:1120,dashTime:.18,dashPerfectWindow:.115,airDashSpeed:1320,airDashTime:.22,coyote:.11,jumpBuffer:.13};
export const PLAYER={maxHp:320,maxStamina:100,height:286,width:106};
export const COLORS={player:'#f3f5f8',cape:'#a51d2e',armor:'#dce3e8',leather:'#583a2e',enemy:'#555966',enemyCape:'#6d2730'};
export const ATTACKS={
  light1:{duration:.30,activeStart:.085,activeEnd:.17,damage:28,range:148,hitStop:.045,shake:5,stamina:0,stagger:.18},
  light2:{duration:.32,activeStart:.08,activeEnd:.18,damage:32,range:155,hitStop:.05,shake:6,stamina:0,stagger:.22},
  light3:{duration:.42,activeStart:.105,activeEnd:.23,damage:46,range:178,hitStop:.07,shake:9,stamina:0,stagger:.34},
  heavy:{duration:.62,activeStart:.20,activeEnd:.34,damage:78,range:194,hitStop:.105,shake:15,stamina:20,stagger:.56},
  counter:{duration:.44,activeStart:.055,activeEnd:.21,damage:96,range:218,hitStop:.12,shake:18,stamina:0,stagger:.85},
};
export const ENEMY_PROFILES={
  sword:{hp:190,speed:110,range:178,preferred:150,damage:16,windup:.50,recover:.70},
  shield:{hp:260,speed:72,range:188,preferred:160,damage:22,windup:.58,recover:.78},
  archer:{hp:140,speed:78,range:560,preferred:410,damage:14,windup:.72,recover:1.05},
  elite:{hp:560,speed:148,range:220,preferred:185,damage:30,windup:.40,recover:.54},
  flying:{hp:120,speed:0,range:145,preferred:300,damage:18,windup:.48,recover:.75},
};
