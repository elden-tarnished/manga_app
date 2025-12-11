import { useEffect, useState } from 'react';
import { useGSAP } from "@gsap/react"
import styles from './SearchResult.module.css';
import "../../smallComponents/mangaStatus.css"
import { useRef } from 'react';
import { gsap } from 'gsap';

export function SearchResult(props) {
  const { title, main_image_medium, status, mean, start_date = '', end_date = '', media_type } = props;

  const bgRef = useRef(null)
  const imgRef = useRef(null)
  const loaderTlRef = useRef(null)

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
    setImgLoading(true)
  }, [main_image_medium])

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

    if (imgLoading) {
      loaderTlRef.current?.kill()
      loaderTlRef.current = gsap.timeline({ paused: true })
        .to(bgEl, {
          backgroundPositionX: '0%',
          duration: 1.5,
          ease: 'none',
          repeat: -1,
        })
      loaderTlRef.current.play()
      return () => {
        loaderTlRef.current?.kill()
        loaderTlRef.current = null
      }
    }

    loaderTlRef.current?.kill()
    loaderTlRef.current = null

    return gsap.from(imgEl, {
      opacity: 0,
      duration: 0.3,
      ease: 'power1.out',
    })

  }, [imgLoading, main_image_medium])
  const statusClass = statusMap[status] || 'NA';
  const CapitalizedMediaType = media_type ? media_type.charAt(0).toUpperCase() + media_type.slice(1) : '';


  return (
    <div className={styles.whole}>

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
      </div>

    </div>
  )
}

