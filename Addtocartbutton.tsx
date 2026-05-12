import { useRef, useCallback } from "react";
import gsap from "gsap";

// ─── Icons ────────────────────────────────────────────────────────────────────
// Paths to your PNG icons in the /public/icons folder
const ICONS = [
    "/icons/star.png",
    "/icons/sphera.png",
    "/icons/png.png",
    "/icons/shape1.png",
    "/icons/shape3.png",
    "/icons/shape4.png",
    "/icons/shape5.png",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomBetween(min: number, max: number) {
    return min + Math.random() * (max - min);
}

// ─── Component ────────────────────────────────────────────────────────────────
interface AddToCartButtonProps {
    /** Button label – the text is split into two halves automatically */
    label?: string;
    onClick?: () => boolean | void;
    className?: string;
    style?: React.CSSProperties;
}

export default function AddToCartButton({
    label = "Add to Cart",
    onClick,
    className = "",
    style,
}: AddToCartButtonProps) {
    const btnRef = useRef<HTMLButtonElement>(null);
    const leftRef = useRef<HTMLSpanElement>(null);
    const rightRef = useRef<HTMLSpanElement>(null);
    const iconsContainerRef = useRef<HTMLSpanElement>(null);
    const isAnimatingRef = useRef(false);

    // Split label in half by words
    const words = label.split(" ");
    const mid = Math.ceil(words.length / 2);
    const leftText = words.slice(0, mid).join(" ");
    const rightText = words.slice(mid).join(" ");

    const fireAnimation = useCallback(() => {
        if (isAnimatingRef.current) return;
        isAnimatingRef.current = true;

        const btn = btnRef.current;
        const left = leftRef.current;
        const right = rightRef.current;
        const container = iconsContainerRef.current;
        if (!btn || !left || !right || !container) return;

        const btnWidth = btn.offsetWidth;
        const GAP = btnWidth * 0.18; // how far each half moves outward

        // 1. Split text outward
        const tl = gsap.timeline({
            onComplete: () => {
                isAnimatingRef.current = false;
            },
        });

        tl.to([left, right], {
            x: (i) => (i === 0 ? -GAP : GAP),
            duration: 0.5,
            ease: "power3.out",
        });

        // 2. Launch icons from center one-by-one
        const COUNT = 6;
        const ICON_SIZE = 48;

        for (let i = 0; i < COUNT; i++) {
            const delay = 0.05 + i * 0.1; // Slightly faster stagger

            tl.call(
                () => {
                    // create icon element
                    const wrapper = document.createElement("span");
                    wrapper.style.cssText = `
            position: absolute;
            left: 50%;
            bottom: 50%;
            transform: translateX(-50%);
            width: ${ICON_SIZE}px;
            height: ${ICON_SIZE}px;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: -1;
          `;
                    const iconSrc = ICONS[i % ICONS.length];
                    const div = document.createElement("div");
                    div.style.cssText = "width:100%;height:100%;display:flex;align-items:center;justify-content:center;";
                    div.innerHTML = `<img src="${iconSrc}" style="width:100%;height:100%;object-fit:contain;" alt="icon" />`;
                    wrapper.appendChild(div);
                    container.appendChild(wrapper);

                    // Randomize horizontal offset slightly
                    const xDrift = randomBetween(-70, 70);
                    const peakY = -(btn.offsetHeight * randomBetween(3.2, 4.8));
                    const scalePeak = randomBetween(0.8, 1.2);
                    const startRot = randomBetween(-30, 30);
                    const endRot = randomBetween(-100, 100);

                    gsap.fromTo(
                        wrapper,
                        { y: 0, x: 0, scale: 0.1, opacity: 0, rotation: startRot },
                        {
                            keyframes: [
                                // Launch up – grow
                                { y: peakY * 0.5, x: xDrift * 0.5, scale: scalePeak, opacity: 1, rotation: startRot + (endRot - startRot) * 0.4, duration: 0.3, ease: "power2.out" },
                                // Peak
                                { y: peakY, x: xDrift, scale: scalePeak * 1.1, rotation: startRot + (endRot - startRot) * 0.7, duration: 0.3, ease: "power1.inOut" },
                                // Fall with gravity – shrink and quickly fade out behind button
                                { y: btn.offsetHeight * 1.5, x: xDrift * 1.5, scale: scalePeak * 0.5, opacity: 0, rotation: endRot, duration: 0.35, ease: "power2.in" },
                            ],
                            onComplete: () => wrapper.remove(),
                        }
                    );
                },
                [],
                delay
            );
        }

        // 3. Return text to original position after icons finish
        tl.to(
            [left, right],
            {
                x: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.6)",
            },
            `+=${COUNT * 0.1 + 0.15}` // Trigger text close sooner
        );
    }, []);

    // Desktop: removed hover animation so it only pops on click
    const handleMouseEnter = useCallback(() => {
        // We only want the Add to Cart logic to trigger specifically on click now.
    }, []);

    // Mobile: touchend fires animation
    const handleTouchEnd = useCallback(
        (e: React.TouchEvent) => {
            e.preventDefault(); // Prevent duplicate firing on mobile
            const result = onClick?.();
            if (result !== false) {
                fireAnimation();
            }
        },
        [fireAnimation, onClick]
    );

    const handleClick = useCallback(
        () => {
            const result = onClick?.();
            if (result !== false) {
                fireAnimation();
            }
        },
        [onClick, fireAnimation]
    );

    return (
        <button
            ref={btnRef}
            className={`atc-btn ${className}`}
            style={{
                position: "relative",
                overflow: "visible",
                flex: 1,
                height: "3.5rem",
                backgroundColor: "#000",
                color: "#fff",
                fontWeight: 700,
                textTransform: "uppercase",
                fontSize: "0.75rem",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.08em",
                userSelect: "none",
                WebkitTapHighlightColor: "transparent",
                ...style,
            }}
            onMouseEnter={handleMouseEnter}
            onTouchEnd={handleTouchEnd}
            onClick={handleClick}
        >
            {/* Icons container */}
            <span
                ref={iconsContainerRef}
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    overflow: "visible",
                    zIndex: -1, // Ensure container doesn't block interactions
                }}
            />

            {/* Left half of text */}
            <span
                ref={leftRef}
                style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    willChange: "transform",
                }}
            >
                {leftText}
            </span>

            {/* Tiny gap between words */}
            <span style={{ display: "inline-block", width: "0.35em" }} />

            {/* Right half of text */}
            <span
                ref={rightRef}
                style={{
                    display: "inline-block",
                    whiteSpace: "nowrap",
                    willChange: "transform",
                }}
            >
                {rightText}
            </span>
        </button>
    );
}

