import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Friendly, professional "business assistant" — a stylised SVG character with a
 * headset, a relaxed-confident expression and a welcoming wave. GSAP drives a
 * gentle idle loop (float, breathing, blink, head tilt, wave, sparkle twinkle)
 * so it feels alive and ready to serve. Respects reduced-motion.
 */
const AssistantCharacter: React.FC<{ className?: string }> = ({ className }) => {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const reduce = typeof window !== 'undefined'
            && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) return;

        const ctx = gsap.context(() => {
            gsap.set('.ac-arm', { svgOrigin: '171 184' });
            gsap.set('.ac-head', { svgOrigin: '120 142' });

            // Entrance
            gsap.from('.ac-root', { scale: 0.82, opacity: 0, duration: 0.7, ease: 'back.out(1.6)', transformOrigin: '50% 70%' });

            // Idle loops
            gsap.to('.ac-float', { y: -7, duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true });
            gsap.to('.ac-breath', { scaleY: 1.025, transformOrigin: '50% 100%', duration: 1.9, ease: 'sine.inOut', repeat: -1, yoyo: true });
            gsap.to('.ac-head', { rotation: 2.4, duration: 3, ease: 'sine.inOut', repeat: -1, yoyo: true });
            gsap.to('.ac-eyes', { scaleY: 0.12, transformOrigin: '50% 50%', duration: 0.08, repeat: -1, yoyo: true, repeatDelay: 2.7 });
            gsap.to('.ac-spark', { scale: 0.5, opacity: 0.3, transformOrigin: '50% 50%', duration: 1.1, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.45 });

            // Friendly wave, every few seconds
            gsap.timeline({ repeat: -1, repeatDelay: 2.4 })
                .to('.ac-arm', { rotation: 14, duration: 0.32, ease: 'sine.inOut' })
                .to('.ac-arm', { rotation: -8, duration: 0.3, ease: 'sine.inOut' })
                .to('.ac-arm', { rotation: 11, duration: 0.3, ease: 'sine.inOut' })
                .to('.ac-arm', { rotation: 0, duration: 0.34, ease: 'sine.inOut' });
        }, rootRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={rootRef} className={className} aria-hidden="true">
            <svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
                <g className="ac-root">
                    {/* Soft halo */}
                    <circle cx="120" cy="118" r="104" fill="#ffffff" opacity="0.10" />
                    <circle cx="120" cy="118" r="80" fill="#ffffff" opacity="0.08" />

                    {/* Twinkles */}
                    <path className="ac-spark" d="M198 84 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#ffd66b" />
                    <path className="ac-spark" d="M66 78 l2.4 5.4 5.4 2.4 -5.4 2.4 -2.4 5.4 -2.4 -5.4 -5.4 -2.4 5.4 -2.4 z" fill="#ffffff" opacity="0.9" />
                    <path className="ac-spark" d="M188 150 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2 z" fill="#ffd66b" opacity="0.85" />

                    <g className="ac-float">
                        {/* Shoulders / blazer */}
                        <path className="ac-breath" d="M56 236 C56 184 84 166 120 166 C156 166 184 184 184 236 Z" fill="#16a394" />
                        {/* Lapels */}
                        <path d="M120 168 L99 236 L114 236 L120 198 Z" fill="#0f7e72" />
                        <path d="M120 168 L141 236 L126 236 L120 198 Z" fill="#0f7e72" />
                        {/* Shirt + tie */}
                        <path d="M120 168 L103 202 L120 216 L137 202 Z" fill="#ffffff" />
                        <path d="M120 178 L114 192 L120 224 L126 192 Z" fill="#ffb86b" />

                        {/* Neck */}
                        <rect x="108" y="136" width="24" height="36" rx="11" fill="#e7b78f" />

                        {/* Waving hand */}
                        <g className="ac-arm">
                            <path d="M170 188 C190 180 200 152 200 132" fill="none" stroke="#16a394" strokeWidth="19" strokeLinecap="round" />
                            <circle cx="200" cy="128" r="12" fill="#0f7e72" />
                            <circle cx="200" cy="116" r="14" fill="#f4cda6" />
                        </g>

                        {/* Head */}
                        <g className="ac-head">
                            <circle cx="85" cy="112" r="8" fill="#efc59c" />
                            <circle cx="155" cy="112" r="8" fill="#efc59c" />
                            <circle cx="120" cy="108" r="40" fill="#f4cda6" />

                            {/* Cheeks */}
                            <circle cx="97" cy="123" r="5.5" fill="#f0a878" opacity="0.45" />
                            <circle cx="143" cy="123" r="5.5" fill="#f0a878" opacity="0.45" />

                            {/* Hair */}
                            <path d="M80 112 C80 76 98 58 120 58 C142 58 160 76 160 112 C160 95 149 80 120 80 C91 80 80 95 80 112 Z" fill="#2f2620" />

                            {/* Headset band */}
                            <path d="M83 104 C83 71 157 71 157 104" fill="none" stroke="#2b2b3a" strokeWidth="6" strokeLinecap="round" />
                            {/* Earpiece */}
                            <rect x="77" y="103" width="12" height="19" rx="6" fill="#2b2b3a" />
                            {/* Mic boom */}
                            <path d="M83 122 C83 141 100 142 109 133" fill="none" stroke="#2b2b3a" strokeWidth="4" strokeLinecap="round" />
                            <circle cx="110" cy="132" r="3.6" fill="#16a394" />

                            {/* Brows */}
                            <rect x="100" y="98" width="15" height="3.6" rx="1.8" fill="#3a2f28" />
                            <rect x="125" y="98" width="15" height="3.6" rx="1.8" fill="#3a2f28" />

                            {/* Eyes */}
                            <g className="ac-eyes">
                                <circle cx="107" cy="110" r="4.3" fill="#2b2b3a" />
                                <circle cx="133" cy="110" r="4.3" fill="#2b2b3a" />
                                <circle cx="108.5" cy="108.5" r="1.3" fill="#ffffff" />
                                <circle cx="134.5" cy="108.5" r="1.3" fill="#ffffff" />
                            </g>

                            {/* Relaxed, confident smile */}
                            <path d="M107 125 Q120 136 133 125" fill="none" stroke="#b5734e" strokeWidth="3.6" strokeLinecap="round" />
                        </g>
                    </g>
                </g>
            </svg>
        </div>
    );
};

export default AssistantCharacter;
