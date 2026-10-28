import { useEffect, useRef, useState, type DependencyList } from "react";
import { editor as t } from "@/content";

interface Frame {
  id: number;
  html: string;
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
  scale = 1,
  title = "Preview",
}: {
  build: (id: number) => string;
  deps: DependencyList;
  width: number | string;
  height: number;
  scale?: number;
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
      setPending({ id, html: buildRef.current(id) });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!pending) return;
    const swap = () => {
      setCurrent(pending);
      setPending(null);
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
      {current && <PreviewFrame key={current.id} frame={current} width={width} height={height} scale={scale} title={title} />}
      {pending && <PreviewFrame key={pending.id} frame={pending} width={width} height={height} scale={scale} title={title} hidden frameRef={(el) => (pendingFrame.current = el)} />}
    </>
  );
}
