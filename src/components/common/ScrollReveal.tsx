import React, { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay in milliseconds
  duration?: number; // Duration in milliseconds (default: 800)
  distance?: number; // Distance in pixels to rise up (default: 24)
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 800,
  distance = 24,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's prefers-reduced-motion setting for accessibility
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const currentRef = elementRef.current;
    if (!currentRef) return;

    const rect = currentRef.getBoundingClientRect();
    if (rect.top <= (window.innerHeight || 800) + 100) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target); // Animate once and stay visible
        }
      },
      {
        threshold: 0.01,
        rootMargin: '100px 0px 50px 0px',
      }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, []);

  const transitionStyles: React.CSSProperties = {
    transitionProperty: 'opacity, transform',
    transitionDuration: `${Math.min(duration, 400)}ms`,
    transitionDelay: `${delay}ms`,
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'none' : `translateY(${Math.min(distance, 14)}px)`,
    willChange: 'opacity, transform',
  };

  return (
    <div ref={elementRef} style={transitionStyles} className={className}>
      {children}
    </div>
  );
};
