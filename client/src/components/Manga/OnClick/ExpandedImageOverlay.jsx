import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import styles from './ExpandedImageOverlay.module.css';

const MAX_VIEWPORT_RATIO = 0.9;
const OVERLAY_BG = 'rgba(0,0,0,0.82)';

function getSafeAspectRatio(startRect, naturalAspectRatio) {
  if (naturalAspectRatio && Number.isFinite(naturalAspectRatio) && naturalAspectRatio > 0) {
    return naturalAspectRatio;
  }
  const fallback = startRect?.width && startRect?.height ? (startRect.width / startRect.height) : 1;
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 1;
}

function getTargetRect(startRect, aspect) {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  let width = viewportW * MAX_VIEWPORT_RATIO;
  let height = width / aspect;

  if (height > viewportH * MAX_VIEWPORT_RATIO) {
    height = viewportH * MAX_VIEWPORT_RATIO;
    width = height * aspect;
  }

  return {
    width,
    height,
    top: (viewportH - height) / 2,
    left: (viewportW - width) / 2,
    startCenterX: startRect.left + (startRect.width / 2),
    startCenterY: startRect.top + (startRect.height / 2),
  };
}

export default function ExpandedImageOverlay({ isOpen, startRect, imgUrl, onClose, naturalAspectRatio }) {
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const timelineRef = useRef(null);
  const isClosingRef = useRef(false);
  const portalRootRef = useRef(null);

  if (!portalRootRef.current) {
    portalRootRef.current = document.createElement('div');
    portalRootRef.current.className = styles.portalRoot;
  }

  useEffect(() => {
    const portalNode = portalRootRef.current;
    document.body.appendChild(portalNode);
    return () => {
      timelineRef.current?.kill();
      if (portalNode.parentNode) portalNode.parentNode.removeChild(portalNode);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    const tl = timelineRef.current;
    if (!tl) {
      onClose?.();
      return;
    }
    isClosingRef.current = true;
    tl.reverse();
  }, [onClose]);

  useLayoutEffect(() => {
    if (!isOpen || !startRect || !overlayRef.current || !imgRef.current) return;

    const overlayEl = overlayRef.current;
    const imgEl = imgRef.current;
    const aspect = getSafeAspectRatio(startRect, naturalAspectRatio);

    const applyTargetRect = () => {
      const target = getTargetRect(startRect, aspect);
      gsap.set(imgEl, {
        top: target.top,
        left: target.left,
        width: target.width,
        height: target.height,
      });
      return target;
    };

    const target = applyTargetRect();
    const targetCenterX = target.left + (target.width / 2);
    const targetCenterY = target.top + (target.height / 2);

    const scaleX = startRect.width / target.width;
    const scaleY = startRect.height / target.height;
    const fromX = target.startCenterX - targetCenterX;
    const fromY = target.startCenterY - targetCenterY;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set(overlayEl, { backgroundColor: 'rgba(0,0,0,0)', autoAlpha: 1 });
    gsap.set(imgEl, {
      x: fromX,
      y: fromY,
      scaleX,
      scaleY,
      borderRadius: 6,
      transformOrigin: 'center center',
    });

    timelineRef.current?.kill();
    isClosingRef.current = false;

    if (prefersReducedMotion) {
      gsap.set(overlayEl, { backgroundColor: OVERLAY_BG });
      gsap.set(imgEl, { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0 });
    } else {
      timelineRef.current = gsap.timeline({
        paused: true,
        defaults: { overwrite: 'auto' },
        onReverseComplete: () => {
          isClosingRef.current = false;
          onClose?.();
        },
      });

      timelineRef.current
        .to(overlayEl, {
          backgroundColor: OVERLAY_BG,
          duration: 0.28,
          ease: 'power2.out',
        }, 0)
        .to(imgEl, {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          borderRadius: 0,
          duration: 0.44,
          ease: 'power3.out',
        }, 0);

      timelineRef.current.play();
    }

    const onResize = () => {
      if (!isClosingRef.current) applyTargetRect();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      timelineRef.current?.kill();
      timelineRef.current = null;
      isClosingRef.current = false;
    };
  }, [isOpen, startRect, naturalAspectRatio, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const onOverlayPointerDown = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      onPointerDown={onOverlayPointerDown}
    >
      <img
        ref={imgRef}
        src={imgUrl}
        alt="Expanded manga cover"
        className={styles.expandedImg}
        decoding="async"
        draggable={false}
      />
    </div>,
    portalRootRef.current
  );
}
