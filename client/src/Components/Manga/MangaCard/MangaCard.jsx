import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useIsMobile } from '../../SmallComponents/IsMobileProvider.jsx'
import './MangaCard.css'
import '../../SmallComponents/MangaStatus.css'
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin"
import { Observer } from "gsap/Observer";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrambleTextPlugin, Observer, SplitText)
export function MangaCard(props) {
  const {
    main_picture_large, title,
    start_date = '', synopsis, mean,
    status, media_type, num_volumes,
    color,
  } = props;
  const { setImgLoaded } = props

  const isMobile = useIsMobile()

  const sYearObj = new Date(start_date).getFullYear();
  const startYear = isNaN(sYearObj) ? null : sYearObj.toString();

  const [isRight, setIsRight] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);

  const bgRef = useRef(null);
  const cardRef = useRef(null);
  const imgRef = useRef(null);
  const titleRef = useRef(null)
  const overlay = useRef(null);


  const detailAndSynopsisRef = useRef(null);
  const detailRef = useRef(null);
  const synopsisTextRef = useRef(null);
  const synopsisRef = useRef(null);

  const meanRef = useRef(null);
  const statusRef = useRef(null);
  const mediaTypeRef = useRef(null);
  const numVolumesRef = useRef(null);
  const titleDateContainerRef = useRef(null);
  const dRef = useRef(null)

  const dateRef = useRef(null);
  const dateStartRef = useRef(null);

  const tlDetailPauseThreshold = useRef(null);

  const tlRevert = useRef(() => { });
  const tlFirstPlay = useRef(() => { });
  const tlSynopsisReverse = useRef(() => { });


  const STATUS_MAP = {
    finished: 'Completed',
    currently_publishing: 'Publishing',
    on_hiatus: 'On_hiatus',
    discontinued: 'Canceled'
  };

  useEffect(() => {

    const img = imgRef.current;
    const handleImgLoad = () => setImgLoading(false)
    if (!img) return;
    if (!imgLoading) return;
    if (img.complete) {
      handleImgLoad();
    } else {
      img.addEventListener('load', handleImgLoad);
      return () => img.removeEventListener('load', handleImgLoad);
    }
  }, [isMobile])

  useLayoutEffect(() => {
    const rect = cardRef.current.getBoundingClientRect()
    const viewportWidth = window.offsetWidth || document.documentElement.clientWidth;
    const newIsRight = (rect.right > viewportWidth * 0.80)
    setIsRight(newIsRight);
  }, [isMobile]);

  useGSAP(() => {
    const tl = gsap.timeline({ paused: true })
    if (bgRef.current === null) return;
    if (!imgLoading) {
      tl.to(bgRef.current, {
        backgroundPositionX: '0%',
        duration: 1.5,
        ease: 'none',
        repeat: -1,
      })
    }

    if (imgLoading) {
      tl.play()
    } else {
      gsap.to(imgRef.current, {
        opacity: 1,
        stagger: 0.04,
        duration: 0.5,
        ease: 'none',
        oncomplete: () => {
          console.log('image animation complete')
        }
      })
    }
  }, { dependencies: [imgLoading], scope: cardRef });


  useGSAP(() => {
    if (imgLoading) return;

    const tlCard = gsap.timeline({ paused: true });
    const tlDetail = gsap.timeline({ paused: true });
    const tlSynopsis = gsap.timeline({ paused: true });

    const synopsisStyle = window.getComputedStyle(synopsisRef.current);
    const synopsisWidth = parseFloat(synopsisStyle.getPropertyValue('width'));
    const synopsisPadding = parseFloat(synopsisStyle.getPropertyValue('padding'));
    const synopsisWidthAA = synopsisWidth + (2 * synopsisPadding);

    const chars = SplitText.create(titleRef.current, { type: "chars" }).chars
    tlCard
      .to(detailAndSynopsisRef.current,
        {
          pointerEvents: 'all',
          duration: 0.1
        })
      .to(detailRef.current,
        {
          opacity: 1,
          width: synopsisWidthAA,//match media
          x: 0,
          color: 'rgba(236, 244, 250, 1)',
          '--blur': '9px',
          ease: 'power3',
          duration: 0.5
        }, 0)
      .to(titleRef.current, {
        backgroundColor: 'transparent',
        pointerEvents: 'none',
        duration: 0.5,
        scale: 0.7,
      }, 0)
      .to(chars, {
        scale: 0.4,
        opacity: 0,
        color: 'black',
        rotateX: 90,
        stagger: 0.05,
        duration: 0.4
      }, 0)

    const tlYoyo = gsap.timeline({ paused: true }).fromTo('.svg', {
      y: 0
    }, {
      y: 4,
      repeat: -1,
      yoyo: true,
      duration: 0.4,
      ease: 'power3.inOut',
    })



    const tlCartDuration = tlCard.duration() * 0.4;

    tlDetail
      .fromTo([mediaTypeRef.current, statusRef.current, meanRef.current, numVolumesRef?.current], {
        opacity: 0,
        x: -20,
      }, {
        stagger: {
          each: 0.09,
        },
        ease: "back.out",
        opacity: 1,
        x: 0,
      }, '+=0.2').addLabel('tlInner')
      .to(dateStartRef.current, {
        duration: 0.8,
        scrambleText: {
          text: startYear,
          chars: "01",
          speed: 1,
          ease: 'power1.out'
        },
      }, `tlInner+=-${tlCartDuration}`)
      .addPause('pause')
    tlDetailPauseThreshold.current = tlDetail.duration()

    tlDetail.to(detailAndSynopsisRef.current,
      {
        height: 2.15 * 119,//match media
        duration: 0.1
      })
      .fromTo([mediaTypeRef.current, statusRef.current, titleDateContainerRef.current, meanRef.current, dRef.current, numVolumesRef?.current, '.synopsis-svg__container'], {
        pointerEvents: 'all',
        y: 0
      }, {
        stagger: {
        },
        y: 10,
        opacity: 0,
        pointerEvents: 'none',
        ease: 'power2.inOut',
        duration: 0.2
      }, '<')
      .to(detailRef.current, {
        height: 2.15 * 119, //match media
        ease: 'power3.inOut',
        duration: 0.4,
      }, '<')

    tlSynopsis
      .to(synopsisRef.current,
        {
          y: 0,
          opacity: 1,
          pointerEvents: 'all',
          duration: 0.2
        })

    tlRevert.current = () => {
      const pauseTime = tlDetailPauseThreshold.current;
      if (tlDetail.time() > pauseTime) {
        tlCard.timeScale(2).reverse().eventCallback('onUpdate', () => {
          tlSynopsis.timeScale(2).reverse().eventCallback('onReverseComplete', () => {
            tlSynopsis.revert();
            tlDetail.revert();
            tlCard.revert();
            tlYoyo.revert();
          })
        })
      } else {
        tlCard.timeScale(2).reverse()
        tlYoyo.revert();
      }
    }

    tlFirstPlay.current = () => {
      tlCard.timeScale(1).play()
      tlDetail.timeScale(1).play(0);
      tlYoyo.play(0)
    }
    tlSynopsisReverse.current = () => {
      if (tlDetail.progress() === 1) {
        tlDetail.timeScale(1).reverse().eventCallback('onUpdate', () => {
          tlSynopsis.timeScale(1).reverse()
        })
      }
    }

    Observer.create({
      target: cardRef.current,
      type: 'pointer',

      onHover: (self) => {
        if (self.event.pointerType !== 'mouse') return;
        tlFirstPlay.current()
      },
      onHoverEnd: (self) => {
        if (self.event.pointerType !== 'mouse') return;
        tlRevert.current()
      }
    });

    Observer.create({
      target: [imgRef.current, detailRef.current],
      type: 'touch, pointer',
      tolerance: 20,
      onRight: () => {
        if (tlCard.progress() > 0) return;
        tlFirstPlay.current()
      },
      onLeft: () => {
        tlRevert.current()
      }
    })

    Observer.create({
      preventDefault: true,
      target: [detailRef.current],
      type: 'touch,pointer',
      onClick: () => {
        if (tlSynopsis.progress() === 1) {
          if (tlDetail.progress() === 1) {
            tlDetail.timeScale(2).reverse().eventCallback('onUpdate', () => {
              tlSynopsis.timeScale(2).reverse()
            })
          }
        }
        else {
          tlDetail.timeScale(1).play().eventCallback('onComplete', () => {
            if (tlCard.progress() > 0.5) tlSynopsis.timeScale(1).play()
          })
        }
      },
      onDown: () => {
        tlDetail.timeScale(1).play().eventCallback('onComplete', () => {
          if (tlCard.progress() > 0.5) tlSynopsis.timeScale(1).play()
        })
      },
    })

    Observer.create({
      target: [synopsisRef.current],
      preventDefault: true,
      type: 'touch,pointer',
      onUp: () => {
        tlSynopsisReverse.current()
      },
      onClick: () => {
        tlSynopsisReverse.current()
      },
    })

  }, { dependencies: [imgLoading, isMobile] });

  const statusClass = STATUS_MAP[status] || 'NA';
  const CapitalizedMediaType = media_type ? media_type.charAt(0).toUpperCase() + media_type.slice(1) : '';
  return (
    <>
      <div className={`whole ${isRight ? "right" : "left"}`}
        ref={cardRef}
      >
        <div ref={overlay} className="overlay"></div>
        <div
          className="card"
          draggable='false'
          style={{
            background: `linear-gradient(135deg, ${color[0]} 30%, ${color[1]} 50%, ${color[0]} 70%) 100% 0`,
            backgroundPosition: '100% 0',
            backgroundSize: '600% 100%'
          }}
          ref={bgRef}>
          <img ref={imgRef} className="img" src={main_picture_large} alt={title} draggable='false' />
          <h4 className="title center-text" ref={titleRef}>{title}</h4>
        </div>
        <div className={`detail-and-synopsis__container ${isRight ? "rightC" : "leftC"}`} ref={detailAndSynopsisRef}>
          <div className={`detail__container ${isRight && "detail__container--right"}`} ref={detailRef}>
            <div className='media-type-and-status__container'>
              <h5 className={`media-type ${media_type}`} ref={mediaTypeRef}>{(CapitalizedMediaType === 'one_shot') ? CapitalizedMediaType.replace('_', '-') : CapitalizedMediaType.replace('_', ' ')}</h5>
              <h5 className={`status ${statusClass}`} ref={statusRef}>{statusClass}</h5>
            </div>
            <div className="title-date__container" ref={titleDateContainerRef}>
              <h1 className='title'>{title}</h1>
              <h4 className='date' ref={dateRef}>(
                {(startYear) ?
                  <span className='start-date' ref={dateStartRef}>0000</span>
                  : <span>Date: N/A</span>
                }
                )</h4>
            </div>
            <div className="mean__container">
              {mean ? <h4 className="score" ref={meanRef}>Score: {mean}</h4> : ''}
              {(!isMobile && num_volumes > 0) ? <div className="d" ref={dRef}></div> : ""}
              {(!isMobile && num_volumes > 0) ? <h4 className="vols" ref={numVolumesRef}>Volumes: {num_volumes}</h4> : ""}
            </div>
            {synopsis &&
              <div className="synopsis-svg__container">
                <svg
                  className="svg"
                  height="16"
                  width="16"
                  viewBox="0 0 512 512"
                  fill="#000000"
                  stroke="#000000"
                  strokeWidth="0.00512"
                >
                  <g strokeWidth="0"></g>
                  <g strokeLinecap="round" strokeLinejoin="round" stroke="#CCCCCC" strokeWidth="1.024"></g>
                  <g>
                    <path
                      fill="#cfcfff"
                      d="M505.183,123.179c-9.087-9.087-23.824-9.089-32.912,0.002l-216.266,216.27L39.729,123.179
                    c-9.087-9.087-23.824-9.089-32.912,0.002c-9.089,9.089-9.089,23.824,0,32.912L239.55,388.82c4.364,4.364,10.283,6.816,
                    16.455,6.816c6.172,0,12.092-2.453,16.455-6.817l232.721-232.727C514.272,147.004,514.272,132.268,505.183,123.179z"
                    />
                  </g>
                </svg>
                <h5 className={`synopsis__text ${isRight ? "right" : "left"}`} ref={synopsisTextRef} >SYNOPSIS</h5>
              </div>
            }
          </div>
          {synopsis ? <div className='synopsis__container'>
          </div> : ''}
          <p className='synopsis' ref={synopsisRef}>{synopsis.slice(1, 290)}...</p>
        </div>
      </div>
    </>
  )
}
