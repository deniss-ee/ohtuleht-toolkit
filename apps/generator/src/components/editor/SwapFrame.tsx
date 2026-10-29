import { useEffect, useRef, useState, type DependencyList } from "react";
import { editor as t } from "@/content";

// Each frame keeps the size it was built for, so an old frame is not stretched to a new size while the new one loads.
export interface Geometry {
  width: number | string;
  height: number;
}

interface Frame {
  id: number;
  html: string;
  geom: Geometry;
  fade: boolean; // size changed (e.g. desktop to mobile): fade the new frame in
}

// Runs inside a preview frame: tells the app when fonts, images and the page itself are ready,
// so frames can be swapped without a flash of unstyled text.
export const readySignal = (id: number) =>
  "<script>(function(){var id=" +
  id +
  ',sent=false;function send(){if(sent)return;sent=true;parent.postMessage({olPreview:id},"*")}' +
  'var link=document.querySelector("link[media]");' +
  'var sheet=new Promise(function(r){if(!link||link.media==="all")r();else link.addEventListener("load",r)});' +
  'var fonts=sheet.then(function(){return Promise.all([document.fonts.load(\'700 20px "Fira Sans Condensed"\'),document.fonts.load("700 12px Roboto")])});' +
  'var loaded=new Promise(function(r){if(document.readyState==="complete")r();else window.addEventListener("load",r)});' +
  "Promise.all([fonts,loaded]).then(send,send);setTimeout(send,2500)})();</script>";

function PreviewFrame({
  frame,
  width,
  height,
  scale,
  title,
  hidden,
  frameRef,
}: {
  frame: Frame;
  width: number | string;
  height: number;
  scale: number;
  title: string;
  hidden?: boolean;
  frameRef?: (el: HTMLIFrameElement | null) => void;
}) {
  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={frame.html}
      sandbox="allow-scripts allow-popups"
      width={width}
      height={height}
      tabIndex={hidden ? -1 : undefined}
      aria-hidden={hidden}
      className={frame.fade && !hidden ? "ol-fade-in" : undefined}
      style={{
        border: 0,
        transform: scale === 1 ? undefined : `scale(${scale})`,
        transformOrigin: "top left",
        display: "block",
        position: hidden ? "absolute" : "relative",
        top: 0,
        left: 0,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
      }}
    />
  );
}

// A preview that does not flicker. A change is rendered in a second, hidden frame first; it replaces the
// visible one only when its fonts and images are ready. `build` makes the html (it must add readySignal(id));
// the frame is rebuilt shortly after `deps` stop changing. Put it inside a `relative` box with a fixed height.
export function SwapFrame({
  build,
  deps,
  width,
  height,
  scaleFor = () => 1,
  onShown,
  title = "Preview",
}: {
  build: (id: number) => string;
  deps: DependencyList;
  width: number | string;
  height: number;
  scaleFor?: (width: number) => number; // scale that fits a frame of this width into the preview area (default: full size)
  onShown?: (g: Geometry) => void; // a new frame is now visible
  title?: string;
}) {
  const [current, setCurrent] = useState<Frame | null>(null);
  const [pending, setPending] = useState<Frame | null>(null);
  const pendingFrame = useRef<HTMLIFrameElement | null>(null);
  const counter = useRef(0);
  const buildRef = useRef(build);
  buildRef.current = build;

  useEffect(() => {
    const timer = setTimeout(() => {
      const id = ++counter.current;
      setPending({ id, html: buildRef.current(id), geom: { width, height }, fade: false });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!pending) return;
    const swap = () => {
      const changed = !!current && (current.geom.width !== pending.geom.width || current.geom.height !== pending.geom.height);
      setCurrent({ ...pending, fade: changed });
      setPending(null);
      onShown?.(pending.geom);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source === pendingFrame.current?.contentWindow && (e.data as { olPreview?: number } | null)?.olPreview === pending.id) swap();
    };
    window.addEventListener("message", onMessage);
    const fallback = setTimeout(swap, 4000); // never leave an old version showing for long
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(fallback);
    };
  }, [pending]);

  return (
    <>
      {!current && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">{t.previewLoading}</div>}
      {current && <PreviewFrame key={current.id} frame={current} width={current.geom.width} height={current.geom.height} scale={typeof current.geom.width === "number" ? scaleFor(current.geom.width) : 1} title={title} />}
      {pending && <PreviewFrame key={pending.id} frame={pending} width={pending.geom.width} height={pending.geom.height} scale={typeof pending.geom.width === "number" ? scaleFor(pending.geom.width) : 1} title={title} hidden frameRef={(el) => (pendingFrame.current = el)} />}
    </>
  );
}
