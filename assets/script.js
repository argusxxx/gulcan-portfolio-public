(()=>{"use strict";
const menu=document.querySelector(".menu-button"),nav=document.querySelector(".nav-links");
if(menu&&nav){menu.addEventListener("click",()=>{const open=nav.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.textContent=open?"✕":"☰"});nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="☰"}));}
const glimpse=document.querySelector(".glimpse-art-scroll");
if(glimpse){const centerGlimpse=()=>{if(window.matchMedia("(max-width:680px)").matches&&glimpse.scrollLeft===0){glimpse.scrollLeft=Math.max(0,(glimpse.scrollWidth-glimpse.clientWidth)/2)}};const art=glimpse.querySelector("img");if(art?.complete)centerGlimpse();else art?.addEventListener("load",centerGlimpse,{once:true});}
/* Mobile brand lockup: match the two lines' natural rendered widths.
   Change ONLY the subtitle's font size, never stretch or scale its glyphs. */
const mobileBrandQuery=window.matchMedia("(max-width:700px)");
const brandPairs=[...document.querySelectorAll(".editorial-site .ed-identity")].map(mark=>({
  title:mark.querySelector("strong"),
  subtitle:mark.querySelector(".ed-role")
})).filter(item=>item.title&&item.subtitle);
function syncMobileBrandWidth(){
  for(const {title,subtitle} of brandPairs){
    subtitle.style.removeProperty("font-size");
    if(!mobileBrandQuery.matches)continue;
    const titleWidth=title.getBoundingClientRect().width;
    const subtitleWidth=subtitle.getBoundingClientRect().width;
    const baseFontSize=parseFloat(getComputedStyle(subtitle).fontSize);
    if(titleWidth>0&&subtitleWidth>0&&baseFontSize>0){
      subtitle.style.fontSize=(baseFontSize*titleWidth/subtitleWidth).toFixed(3)+"px";
      /* Second pass compensates for fractional pixel rounding and text layout. */
      const adjustedWidth=subtitle.getBoundingClientRect().width;
      if(adjustedWidth>0&&Math.abs(titleWidth-adjustedWidth)>.35){
        const adjustedSize=parseFloat(subtitle.style.fontSize);
        subtitle.style.fontSize=(adjustedSize*titleWidth/adjustedWidth).toFixed(3)+"px";
      }
    }
  }
}
if(brandPairs.length){
  syncMobileBrandWidth();
  document.fonts?.ready?.then(syncMobileBrandWidth);
  window.addEventListener("resize",syncMobileBrandWidth,{passive:true});
}
const book=document.getElementById("portfolio-book");if(!book)return;
const prev=document.getElementById("prev-page"),next=document.getElementById("next-page"),counter=document.getElementById("page-count"),status=document.getElementById("portfolio-status"),download=document.getElementById("pdf-download");
const demo=[
{title:"Selected works",image:"hero-architecture.svg",meta:"Architecture · Interiors",cover:true},
{title:"A practice in seeing space.",image:"about-study.svg",meta:"Selected studies"},
{title:"Knowledge Oasis",image:"project-knowledge.svg",meta:"Concept & exploration"},
{title:"Hobby House",image:"project-hobby.svg",meta:"Spatial study"},
{title:"Terroir House",image:"project-terroir.svg",meta:"Materials & form"},
{title:"Thank you.",image:"about-study.svg",meta:"Gülcan · Portfolio"}];
let pdf=null,total=demo.length,pageIndex=0,busy=false,mobile=window.matchMedia("(max-width:700px)").matches,token=0;
function spread(){if(mobile)return[pageIndex];if(pageIndex===0)return[null,0];return[pageIndex,pageIndex+1<total?pageIndex+1:null]}
function content(item,i){if(!item)return '<article class="demo-page blank"></article>';return '<article class="demo-page '+(item.cover?'cover':'')+'"><small>GÜLCAN / ARCHITECTURE</small><h3>'+item.title+'</h3><img alt="Conceptual architecture illustration placeholder" src="/assets/'+item.image+'"><div class="page-foot"><span>'+item.meta+'</span><span>'+String(i+1).padStart(2,'0')+'</span></div></article>'}
async function drawPdf(el,i,t){const canvas=document.createElement("canvas");el.appendChild(canvas);try{const pdfPage=await pdf.getPage(i+1);if(t!==token)return;const base=pdfPage.getViewport({scale:1}),width=el.clientWidth||500,height=el.clientHeight||650,dpr=Math.min(devicePixelRatio||1,1.5),scale=Math.min(width*dpr/base.width,height*dpr/base.height);const viewport=pdfPage.getViewport({scale});canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);await pdfPage.render({canvasContext:canvas.getContext("2d"),viewport}).promise}catch(e){console.warn(e);el.textContent="Unable to display this PDF page. Use the download link."}}
function display(){let t=++token,visible=spread();book.innerHTML="";visible.forEach(i=>{const el=document.createElement("div");el.className="book-page";if(i===null){el.innerHTML=content(null)}else if(pdf){drawPdf(el,i,t)}else{el.innerHTML=content(demo[i],i)}book.appendChild(el)});prev.disabled=pageIndex===0;next.disabled=mobile?pageIndex>=total-1:pageIndex>=total-2;const ids=visible.filter(i=>i!==null).map(i=>i+1);counter.textContent=ids.join("–")+" / "+total}
function move(dir){if(busy)return;const dest=mobile?pageIndex+dir:dir>0?(pageIndex===0?1:pageIndex+2):(pageIndex<=1?0:pageIndex-2);if(dest<0||dest>=total||(dir>0&&!mobile&&pageIndex>=total-2))return;busy=true;book.classList.add("flipping");setTimeout(()=>{pageIndex=dest;display();book.classList.remove("flipping");busy=false},220)}
prev.addEventListener("click",()=>move(-1));next.addEventListener("click",()=>move(1));window.addEventListener("keydown",e=>{if(e.target.closest("input,textarea,button"))return;if(e.key==="ArrowRight")move(1);if(e.key==="ArrowLeft")move(-1)});
let touchX=null;book.addEventListener("touchstart",e=>{touchX=e.changedTouches[0].screenX},{passive:true});book.addEventListener("touchend",e=>{if(touchX===null)return;const dx=e.changedTouches[0].screenX-touchX;touchX=null;if(Math.abs(dx)>45)move(dx<0?1:-1)},{passive:true});
window.addEventListener("resize",()=>{const now=window.matchMedia("(max-width:700px)").matches;if(now!==mobile){mobile=now;display()}});
display();
(async()=>{try{const url="/assets/portfolio.pdf",head=await fetch(url,{method:"HEAD"});if(!head.ok||!(head.headers.get("content-type")||"").includes("pdf"))return;download.hidden=false;download.href=url;status.textContent="INTERACTIVE PDF PORTFOLIO";await new Promise((resolve,reject)=>{let s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=resolve;s.onerror=reject;document.head.append(s)});const lib=window.pdfjsLib;if(!lib)throw Error("pdfjsLib unavailable");lib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";pdf=await lib.getDocument({url}).promise;total=pdf.numPages;pageIndex=0;display()}catch(err){console.warn("Portfolio viewer:",err);status.textContent="PDF AVAILABLE · USE DOWNLOAD"}})();
})();