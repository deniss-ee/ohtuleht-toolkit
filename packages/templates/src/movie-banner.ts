// Movie banner: a background picture with a looping muted video on top and a mute button. The whole banner is one click area.
import { clickAttr, CLICKTAG_JS } from "./clicktag.ts";
import { escapeHtml, escapeJsInAttr } from "./escape.ts";

export type VideoPosition = "left" | "center" | "right";

export interface MovieBannerConfig {
  title: string;
  width: number; // banner size = size of the background picture
  height: number;
  background: string; // file name inside the zip
  video: string; // file name inside the zip
  videoHeight: number;
  position: VideoPosition;
  offset: number; // px from the left or right edge (ignored when centred)
  href: string; // optional; empty = the ad server's own click address
}

const VOLUME_OFF = '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M4.34 2.93L2.93 4.34 7.29 8.7 7 9H3v6h4l5 5v-6.59l4.18 4.18c-.65.49-1.38.88-2.18 1.11v2.06c1.34-.3 2.57-.92 3.61-1.75l2.05 2.05 1.41-1.41L4.34 2.93zM10 15.17L7.83 13H5v-2h2.83l.88-.88L10 11.41v3.76zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zm-7-8l-1.88 1.88L12 7.76zm4.5 8c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>';
const PAUSE = '<path d="M0 0h24v24H0z" fill="none"/><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
const PLAY = '<path d="M0 0h24v24H0z" fill="none"/><path d="M8 5v14l11-7z"/>';
const VOLUME_ON = '<path d="M0 0h24v24H0V0z" fill="none"/><path d="M3 9v6h4l5 5V4L7 9H3zm7-.17v6.34L7.83 13H5v-2h2.83L10 8.83zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>';

function placement(c: MovieBannerConfig): string {
  if (c.position === "left") return `left:${c.offset}px;top:50%;transform:translateY(-50%);`;
  if (c.position === "right") return `right:${c.offset}px;top:50%;transform:translateY(-50%);`;
  return "left:50%;top:50%;transform:translate(-50%,-50%);";
}

export function renderMovieBanner(c: MovieBannerConfig): string {
  const icon = (id: string, paths: string, hidden: boolean) =>
    `<svg id="${id}" xmlns="http://www.w3.org/2000/svg" height="30" width="30" viewBox="0 0 24 24" fill="#fff"${hidden ? ' style="display:none"' : ""} aria-hidden="true">${paths}</svg>`;
  return `<!DOCTYPE html>
<html lang="et">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(c.title)}</title>
<meta name="viewport" content="width=${c.width},user-scalable=no">
<script>${CLICKTAG_JS}</script>
<style>
body{margin:0;padding:0;cursor:pointer}
.banner-bg{background:url('${c.background}') center center/cover no-repeat;width:${c.width}px;height:${c.height}px;position:relative;overflow:hidden}
.video-wrap{position:absolute;z-index:2;${placement(c)}height:${c.videoHeight}px;width:auto}
video{height:100%;width:auto;display:block;object-fit:contain;background:#000}
#video-controls{position:absolute;top:10px;right:20px;z-index:100;display:flex;gap:5px}
#video-controls button{background:transparent;width:30px;height:30px;border:0;padding:0;opacity:.7;border-radius:15px;cursor:pointer}
#video-controls button:hover,#video-controls button:focus-visible{opacity:1}
#video-controls svg{pointer-events:none;display:block}
</style>
</head>
<body onclick="${clickAttr(escapeJsInAttr(c.href))}">
<div class="banner-bg">
<div class="video-wrap">
<video src="${c.video}" autoplay loop muted playsinline></video>
<div id="video-controls">
<button type="button" id="video-control-play" aria-label="Peata või esita video" onclick="event.stopPropagation();toggleVideoPlay()">
${icon("icon-pause", PAUSE, false)}
${icon("icon-play", PLAY, true)}
</button>
<button type="button" id="video-control-audio" aria-label="Heli sisse või välja" onclick="event.stopPropagation();toggleVideoAudio()">
${icon("volume-off", VOLUME_OFF, false)}
${icon("volume-on", VOLUME_ON, true)}
</button>
</div>
</div>
</div>
<script>
function toggleVideoAudio(){var v=document.querySelector('video'),off=document.getElementById('volume-off'),on=document.getElementById('volume-on');v.muted=!v.muted;off.style.display=v.muted?'block':'none';on.style.display=v.muted?'none':'block'}
function toggleVideoPlay(){var v=document.querySelector('video'),p=document.getElementById('icon-pause'),l=document.getElementById('icon-play');if(v.paused){v.play()}else{v.pause()}p.style.display=v.paused?'none':'block';l.style.display=v.paused?'block':'none'}
</script>
</body>
</html>
`;
}
