import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const WIDGET_ANIMATIONS = [
  { id: "app-store",    duration: 3, scale: 0.9, x: 500,  y: 100,  ease: "power4.out" },
  { id: "screen-time",  duration: 3, scale: 0.9, x: -500, y: -300, ease: "power2.out" },
  { id: "weather",      duration: 3, scale: 1.1, x: -400, y: 350,  ease: "power4.out" },
  { id: "stocks",       duration: 3, scale: 0.9, x: 530,  y: -170, ease: "power4.out" },
  { id: "fitness",      duration: 3, scale: 1.1, x: -350, y: -100, ease: "power2.out" },
  { id: "find-my",      duration: 3, scale: 1.1, x: 400,  y: -360, ease: "power4.out" },
  { id: "calendar",     duration: 3, scale: 0.9, x: -630, y: 0,    ease: "power2.out" },
  { id: "wallet",       duration: 3, scale: 1.0, x: -280, y: 100,  ease: "power4.out" },
  { id: "apple-tv",     duration: 3, scale: 1.0, x: 500,  y: 300,  ease: "power4.out" },
  { id: "sleep",        duration: 3, scale: 0.9, x: 270,  y: -50,  ease: "power2.out" },
  { id: "socials",      duration: 3, scale: 1.0, x: 330,  y: 120,  ease: "power2.out" },
];

const WIDGET_SRCS: Record<string, string> = {
  "app-store":   "https://assets.codepen.io/8292695/appstore-widget.svg",
  "screen-time": "https://assets.codepen.io/8292695/screen-time-widget.svg",
  "weather":     "https://assets.codepen.io/8292695/weather-widget.svg",
  "stocks":      "https://assets.codepen.io/8292695/stocks-widget.svg",
  "calendar":    "https://assets.codepen.io/8292695/calendar-widget.svg",
  "fitness":     "https://assets.codepen.io/8292695/fitness-widget.svg",
  "find-my":     "https://assets.codepen.io/8292695/find-my-widget.svg",
  "sleep":       "https://assets.codepen.io/8292695/sleep-widget.svg",
  "apple-tv":    "https://assets.codepen.io/8292695/apple-tv.svg",
  "wallet":      "https://assets.codepen.io/8292695/wallet.svg",
};

export default function IPhoneWidgetsAnimation() {
  const sectionRef = useRef<HTMLElement>(null);
  const iphoneRef = useRef<HTMLImageElement>(null);
  const widgetRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const iphone = iphoneRef.current;
    const section = sectionRef.current;
    if (!iphone || !section) return;

    const allWidgetEls = Object.values(widgetRefs.current).filter(Boolean) as HTMLElement[];

    // Initial state
    gsap.set(iphone, { x: -450, rotation: 90 });
    gsap.set(allWidgetEls, { opacity: 0, scale: 0 });

    // iPhone sub-timeline
    const iphoneTl = gsap.timeline({ defaults: { duration: 1 } });
    iphoneTl
      .to(iphone, { x: 0 })
      .to(iphone, { rotation: 0, scale: 0.9 })
      .to(iphone, { duration: 3, scale: 1 });

    // Widget visibility sub-timeline
    const widgetTl = gsap.timeline();
    widgetTl.to(allWidgetEls, { duration: 0, opacity: 1 });

    // Master timeline
    const START_TIME = 2;
    const masterTl = gsap.timeline();
    masterTl.add(iphoneTl).add(widgetTl, START_TIME);

    WIDGET_ANIMATIONS.forEach((anim, index) => {
      const el = widgetRefs.current[anim.id];
      if (!el) return;
      masterTl.add(
        gsap.to(el, {
          duration: anim.duration,
          scale: anim.scale,
          x: anim.x,
          y: anim.y,
          ease: anim.ease,
        }),
        START_TIME + (index % 3) / 2
      );
    });

    // ScrollTrigger
    const st = ScrollTrigger.create({
      animation: masterTl,
      trigger: section,
      scrub: 1,
      pin: true,
    });

    return () => {
      st.kill();
      masterTl.kill();
    };
  }, []);

  const setWidgetRef = (id: string) => (el: HTMLElement | null) => {
    widgetRefs.current[id] = el;
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          background: #0d0d0d;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        body::-webkit-scrollbar { display: none; }
      `}</style>

      <section
        ref={sectionRef}
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
        }}
      >
        {/* iPhone */}
        <img
          ref={iphoneRef}
          src="https://assets.codepen.io/8292695/iphone-14.svg"
          alt="iPhone 14"
          style={{ position: "absolute", height: "600px" }}
        />

        {/* SVG Widgets */}
        {Object.entries(WIDGET_SRCS).map(([id, src]) => (
          <img
            key={id}
            ref={setWidgetRef(id) as React.RefCallback<HTMLImageElement>}
            src={src}
            alt={id}
            style={{ position: "absolute", zIndex: -1, scale: "0" }}
          />
        ))}

        {/* Socials widget */}
        <div
          ref={setWidgetRef("socials") as React.RefCallback<HTMLDivElement>}
          style={{
            position: "absolute",
            zIndex: -1,
            scale: "0",
            background: "linear-gradient(#ff348b, #e30217)",
            borderRadius: "30px",
            aspectRatio: "1",
            height: "140px",
            display: "flex",
            justifyContent: "space-evenly",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <a
            href="https://twitter.com/GibsonSMurray"
            target="_blank"
            rel="noreferrer"
            title="𝕏 account"
            style={{
              textDecoration: "none",
              fontSize: "30px",
              fontFamily: "sans-serif",
              backgroundColor: "white",
              aspectRatio: "1",
              height: "50px",
              borderRadius: "100%",
              color: "black",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span>𝕏</span>
          </a>
          <a
            href="https://haptic.app/"
            target="_blank"
            rel="noreferrer"
            title="inspiration"
            style={{
              textDecoration: "none",
              fontSize: "30px",
              fontFamily: "sans-serif",
              backgroundColor: "white",
              aspectRatio: "1",
              height: "50px",
              borderRadius: "100%",
              color: "black",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <span>✰</span>
          </a>
        </div>
      </section>
    </>
  );
}
