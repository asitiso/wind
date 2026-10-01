export class Input{
  constructor(){
    this.down=new Set();this.pressed=new Set();this.released=new Set();
    this.map=new Map([['ArrowLeft','left'],['KeyA','left'],['ArrowRight','right'],['KeyD','right'],['Space','jump'],['ShiftLeft','dash'],['ShiftRight','dash'],['KeyJ','light'],['KeyK','heavy'],['KeyQ','parry'],['KeyE','execute']]);
    addEventListener('keydown',e=>{const a=this.map.get(e.code);if(!a)return;e.preventDefault();if(!this.down.has(a))this.pressed.add(a);this.down.add(a);});
    addEventListener('keyup',e=>{const a=this.map.get(e.code);if(!a)return;e.preventDefault();this.down.delete(a);this.released.add(a);});
    addEventListener('blur',()=>{this.down.clear();this.pressed.clear();this.released.clear();});
  }
  isDown(a){return this.down.has(a)} justPressed(a){return this.pressed.has(a)} justReleased(a){return this.released.has(a)}
  endFrame(){this.pressed.clear();this.released.clear()}
}
