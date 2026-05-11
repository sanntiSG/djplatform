import { useEffect, useRef } from "react";
import gsap from "gsap";

const NUMBER_OF_PANELS = 12;
const ROTATION_COEF = 5;

interface SpotifyWrappedAnimationProps {
  title?: string;
  subtitle?: string;
}

export default function SpotifyWrappedAnimation({
  title = "Spotify Wrapped<br>2025",
  subtitle = "Imran Manzoor",
}: SpotifyWrappedAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const panel1Refs = useRef<HTMLDivElement[]>([]);
  const panel2Refs = useRef<HTMLDivElement[]>([]);
  const calloutRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLHeadingElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const buildTimeline = () => {
    const tl = gsap.timeline({ repeat: -1 });
    tlRef.current = tl;

    const elHeight = window.innerHeight / NUMBER_OF_PANELS;
    const elWidth = window.innerWidth / NUMBER_OF_PANELS;

    const callout = calloutRef.current;
    const sub = subtitleRef.current;
    const panels = panel1Refs.current;
    const secondaryPanels = panel2Refs.current;

    if (!callout || !sub) return;

    // Text entrance
    tl.fromTo(callout, { left: "150%" }, { left: "50%", ease: "expo.out", duration: 1, delay: 1.2 }, 0);
    tl.to(callout, { y: "-60px", delay: 3, duration: 0.5, ease: "sine.out" }, 0);
    tl.fromTo(sub, { opacity: 0, y: 50 }, { opacity: 1, y: 0, ease: "sine.out", duration: 0.5, delay: 3 }, 0);

    // Text exit
    tl.to([callout, sub], { left: "-150%", ease: "sine.in", duration: 1, delay: 1.2 }, 4);

    panels.forEach((panel, i) => {
      const stopPosition = 100 - i * 1;
      const wi = window.innerWidth - elWidth * (12 - i) + elWidth;
      const he = window.innerHeight - elHeight * (12 - i) + elHeight;

      const gradStart = `linear-gradient(105deg,rgba(255,149,236,1) 0%,rgba(255,89,226,1) 6%,rgba(255,0,211,1) 19%,rgba(255,0,0,1) 72%,rgba(0,0,0,1) ${stopPosition}%)`;
      const gradMid = `linear-gradient(90deg,rgba(255,180,200,1) 0%,rgba(255,89,226,1) 6%,rgba(255,0,211,1) 19%,rgba(255,0,0,1) 72%,rgba(0,0,0,1) ${stopPosition}%)`;
      const gradFull = `linear-gradient(90deg,rgba(255,180,200,1) 0%,rgba(255,89,226,1) 6%,rgba(255,0,211,1) 19%,rgba(255,0,0,1) 72%,rgba(0,0,0,1) 100%)`;

      tl.fromTo(
        panel,
        { y: elHeight * 5.5, x: elWidth * 5.5, width: 0, height: 0, rotation: -360, background: gradStart },
        {
          width: wi, height: he,
          y: -elHeight / 1.33 + ((12 - i) * elHeight) / 1.33,
          x: 0,
          duration: 1 + 0.1 * (12 - i),
          ease: "sine.inOut",
          rotation: 0,
          background: gradStart,
        },
        0
      );

      tl.to(panel, { rotation: 12 * ROTATION_COEF - (i + 1) * ROTATION_COEF, duration: 3, background: gradMid, ease: "linear" }, ">");

      tl.to(
        panel,
        {
          rotation: 360,
          y: -elHeight / 6 + ((12 - i) * elHeight) / 6,
          x: -elWidth / 1.2 + ((12 - i) * elWidth) / 1.2,
          background: gradFull,
          ease: "sine.inOut",
          duration: 1,
        },
        ">"
      );

      tl.to(panel, { rotation: 12 * ROTATION_COEF - (i + 1) * ROTATION_COEF + 360, duration: 4, background: gradFull, ease: "linear" }, ">");

      if (i === 0) {
        tl.addLabel("splitStart", "-=0.8");
      }

      secondaryPanels.forEach((twoPanel, index) => {
        const wi2 = window.innerWidth - elWidth * index + elWidth;

        tl.fromTo(
          twoPanel,
          { y: elHeight * 5.5, x: elWidth * 5.5, width: 0, height: 0, rotation: -360, background: gradStart },
          {
            rotation: -90,
            y: 0 + (index * elHeight) / 4 - wi2,
            x: -elWidth / 2 + (index * elWidth) / 2,
            width: wi2, height: wi2,
            background: gradFull,
            ease: "sine.inOut",
            duration: 1,
          },
          "splitStart+=" + String(0.05 * index)
        );

        tl.to(twoPanel, { rotation: 12 * ROTATION_COEF - (12 - index) * ROTATION_COEF - 90, duration: 5, background: gradFull, ease: "linear" }, ">");

        tl.to(
          twoPanel,
          {
            rotation: 300,
            y: 0 + (index * elHeight) / 2 - wi2,
            x: window.innerWidth * 1.1 - wi2 * 1.2,
            width: wi2, height: wi2,
            background: gradFull, ease: "sine.inOut", duration: 1,
          },
          ">"
        );

        tl.to(twoPanel, { rotation: "+=15", duration: 5, background: gradFull, ease: "linear" }, ">");

        tl.to(
          twoPanel,
          {
            rotation: "+=360",
            y: "-=" + String(wi2 * 2),
            x: "+=" + String(wi2 * 2),
            width: wi2, height: wi2,
            background: gradFull, ease: "sine.inOut", duration: 1,
          },
          ">"
        );
      });

      if (i === 0) {
        tl.to(
          panel,
          {
            rotation: 720 + 90,
            y: window.innerHeight - ((12 - i) * elHeight) / 4,
            x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
            width: 0, height: 0, opacity: 0,
            background: gradFull, ease: "sine.inOut", duration: 1,
          },
          "splitStart+=" + String(0.05 * i)
        );
      } else {
        tl.to(
          panel,
          {
            rotation: 720 + 90,
            y: window.innerHeight - ((12 - i) * elHeight) / 4,
            x: -elWidth / 2 + ((12 - i) * elWidth) / 2,
            width: wi, height: wi,
            background: gradFull, ease: "sine.inOut", duration: 1,
          },
          "splitStart+=" + String(0.05 * i)
        );

        tl.to(panel, { rotation: (12 * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 810, duration: 5, background: gradFull, ease: "linear" }, ">");
        tl.to(
          panel,
          {
            y: window.innerHeight - ((12 - i) * elHeight) / 2,
            x: 0 - elWidth * 1.2,
            rotation: (12 * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 1180,
            background: gradFull, ease: "sine.inOut", duration: 1,
          },
          ">"
        );
        tl.to(panel, { rotation: (12 * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 1200, duration: 5, background: gradFull, ease: "linear" }, ">");
        tl.to(
          panel,
          {
            y: "+=" + String(elHeight * 4),
            x: "-=" + String(elWidth * 4),
            rotation: (12 * ROTATION_COEF - (i + 1) * ROTATION_COEF) / 1.2 + 1500,
            background: gradFull, ease: "sine.inOut", duration: 1,
          },
          ">"
        );
      }
    });
  };

  useEffect(() => {
    buildTimeline();

    const handleResize = () => {
      tlRef.current?.clear();
      buildTimeline();
      tlRef.current?.progress(0);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      tlRef.current?.kill();
    };
  }, []);

  const panel1Styles: React.CSSProperties[] = Array.from({ length: NUMBER_OF_PANELS }, (_, i) => ({
    position: "absolute",
    width: "100vw",
    height: "100vh",
    zIndex: NUMBER_OF_PANELS - i,
    background: `linear-gradient(105deg, #ff95ec 0%, #ff59e2 6%, #ff00d3 19%, red 72%, black ${99 - i}%)`,
  }));

  const panel2Styles: React.CSSProperties[] = Array.from({ length: NUMBER_OF_PANELS }, (_, i) => ({
    position: "absolute",
    width: 0,
    height: 0,
    zIndex: NUMBER_OF_PANELS - i,
    background: `linear-gradient(105deg, #ff95ec 0%, #ff59e2 6%, #ff00d3 19%, red 72%, black ${99 - i}%)`,
  }));

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      {/* Primary panels */}
      {panel1Styles.map((style, i) => (
        <div
          key={`p1-${i}`}
          ref={(el) => { if (el) panel1Refs.current[i] = el; }}
          style={style}
        />
      ))}

      {/* Secondary panels */}
      {panel2Styles.map((style, i) => (
        <div
          key={`p2-${i}`}
          ref={(el) => { if (el) panel2Refs.current[i] = el; }}
          style={style}
        />
      ))}

      {/* Callout title */}
      <h1
        ref={calloutRef}
        dangerouslySetInnerHTML={{ __html: title }}
        style={{
          position: "absolute",
          fontSize: "50px",
          top: "52%",
          left: "50%",
          fontWeight: 900,
          color: "white",
          zIndex: 999,
          textAlign: "center",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
          margin: 0,
        }}
      />

      {/* Subtitle */}
      <h2
        ref={subtitleRef}
        style={{
          position: "absolute",
          fontSize: "20px",
          top: "52%",
          left: "50%",
          marginTop: "50px",
          fontWeight: 400,
          color: "white",
          zIndex: 999,
          textAlign: "center",
          transform: "translate(-50%, -50%)",
          margin: 0,
        }}
      >
        {subtitle}
      </h2>
    </div>
  );
}
