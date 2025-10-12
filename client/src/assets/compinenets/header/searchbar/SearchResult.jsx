import {useEffect, useState} from 'react';
import { useGSAP } from "@gsap/react";
import styles from './SearchResult.module.css';
import "../../smallComponents/mangaStatus.css"


export function SearchResult(props) {
  const {title, main_image_medium, status, mean, synopsis, start_date='', end_date='', media_type} = props;

  const [isTouchOrMobile, setIsTouchOrMobile] = useState(false)

  const sYearObj = new Date(start_date).getFullYear();
  const eYearObj = new Date(end_date).getFullYear();
  const startYear = isNaN(sYearObj) ? null : sYearObj;
  const endYear = isNaN(eYearObj) ? null :- + eYearObj;

  const statusMap = {
    finished: 'Completed',
    currently_publishing: 'Publishing',
    on_hiatus: 'On_hiatus',
    discontinued: 'Canceled'
  };

  const statusClass = statusMap[status] || 'NA';
  const CapitalizedMediaType = media_type ? media_type.charAt(0).toUpperCase() + media_type.slice(1) : '';

  useEffect(() => {
    const checkDeviceTouch = () => {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ;
      const screenWidth = window.innerWidth ;
      setIsTouchOrMobile(isTouch || screenWidth < 833);
    }
    checkDeviceTouch();
    window.addEventListener('resize', checkDeviceTouch);

    return() => window.removeEventListener('resize', checkDeviceTouch);
  }, []);


  return (
  <div className={styles.whole__search}>
    <div className={styles.infoAndImg__container}>
      <img src={main_image_medium} className={styles.img} alt={title}></img>
      <div className={styles.info__container}>
          <div className={styles.mediaTypeAndStatus__container}>
            <div className={styles.d}></div>
            <h4 className={`${styles.mediaType} ${media_type}`}>{CapitalizedMediaType}</h4>
            <div className={`${styles.d} ${statusClass}`}></div>
            <h4 className={`${styles.status} ${statusClass}`}>{statusClass}</h4>
            {isTouchOrMobile && <button >I</button>}
          </div>
          <div className={styles.titleAndDate__container}>
            <div className={styles.title__container}>
              <h3 className={styles.title}>{title}</h3>
            </div>
            <h4 className={styles.year}>(
            {(startYear || endYear) ?   
            <>
              <span >{startYear}</span>
              <span >{endYear}</span>
            </>             
            : <span>Date:N/A</span>
            }
            )</h4>
        </div>
        <div className={styles.mean__container}>
          <div className={styles.d}></div>
          <h4 >Score: <span className='mean'>{mean}</span></h4>
        </div>
      </div>
    </div>
    <div className={styles.synopsis__container}>
      <div className={styles.d}></div>
      <p >{synopsis.slice(0, 500)}</p>
    </div>
  </div>)
}

