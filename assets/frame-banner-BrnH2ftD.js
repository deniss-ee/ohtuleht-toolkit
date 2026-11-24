import{at as e,it as t,nt as n,ot as r,q as i,rt as a,tt as o}from"./zip-6mPzMBK_.js";var s=4e3,c=e=>/^https?:\/\//.test(e.trim()),l=e=>e.frames.map(t=>Math.max(t.holdMs??e.holdMs,e.fadeMs,300));function u(e,t){let n=Math.max(0,t),r=e.map(e=>Math.max(e,n,1)),i=[],a=0;for(let e of r)i.push(a),a+=e+n;return{v:i,total:a,f:n}}var d=e=>e>0?e:2;function f(e,t,n,r,i){let a=d(i),o=e<t-1?n[e+1]:r;if(e===0)return{opacity:[[0,1],[o,1],[o+a,0],[r-a,0],[r,1]],z:[[0,2],[o,1],[o+a,0],[r-a,3]]};let s=n[e]-a;return e===t-1?{opacity:[[0,1],[a,0],[s,0],[n[e],1],[r,1]],z:[[0,1],[a,0],[s,3],[n[e],2]]}:{opacity:[[0,0],[s,0],[n[e],1],[o,1],[o+a,0],[r,0]],z:[[0,0],[s,3],[n[e],2],[o,1],[o+a,0]]}}function p(e,t,n,r){let i=[],a=-1;for(let[e,o]of n){let n=+(e/r*100).toFixed(4);n<=a&&(n=+(a+1e-4).toFixed(4)),!(n>100)&&(a=n,i.push(`${n}%{${t}:${o}}`))}return i[0]?.startsWith(`0%`)||i.unshift(`0%{${t}:${n[0][1]}}`),a<100&&i.push(`100%{${t}:${n[n.length-1][1]}}`),`@keyframes ${e}{${i.join(``)}}`}function m(e){let t=e.holds.length;if(t<2)return{css:``,total:0};let{v:n,total:r,f:i}=u(e.holds,e.fadeMs),a=`${-Math.round(d(i))}ms`,o=e.name??``,s=``,c=``;for(let l=0;l<t;l++){let u=f(l,t,n,r,i);s+=p(`${o}o${l}`,`opacity`,u.opacity,r)+p(`${o}z${l}`,`z-index`,u.z,r),c+=`${e.scope} .ol-fr:nth-of-type(${l+1}){animation:${o}o${l} ${Math.round(r)}ms linear ${a} ${e.rounds} both,${o}z${l} ${Math.round(r)}ms step-end ${a} ${e.rounds} both}`}return{css:s+c,total:r}}function h(e){let t=e.loop.forever?`infinite`:String(Math.max(1,Math.round(e.loop.times)));return m({scope:`.ol-frames`,holds:l(e),fadeMs:e.fadeMs,rounds:t})}function g(i){let{css:s}=h(i),c=i.responsive?`width:100%;aspect-ratio:`+i.width+`/`+i.height:`width:${i.width}px;height:${i.height}px`,l=i.backgroundColor?`background:${i.backgroundColor};`:``,u=i.backgroundImage?`<div class="ol-bg" style="background:url('${o(i.backgroundImage)}') center center/cover no-repeat"></div>\n`:``,d=i.frames.map((e,t)=>`<img class="ol-fr${t===0?` ol-first`:``}" src="${n(e.image)}" alt="" draggable="false" decoding="async">`).join(`
`),f=i.respectMotion?`@media (prefers-reduced-motion:reduce){.ol-fr{animation:none!important}.ol-fr:not(.ol-first){opacity:0!important}.ol-first{opacity:1!important;z-index:2!important}}`:``,p=i.pauseOnHover?`.ol-frames:hover .ol-fr{animation-play-state:paused}`:``;return`<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<title>${n(i.campaign)}</title>
<meta name="viewport" content="${i.responsive?`width=device-width,initial-scale=1`:`width=${i.width},user-scalable=no`}">
<script>${e}<\/script>
<style>
html,body{margin:0;padding:0${i.responsive?`;width:100%`:``}}
body{cursor:pointer}
.ol-frames{position:relative;overflow:hidden;${c};${l}}
.ol-bg,.ol-fr{position:absolute;left:0;top:0;width:100%;height:100%;display:block;user-select:none;-webkit-user-drag:none}
.ol-bg{z-index:0}
.ol-fr{object-fit:${i.fit===`fill`?`fill`:i.fit};opacity:0;z-index:0;will-change:opacity;backface-visibility:hidden;transform:translateZ(0)}
.ol-first{opacity:1;z-index:2}
${s}${p}${f}
</style>
</head>
<body onclick="${r(a(i.href))}">
<div class="ol-frames" role="img" aria-label="${n(i.campaign)}">
${u}${d}
</div>
<script type="application/json" id="ol-banner">${t(i)}<\/script>
</body>
</html>
`}function _(e,t=`en`){let n=i(t),r=[];e.campaign.trim()||r.push({message:n.campaign,field:`campaign`}),e.frames.length<2&&r.push({message:n.frameMin(2,e.frames.length),field:`frames-add`});let a=e=>!Number.isFinite(e)||e<20||e>4e3;(a(e.width)||a(e.height))&&r.push({message:n.frameSize(20,s),field:`size-width`});let o=e.frames.map(t=>t.holdMs??e.holdMs);return o.some(e=>!Number.isFinite(e)||e<300)?r.push({message:n.frameHold(300/1e3),field:`hold`}):(!Number.isFinite(e.fadeMs)||e.fadeMs<0||e.fadeMs>Math.min(...o))&&r.push({message:n.frameFade,field:`fade`}),!e.loop.forever&&!(e.loop.times>=1)&&r.push({message:n.frameLoop,field:`loop-times`}),e.href.trim()!==``&&!c(e.href)&&r.push({message:n.frameHref,field:`href`}),e.backgroundColor&&!/^#[0-9a-fA-F]{6}$/.test(e.backgroundColor)&&r.push({message:n.frameBgColor,field:`bg-color`}),r}export{_ as i,m as n,g as r,l as t};