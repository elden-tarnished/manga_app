import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ItemImage from './ItemImage';
import styles from './ImageSlideShow.module.css';

export default function ImageSlideShow({ images, onItemClick, isCover = false }) {
  const [currentTranslateX, setCurrentTranslateX] = useState(0);
  const wrapperRef = useRef(null);
  const trackRef = useRef(null);
  const [layout, setLayout] = useState({
    step: 0,
    maxOffset: 0,
    wrapperWidth: 0,
    totalWidth: 0,
  });

  // Normalize images prop to array of objects { url, data }
  const imageList = useMemo(() => {
    if (!images) return [];

    let rawList = [];
    if (typeof images === 'string') {
      rawList = images.split(',');
    } else if (Array.isArray(images)) {
      rawList = images;
    }

    return rawList.map(item => {
      if (typeof item === 'string') {
        return { url: item, data: null };
      }
      // Assume it's a manga object
      return { url: item.mainPictureLarge, data: item };
    });
  }, [images]);

  const recomputeLayout = useCallback(() => {
    if (!wrapperRef.current || !trackRef.current) return;

    const wrapperWidth = wrapperRef.current.clientWidth;
    const totalWidth = trackRef.current.scrollWidth;

    const firstItem = trackRef.current.firstElementChild;
    const itemWidth = firstItem ? firstItem.getBoundingClientRect().width : 0;
    const gap = firstItem
      ? parseFloat(getComputedStyle(trackRef.current).columnGap || '0')
      : 0;

    const step = itemWidth + gap;
    const maxOffset = Math.max(0, totalWidth - wrapperWidth);

    setLayout({ step, maxOffset, wrapperWidth, totalWidth });
    setCurrentTranslateX(prev => Math.max(-maxOffset, Math.min(0, prev)));
  }, []);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      recomputeLayout();
    });

    resizeObserver.observe(wrapperRef.current);
    resizeObserver.observe(trackRef.current);

    recomputeLayout();

    return () => resizeObserver.disconnect();
  }, [recomputeLayout, imageList.length]);

  const handlePrev = () => {
    if (!layout.step) return;
    setCurrentTranslateX(prev => Math.min(0, prev + layout.step));
  };

  const handleNext = () => {
    if (!layout.step) return;
    setCurrentTranslateX(prev => Math.max(-layout.maxOffset, prev - layout.step));
  };

  if (!imageList.length) return null;

  return (
    <div className={styles.carouselContainer}>
      {currentTranslateX < 0 && (
        <button
          className={`${styles.navBtn} ${styles.prevBtn}`}
          onClick={handlePrev}
          aria-label="Previous image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="m14.207 5 1.414 1.414-5.793 5.793L15.621 18l-1.414 1.414L7 12.207 14.207 5Z"></path></svg>
        </button>
      )}

      <div className={styles.wrapper} ref={wrapperRef}>
        <div
          className={styles.img__container}
          ref={trackRef}
          style={{ transform: `translateX(${currentTranslateX}px)` }}
        >
          {imageList.map((item, i) => (
            <div key={i} className={styles.imgDiv}>
              <ItemImage imgUrl={item.url} data={item.data} onClick={onItemClick} isCover={isCover} />
            </div>
          ))}
        </div>
      </div>

      {-currentTranslateX < layout.maxOffset && (
        <button
          className={`${styles.navBtn} ${styles.nextBtn}`}
          onClick={handleNext}
          aria-label="Next image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M13.793 12.207 8 6.414 9.414 5l7.207 7.207-7.207 7.207L8 18l5.793-5.793Z"></path></svg>
        </button>
      )}
    </div>
  );
}
