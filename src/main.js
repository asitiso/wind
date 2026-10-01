import {Game} from './game/Game.js';
const canvas=document.querySelector('#game');
if(!(canvas instanceof HTMLCanvasElement))throw new Error('Game canvas missing');
const game=new Game(canvas);
game.start().catch(error=>{console.error(error);const loading=document.querySelector('#loading');if(loading)loading.innerHTML='<strong>LOAD ERROR</strong><span>개발자 콘솔을 확인하세요.</span>';});
window.__windriseGame=game;
