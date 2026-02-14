import { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import styles from './ItemImage.module.css';
import ExpandedImageOverlay from './ExpandedImageOverlay';
import { useIsMobile } from '../../SmallComponents/IsMobileProvider';

export default function ItemImage({ imgUrl, data, onClick, isCover = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);
  const divRef = useRef(null);

  // Overlay State
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [startRect, setStartRect] = useState(null);
  const imgAspectRatio = useRef(null);

  useEffect(() => {
    setIsLoading(true);
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      if (img.naturalWidth > 0) {
        imgAspectRatio.current = img.naturalWidth / img.naturalHeight;
      }
      setIsLoading(false);
    } else {
      const handleImgLoad = () => {
        if (img.naturalWidth > 0) {
          imgAspectRatio.current = img.naturalWidth / img.naturalHeight;
        }
        setIsLoading(false);
      }
      img.addEventListener('load', handleImgLoad);
      return () => img.removeEventListener('load', handleImgLoad);
    }
  }, [imgUrl]);

  useGSAP(() => {
    const imgEl = imgRef.current;
    if (!imgEl) return;

    if (!isLoading) {
      gsap.to(imgEl, {
        opacity: 1,
        duration: 0.4,
        ease: 'power3.out',
      });
    } else {
      gsap.set(imgEl, { opacity: 0 });
    }

  }, { scope: imgRef, dependencies: [isLoading] });

  // Handle Cover Click
  const handleCoverClick = () => {
    if (!divRef.current || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    setStartRect(rect);
    setIsOverlayOpen(true);
  };

  // Use either provided title or fallbacks
  const title = data ? (data.englishTitle || data.title) : '';
  const score = data ? data.mean : null;

  return (
    <>
      <div
        className={`${styles.itemImageWrapper} ${isLoading ? styles.loadingShimmer : ''}`}
        onClick={(e) => {
          if (isCover) {
            handleCoverClick();
          } else {
            if (onClick && data) onClick(data, e);
          }
        }}
        ref={divRef}
      >
        <img
          ref={imgRef}
          src={imgUrl}
          alt={title || "Manga Cover"}
          className={styles.img}
        // opacity is handled by GSAP
        />

        {/* Overlay only appears if data is provided */}
        {data && (
          <div className={styles.infoOverlay}>
            <h4 className={styles.infoOverlayTitle}>{title}</h4>
            <div className={styles.infoOverlayStats}>
              {score && <span>★ {score}</span>}
              {data.mediaType && <span>{data.mediaType}</span>}
            </div>
          </div>
        )}
      </div>

      {isOverlayOpen && (
        <ExpandedImageOverlay
          isOpen={isOverlayOpen}
          startRect={startRect}
          imgUrl={imgUrl}
          naturalAspectRatio={imgAspectRatio.current}
          onClose={() => setIsOverlayOpen(false)}
        />
      )}
    </>
  );
}
