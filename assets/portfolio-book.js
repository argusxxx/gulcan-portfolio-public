/* Gülcan — PDF architectural book. Real PDF at /assets/portfolio.pdf */
(function(){
"use strict";
const host=document.getElementById("architecture-book");
if(!host)return;
const shell=document.getElementById("folio-reader");
const loading=document.getElementById("folio-loading");
const message=document.getElementById("folio-message");
const count=document.getElementById("folio-counter");
const prev=document.getElementById("folio-prev");
const next=document.getElementById("folio-next");
const zoomButton=document.getElementById("folio-zoom-open");
const soundButton=document.getElementById("folio-sound");
const zoomDialog=document.getElementById("folio-zoom-dialog");
const zoomClose=document.getElementById("folio-zoom-close");
const zoomRange=document.getElementById("folio-zoom-range");
const zoomPages=document.getElementById("folio-zoom-pages");
const zoomLabel=document.getElementById("folio-zoom-label");
const fullscreenButton=document.getElementById("folio-fullscreen");
const pdfUrl="/assets/portfolio.pdf";
const tr=document.documentElement.lang==="tr";
let pdf=null,flip=null,total=0,aspect=1.41,pageW=500,pageH=704,active=0;
let renderQueue=[],queued=new Set(),rendered=new Set(),activeJobs=0,buildId=0,lastW=window.innerWidth;
let audio=null,soundEnabled=false,zoomLevel=1,zoomId=0;
function setMessage(text,isError){message.textContent=text;message.hidden=!text;message.classList.toggle("is-error",!!isError);}
function setReady(on){prev.disabled=next.disabled=zoomButton.disabled=soundButton.disabled=fullscreenButton.disabled=!on;}
function currentStart(){if(!flip)return 0;const raw=flip.getCurrentPageIndex();return raw===0?0:(raw%2===0?raw-1:raw);}
function spreadIndices(){const n=currentStart();return n===0?[0]:[n,n+1].filter(i=>i<total);}
function pageLabel(){const v=spreadIndices().map(i=>String(i+1).padStart(2,"0"));return v.join(" — ")+" / "+String(total).padStart(2,"0");}
function navUpdate(){if(!flip)return;active=currentStart();count.textContent=pageLabel();prev.disabled=active===0;next.disabled=(active===0?total<=1:active+2>=total);zoomLabel.textContent=pageLabel();host.classList.toggle("folio-book-cover",active===0);}
function playRustle(){
 if(!soundEnabled)return;
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)return;
  audio=audio||new Ctx();
  if(audio.state==="suspended")audio.resume().catch(function(){});
  const seconds=.22,buffer=audio.createBuffer(1,Math.round(audio.sampleRate*seconds),audio.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++){const t=i/data.length;data[i]=(Math.random()*2-1)*Math.sin(Math.PI*t)*(.35+.65*(1-t));}
  const source=audio.createBufferSource();source.buffer=buffer;
  const filter=audio.createBiquadFilter();filter.type="bandpass";filter.frequency.value=1700;filter.Q.value=.7;
  const gain=audio.createGain();gain.gain.value=.095;
  source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start();
 }catch(e){console.warn("Sound unavailable",e);}
}
function addToQueue(i,priority){
 if(i<0||i>=total||queued.has(i)||rendered.has(i))return;
 queued.add(i);
 if(priority)renderQueue.unshift(i);else renderQueue.push(i);
}
function requestNearby(){
 if(!flip||!pdf)return;
 const n=currentStart(),first=n;
 // Keep the facing pages and immediate next/previous turns ready.
 [first,first+1,first+2,first+3,first-1,first-2,first+4,first+5].forEach((i,k)=>addToQueue(i,k<4));
 runQueue();
}
async function renderPage(i,epoch){
 const node=host.querySelector('.folio-leaf[data-page="'+i+'"]');
 if(!node||epoch!==buildId)return;
 try{
  const page=await pdf.getPage(i+1);
  if(epoch!==buildId)return;
  const natural=page.getViewport({scale:1});
  const pixelRatio=Math.min(window.devicePixelRatio||1,2);
  const scale=Math.min(pageW/natural.width,pageH/natural.height)*pixelRatio;
  const view=page.getViewport({scale:scale});
  const canvas=document.createElement("canvas");
  canvas.width=Math.max(1,Math.ceil(view.width));canvas.height=Math.max(1,Math.ceil(view.height));
  canvas.className="folio-canvas";canvas.setAttribute("aria-hidden","true");
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("Canvas unavailable");
  ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);
  await page.render({canvasContext:ctx,viewport:view,background:"#ffffff"}).promise;
  if(epoch!==buildId)return;
  node.replaceChildren(canvas);
  node.classList.add("folio-leaf-ready");
  rendered.add(i);
 }catch(e){
  console.error("PDF page "+(i+1),e);
  if(epoch===buildId&&node){node.textContent=tr?(i+1)+". sayfa görüntülenemedi.":"Page "+(i+1)+" could not be displayed.";node.classList.add("folio-leaf-failed");}
 }
}
function runQueue(){
 if(!pdf)return;
 while(activeJobs<2&&renderQueue.length){
  const n=renderQueue.shift();const epoch=buildId;activeJobs++;
  renderPage(n,epoch).finally(()=>{activeJobs--;queued.delete(n);runQueue();});
 }
}
function initializeBook(index){
 buildId++;
 renderQueue=[];queued.clear();rendered.clear();
 if(flip){try{flip.destroy();}catch(e){} flip=null;}
 host.replaceChildren();
 // The original 200px-tall host caused StPageFlip to center its full-height
 // pages above the reader while the turning animation ran in the reader below.
 // Measure the stable outer area, then reserve the *actual* book dimensions.
 const stageWidth=Math.max(240,Math.floor(host.parentElement?.clientWidth||shell.clientWidth||window.innerWidth-40));
 const maxStageHeight=Math.max(275,Math.min(760,Math.floor(window.innerHeight*.72)));
 pageW=Math.floor(Math.min(650,(stageWidth-12)/2,maxStageHeight/aspect));
 pageW=Math.max(105,pageW);pageH=Math.max(120,Math.round(pageW*aspect));
 host.style.width=(pageW*2)+"px";
 host.style.height=pageH+"px";
 host.style.minHeight=pageH+"px";
 const leaves=[];
 // The first PDF page is a real hard cover; StPageFlip opens directly to PDF pages 2 and 3.
 for(let i=0;i<total;i++){
  const el=document.createElement("div");el.className="folio-leaf"+(i===0?" folio-leaf-cover":"");
  el.dataset.page=String(i);
  el.setAttribute("role","img");el.setAttribute("aria-label",tr?"Portfolyo sayfası "+(i+1)+" / "+total:"Portfolio page "+(i+1)+" of "+total);
  if(i===0)el.setAttribute("data-density","hard");
  const loader=document.createElement("div");loader.className="folio-leaf-wait";
  loader.textContent=String(i+1).padStart(2,"0");el.appendChild(loader);
  leaves.push(el);host.appendChild(el);
 }
 flip=new window.St.PageFlip(host,{
  width:pageW,height:pageH,size:"fixed",showCover:true,usePortrait:false,
  startPage:index,drawShadow:true,maxShadowOpacity:.43,
  flippingTime:920,mobileScrollSupport:false,swipeDistance:28,autoSize:false
 });
 flip.loadFromHTML(leaves);
 flip.on("flip",function(){navUpdate();requestNearby();playRustle();});
 flip.on("init",function(){navUpdate();requestNearby();});
 navUpdate();requestNearby();
}
function showFailed(e){
 console.error("Portfolio reader:",e);
 loading.hidden=true;setReady(false);
 setMessage(tr?"İnteraktif portfolyo yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.":"The interactive reader could not load. Please refresh the page and try again.",true);
}
async function init(){
 setReady(false);
 try{
  if(!window.pdfjsLib||!window.St||!window.St.PageFlip)throw new Error("Book libraries did not load");
  window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  pdf=await window.pdfjsLib.getDocument({url:pdfUrl,rangeChunkSize:65536}).promise;
  total=pdf.numPages;
  if(!total)throw new Error("The PDF has no pages");
  const first=await pdf.getPage(1),v=first.getViewport({scale:1});
  aspect=v.height/v.width;
  if(!Number.isFinite(aspect)||aspect<=0)throw new Error("Invalid page dimensions");
  initializeBook(0);loading.hidden=true;setReady(true);navUpdate();
  // A clear fallback remains available if the library cannot draw a particular page.
 }catch(e){showFailed(e);}
}
prev.addEventListener("click",function(){if(flip){if(active===1)host.classList.add("folio-book-cover");flip.flipPrev();}});
next.addEventListener("click",function(){if(flip){if(active===0)host.classList.remove("folio-book-cover");flip.flipNext();}});
soundButton.addEventListener("click",function(){
 soundEnabled=!soundEnabled;
 soundButton.setAttribute("aria-pressed",String(soundEnabled));
 soundButton.querySelector(".folio-sound-text").textContent=soundEnabled?(tr?"Ses açık":"Sound on"):(tr?"Ses kapalı":"Sound off");
 if(soundEnabled){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(Ctx){audio=audio||new Ctx();audio.resume().catch(function(){});}}catch(e){}}
});
function zoomTo(value){
 zoomLevel=value;zoomRange.value=String(value);
 const base=Math.max(260,Math.min(1400,zoomDialog.clientWidth-70));
 zoomPages.style.width=Math.round(base*zoomLevel)+"px";
 document.getElementById("folio-zoom-value").textContent=Math.round(zoomLevel*100)+"%";
}
async function showZoom(){
 if(!pdf)return;
 const epoch=++zoomId;
 const indices=spreadIndices();
 zoomDialog.hidden=false;document.body.classList.add("folio-modal-active");
 zoomPages.replaceChildren();
 const pages=indices.length===1?[null,indices[0]]:indices;
 pages.forEach(i=>{
  const cell=document.createElement("div");cell.className="folio-zoom-page";
  if(i===null){cell.classList.add("folio-zoom-blank");zoomPages.appendChild(cell);return;}
  cell.textContent=tr?(i+1)+". sayfa hazırlanıyor…":"Rendering page "+(i+1)+"…";zoomPages.appendChild(cell);
  (async()=>{
   try{
    const pg=await pdf.getPage(i+1);if(epoch!==zoomId)return;
    const natural=pg.getViewport({scale:1}),target=1400,scale=target/natural.width;
    const viewport=pg.getViewport({scale:scale});
    const canvas=document.createElement("canvas");canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
    const ctx=canvas.getContext("2d",{alpha:false});if(!ctx)return;
    await pg.render({canvasContext:ctx,viewport:viewport,background:"#ffffff"}).promise;
    if(epoch!==zoomId)return;
    canvas.setAttribute("aria-label",(tr?"Sayfa ":"Page ")+(i+1));
    cell.replaceChildren(canvas);
   }catch(e){if(epoch===zoomId)cell.textContent=tr?"Sayfa görüntülenemiyor.":"Page cannot be displayed.";}
  })();
 });
 zoomLabel.textContent=pageLabel();zoomTo(1);
 zoomClose.focus();
}
function closeZoom(){zoomId++;zoomDialog.hidden=true;document.body.classList.remove("folio-modal-active");zoomPages.replaceChildren();zoomButton.focus();}
zoomButton.addEventListener("click",showZoom);
zoomClose.addEventListener("click",closeZoom);
zoomDialog.addEventListener("click",e=>{if(e.target===zoomDialog)closeZoom();});
zoomRange.addEventListener("input",()=>zoomTo(Number(zoomRange.value)));
fullscreenButton.addEventListener("click",function(){
 if(document.fullscreenElement){document.exitFullscreen?.();return;}
 if(shell.requestFullscreen){shell.requestFullscreen().catch(()=>showZoom());}else showZoom();
});
document.addEventListener("fullscreenchange",function(){
 fullscreenButton.textContent=document.fullscreenElement?(tr?"Tam ekrandan çık":"Exit fullscreen"):(tr?"Tam ekran":"Fullscreen");
});
window.addEventListener("keydown",function(e){
 if(!zoomDialog.hidden){if(e.key==="Escape"){closeZoom();e.preventDefault();}return;}
 if(!flip||e.target.closest("input,textarea,select,button,a"))return;
 if(e.key==="ArrowRight"){if(active===0)host.classList.remove("folio-book-cover");flip.flipNext();e.preventDefault();}
 if(e.key==="ArrowLeft"){if(active===1)host.classList.add("folio-book-cover");flip.flipPrev();e.preventDefault();}
});
let resizeTimer=null;
window.addEventListener("resize",function(){
 if(!pdf||!flip)return;
 clearTimeout(resizeTimer);
 resizeTimer=setTimeout(function(){
  if(Math.abs(window.innerWidth-lastW)<22)return;
  lastW=window.innerWidth;
  initializeBook(active);
 },300);
});
init();
})();