import { useEffect, useState } from 'react';
import { useGSAP } from "@gsap/react"
import styles from './SearchResult.module.css';
import "../../../SmallComponents/MangaStatus.css"
import { useRef } from 'react';
import { gsap } from 'gsap';
import { Heart } from '../../../SmallComponents/Button/Heart.jsx';

export function SearchResult(props) {
  const { id, title, main_image_medium, status, start_date = '', media_type, favorites = false,
    setCurrentId, setIsCurrentIdFromCard, setItemLoaded
  } = props;

  const bgRef = useRef(null)
  const imgRef = useRef(null)

  const [imgLoading, setImgLoading] = useState(true)

  const sYearObj = new Date(start_date).getFullYear();
  const startYear = isNaN(sYearObj) ? null : sYearObj;

  const statusMap = {
    finished: 'Completed',
    currently_publishing: 'Publishing',
    on_hiatus: 'On_hiatus',
    discontinued: 'Canceled'
  };

  useEffect(() => {
    const img = imgRef.current
    if (!img) return;
    if (!imgLoading) return;
    function handleImgLoad() { setImgLoading(false) }
    if (img.complete) { handleImgLoad() }
    else {
      img.addEventListener('load', handleImgLoad)
      return () => img.removeEventListener('load', handleImgLoad)
    }
  }, [imgLoading, main_image_medium])

  useGSAP(() => {
    const bgEl = bgRef.current
    const imgEl = imgRef.current
    if (!bgEl || !imgEl) return
    gsap.set(imgEl, { opacity: 0 })

    const loaderTl = gsap.timeline({ paused: true });
    if (imgLoading) {
      loaderTl.to(bgEl, {
        backgroundPositionX: '0%',
        duration: 1.5,
        ease: 'none',
        repeat: -1,
      })
      loaderTl.play();
    }

    if (!imgLoading) {
      gsap.to(imgEl, {
        opacity: 1,
        duration: 0.3,
        ease: 'power1.out',
        onComplete: () => {
          loaderTl.revert();
        }
      })
    }

  }, { scope: imgRef, dependencies: [imgLoading] })
  const statusClass = statusMap[status] || 'NA';
  const CapitalizedMediaType = media_type ? media_type.charAt(0).toUpperCase() + media_type.slice(1) : '';

  const onClick = () => {
    setCurrentId?.(id)
    setIsCurrentIdFromCard?.(true)
    setItemLoaded?.(false)
  };


  return (
    <div className={styles.whole} onClick={onClick}>

      <div className={styles.img__wrapper} ref={bgRef}>
        <img className={styles.img} src={main_image_medium} ref={imgRef} alt={title} />
      </div>

      <div className={styles.details__container}>
        <div className={styles.title__container}>
          <h1 className={styles.title}>{title}</h1>
          <h3 className={styles.year}>({startYear})</h3>
          <div className={styles.titleMask__wrapper}>
            <h1 className={`${styles.title} ${styles.mask}`}>{title}</h1>
            <h3 className={`${styles.year} ${styles.mask}`}>{startYear}</h3>
          </div>
        </div>
        <div className={styles.mediaContainer}>
          <h4 className={`${styles.mediaType} ${media_type}`}>{(CapitalizedMediaType === 'one_shot') ? CapitalizedMediaType.replace('_', '-') : CapitalizedMediaType.replace('_', ' ')}</h4>
          <h4 className={`${styles.status} ${statusClass}`}>{statusClass}</h4>
        </div>
        <div className={styles.heart__container} onClick={(e) => e.stopPropagation()}>
          <Heart
            mangaId={id}
            initialActive={favorites}
            width={24}
          />
        </div>
      </div>

    </div>
  )
}

