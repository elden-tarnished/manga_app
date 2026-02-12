import { useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './ExpandedImageOverlay.module.css';

export default function ExpandedImageOverlay({ isOpen, startRect, imgUrl, onClose, naturalAspectRatio }) {
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const containerRef = useRef(document.createElement('div'));

  // Ensure we append to body
  useEffect(() => {
    document.body.appendChild(containerRef.current);
    return () => {
      document.body.removeChild(containerRef.current);
    };
  }, []);

  const { contextSafe } = useGSAP({ scope: containerRef });

  useLayoutEffect(() => {
    if (!isOpen || !startRect || !imgRef.current) return;

    const img = imgRef.current;

    // Initial State: Match the thumbnail exactly
    gsap.set(overlayRef.current, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0)',
      zIndex: 9999,
      pointerEvents: 'auto'
    });

    gsap.set(img, {
      position: 'absolute',
      top: startRect.top,
      left: startRect.left,
      width: startRect.width,
      height: startRect.height,
      objectFit: 'cover',
      borderRadius: '5px' // Match your card radius
    });

    // Calculate Target Dimensions (90vw or 90vh constraint)
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    // Default to a sane aspect ratio if missing
    const aspect = naturalAspectRatio || (startRect.width / startRect.height);

    // Try fitting by width first (90vw)
    let targetW = viewportW * 0.9;
    let targetH = targetW / aspect;

    // If height is too big, fit by height instead (90vh)
    if (targetH > viewportH * 0.9) {
      targetH = viewportH * 0.9;
      targetW = targetH * aspect;
    }

    const targetTop = (viewportH - targetH) / 2;
    const targetLeft = (viewportW - targetW) / 2;

    // Animate In
    const tl = gsap.timeline({
      onReverseComplete: () => {
        onClose(); // Tell parent we are done closing
      }
    });

    tl.to(overlayRef.current, {
      backgroundColor: 'rgba(0,0,0,0.8)',
      duration: 0.4,
      ease: 'power2.out'
    }, 0)
      .to(img, {
        top: targetTop,
        left: targetLeft,
        width: targetW,
        height: targetH,
        borderRadius: 0, // Optional: animate to sharp corners
        duration: 0.5,
        ease: 'power3.inOut' // Classic nice expand ease
      }, 0);

    // Attach reverse function to the element so we can call it from onClick
    overlayRef.current.reverseAnimation = () => tl.reverse();

  }, [isOpen, startRect]);

  const handleClose = contextSafe(() => {
    if (overlayRef.current && overlayRef.current.reverseAnimation) {
      overlayRef.current.reverseAnimation();
    } else {
      onClose();
    }
  });

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleClose}
    >
      <img
        ref={imgRef}
        src={imgUrl}
        alt="Expanded"
        className={styles.expandedImg}
      />
    </div>,
    containerRef.current
  );
}
