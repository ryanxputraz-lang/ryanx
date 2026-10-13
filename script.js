// Matrix rain
const c=document.getElementById('matrix'),ctx=c.getContext('2d');
function resize(){c.width=innerWidth;c.height=innerHeight}
resize();window.addEventListener('resize',resize);
const chars="01$€¥₿/\\".split(""), drops=[];
const font=14; let cols=Math.floor(innerWidth/font);
for(let i=0;i<cols;i++) drops[i]=Math.random()*-100;
(function draw(){
 ctx.fillStyle="rgba(2,6,13,0.12)";ctx.fillRect(0,0,c.width,c.height);
 ctx.font=font+"px JetBrains Mono";
 drops.forEach((y,i)=>{
  const ch=chars[Math.floor(Math.random()*chars.length)];
  ctx.fillStyle=Math.random()>.3?"#00FF88":"#00E5FF";
  ctx.globalAlpha=Math.random()*.5+.2;
  ctx.fillText(ch,i*font,y*font);
  if(y*font>c.height && Math.random()>.975) drops[i]=0;
  drops[i]++;
 });
 ctx.globalAlpha=1;requestAnimationFrame(draw);
})();

// Typing hero
const title="DECODE THE\nMARKET_";let ti=0;const el=document.getElementById('heroTitle');
const iv=setInterval(()=>{el.textContent=title.slice(0,ti++); if(ti>title.length)clearInterval(iv)},70);

// Orb follow touch/mouse
const orb=document.getElementById('orb'), wrap=document.getElementById('orbWrap');
wrap.addEventListener('mousemove',e=>{
 const r=wrap.getBoundingClientRect();
 const x=(e.clientX-r.left-r.width/2)/10, y=(e.clientY-r.top-r.height/2)/10;
 orb.style.transform=`translate(${x}px,${y}px) scale(1.05)`;
});

// Ticker live
const pairs=[["EURUSD",1.0847],["GBPUSD",1.2721],["USDJPY",148.32],["XAUUSD",2034.12],["BTCUSD",43280]];
const track=document.getElementById('tickerTrack');
function renderTicker(){
 track.innerHTML=[...pairs,...pairs].map(([s,p])=>`<span>${s} ${p.toFixed(s.includes('JPY')?2:4)} <b style="color:${Math.random()>.5?'#00FF88':'#ff6b6b'}">${(Math.random()>.5?'+':'-')}${(Math.random()*1).toFixed(2)}%</b></span>`).join('');
}
renderTicker();setInterval(()=>{pairs.forEach(pr=>pr[1]+= (Math.random()-.5)*0.001); renderTicker()},1200);

// Candlestick chart
const chart=document.getElementById('chart'), g=chart.getContext('2d');
let candles=Array.from({length:50},(_,i)=>{let o=2030+Math.sin(i/5)*4+(Math.random()-.5)*2; return {o,c:o+(Math.random()-.5)*2,h:o+2,l:o-2}});
function drawChart(){
 const W=chart.width=chart.clientWidth, H=chart.height;
 g.clearRect(0,0,W,H);
 g.strokeStyle="rgba(0,229,255,.08)"; for(let i=0;i<5;i++){g.beginPath();g.moveTo(0,H/5*i);g.lineTo(W,H/5*i);g.stroke()}
 const min=Math.min(...candles.map(c=>c.l)), max=Math.max(...candles.map(c=>c.h));
 candles.forEach((c,i)=>{
  const x=W/candles.length*i+2, w=W/candles.length-4;
  const yO=H-(c.o-min)/(max-min)*H, yC=H-(c.c-min)/(max-min)*H;
  const yH=H-(c.h-min)/(max-min)*H, yL=H-(c.l-min)/(max-min)*H;
  const bull=c.c>c.o;
  g.fillStyle=bull?"#00FF88":"#ff5555"; g.strokeStyle=g.fillStyle;
  g.beginPath(); g.moveTo(x+w/2,yH); g.lineTo(x+w/2,yL); g.stroke();
  g.fillRect(x,Math.min(yO,yC),w,Math.abs(yO-yC)||1);
 });
}
drawChart(); setInterval(()=>{candles.shift(); let last=candles[candles.length-1]; let o=last.c; candles.push({o,c:o+(Math.random()-.5)*1.5,h:o+2,l:o-2}); drawChart()},2000);

// Code typing
const code=`import matrix as mx
def matrix_signal(candles):
    entropy = mx.calc_entropy(candles)
    if entropy > 0.84:
        return mx.LONG("XAUUSD", conf=0.92)
    return mx.WAIT()

signal = matrix_signal(feed.live())
print(f"[{signal.time}] {signal.pair} -> {signal.action}")`;
let ci=0; const codeEl=document.getElementById('codeBlock');
setInterval(()=>{codeEl.textContent=code.slice(0,ci++); if(ci>code.length)ci=0},40);