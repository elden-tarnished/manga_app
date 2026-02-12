import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './Popup.module.css';

const Popup = ({ isOpen, onClose, title, children, animations }) => {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);

  const [isMounted, setIsMounted] = useState(false);
  const isClosingRef = useRef(false);

  const templates = useMemo(() => {
    // You can override any of these by passing `animations={{ open: ..., close: ... }}`
    return {
      open: animations?.open ?? (({ overlay, container }) => {
        const tl = gsap.timeline();
        tl.set(overlay, { autoAlpha: 0 });
        tl.set(container, { autoAlpha: 0, y: 10, scale: 0.98 });

        tl.to(overlay, { autoAlpha: 1, duration: 0.18, ease: 'power1.out' }, 0);
        tl.to(container, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }, 0);
        return tl;
      }),
      close: animations?.close ?? (({ overlay, container }) => {
        const tl = gsap.timeline();
        tl.to(container, { autoAlpha: 0, y: 10, scale: 0.98, duration: 0.18, ease: 'power2.in' }, 0);
        tl.to(overlay, { autoAlpha: 0, duration: 0.18, ease: 'power1.in' }, 0);
        return tl;
      }),
    };
  }, [animations]);

  // Mount/unmount based on isOpen, but keep mounted during close animation
  useEffect(() => {
    if (isOpen) setIsMounted(true);
  }, [isOpen]);

  // Handle Esc + body scroll lock while mounted
  useEffect(() => {
    if (!isMounted) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        requestClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  // Play open animation when mounted + opened
  useEffect(() => {
    if (!isMounted) return;
    if (!isOpen) return;

    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!overlay || !container) return;

    isClosingRef.current = false;

    const ctx = gsap.context(() => {
      templates.open({ overlay, container });
    }, overlay);

    return () => ctx.revert();
  }, [isMounted, isOpen, templates]);

  const requestClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    const overlay = overlayRef.current;
    const container = containerRef.current;
    if (!overlay || !container) {
      // Fallback: if refs aren't ready, just close
      setIsMounted(false);
      onClose?.();
      return;
    }

    gsap.killTweensOf([overlay, container]);

    const tl = templates.close({ overlay, container });
    tl.eventCallback('onComplete', () => {
      setIsMounted(false);
      isClosingRef.current = false;
      onClose?.();
    });
  };

  if (!isMounted) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      requestClose();
    }
  };

  return (
    <div ref={overlayRef} className={styles.overlay} onClick={handleOverlayClick}>
      <div
        ref={containerRef}
        className={styles.container}
        role="dialog"
        aria-modal="true"
        aria-labelledby="popup-title"
      >
        <div className={styles.header}>
          <h2 id="popup-title" className={styles.title}>
            {title}
          </h2>
          <button
            className={styles.closeButton}
            onClick={requestClose}
            aria-label="Close popup"
            type="button"
          >
            &times;
          </button>
        </div>
        <div className={styles.body}>
          {typeof children === 'function' ? children({ close: requestClose }) : children}
        </div>
      </div>
    </div>
  );
};

export default Popup;
