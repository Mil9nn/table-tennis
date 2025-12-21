import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
}: UseInViewOptions = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Track if we've already triggered to prevent duplicate animations
    let hasTriggered = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only trigger animation once per element
        if (entry.isIntersecting && !hasTriggered) {
          hasTriggered = true;
          // Delay to ensure clear false->true state transition for animations
          setTimeout(() => {
            setIsInView(true);
          }, 100);

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce && !entry.isIntersecting) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}
