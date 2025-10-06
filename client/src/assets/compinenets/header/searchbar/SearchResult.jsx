import {useEffect, useRef, useState, useLayoutEffect} from 'react';
import { useGSAP } from "@gsap/react";
import  './SearchResult.css';


export function SearchResult(props) {
  console.log('title: ', props)
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
  <div className='whole__search'>
    <div className='img-container'>
      
    </div>
    <div className='info-and-img__container'>
      <img src={main_image_medium} className='img' alt={title}></img>
      <div className='info__container'>
          <div className='media-type-and-status__container'>
            <div className='media-type__dot d'></div>
            <h4 className={`media-type ${media_type}`}>{CapitalizedMediaType}</h4>
            <div className={`status__dot d ${statusClass}`}></div>
            <h4 className={`status ${statusClass}`}>{statusClass}</h4>
            {isTouchOrMobile && <button className='more-info__button'>I</button>}
          </div>
          <div className='title-and-date__container'>
            <div className='title__container'>
              <h3 className='title'>{title}</h3>
            </div>
            <h4 className='year'>(
            {(startYear || endYear) ?   
            <>
              <span className='start-year'>{startYear}</span>
              <span className='end-year'>{endYear}</span> 
            </>             
            : <span>Date:N/A</span>
            }
            )</h4>
        </div>
        <div className='mean__container'>
          <div className='mean__dot d'></div>
          <h4 className='mean__label'>Score: <span className='mean'>{mean}</span></h4>
        </div>
      </div>
    </div>
    <div className='synopsis__container'>
      <div className='synopsis__dot d'></div>
      <p className='sypnosis'>{synopsis.slice(0, 500)}</p>
    </div>
  </div>)
}

