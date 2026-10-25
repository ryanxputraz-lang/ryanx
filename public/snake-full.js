let snakeCanvas, snakeCtx, snakeInterval, snakeDir={x:1,y:0}, snakeBody=[{x:5,y:5}], food={x:10,y:10}, score=0;
function initSnake(){
  snakeCanvas=document.getElementById('snake'); if(!snakeCanvas) return;
  snakeCtx=snakeCanvas.getContext('2d');
  document.addEventListener('keydown', e=>{ 
    if(e.key==='ArrowUp' && snakeDir.y===0) snakeDir={x:0,y:-1};
    if(e.key==='ArrowDown' && snakeDir.y===0) snakeDir={x:0,y:1};
    if(e.key==='ArrowLeft' && snakeDir.x===0) snakeDir={x:-1,y:0};
    if(e.key==='ArrowRight' && snakeDir.x===0) snakeDir={x:1,y:0};
  });
}
function startSnake(){
  score=0; snakeBody=[{x:5,y:5}]; snakeDir={x:1,y:0}; placeFood();
  clearInterval(snakeInterval);
  snakeInterval=setInterval(loopSnake,120);
}
function placeFood(){ food={x:Math.floor(Math.random()*15), y:Math.floor(Math.random()*15)}; }
function loopSnake(){
  const head={x:snakeBody[0].x+snakeDir.x, y:snakeBody[0].y+snakeDir.y};
  if(head.x<0||head.x>=15||head.y<0||head.y>=15){ clearInterval(snakeInterval); alert('Game Over Ular! Score:'+score); return; }
  if(snakeBody.some(s=>s.x===head.x&&s.y===head.y)){ clearInterval(snakeInterval); alert('Nabrak! Score:'+score); return; }
  snakeBody.unshift(head);
  if(head.x===food.x && head.y===food.y){ score++; placeFood(); if(window.playGame) playGame('ular'); } else snakeBody.pop();
  drawSnake();
}
function drawSnake(){
  if(!snakeCtx) return;
  snakeCtx.fillStyle='#0f0f18'; snakeCtx.fillRect(0,0,300,300);
  snakeCtx.fillStyle='#ff4d4d'; snakeCtx.fillRect(food.x*20,food.y*20,18,18);
  snakeCtx.fillStyle='#6c5cff'; snakeBody.forEach((s,i)=>{ snakeCtx.fillRect(s.x*20,s.y*20,i===0?18:16,i===0?18:16); });
}
window.initSnake=initSnake; window.startSnake=startSnake;