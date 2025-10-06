import { useContext, useEffect, useMemo, useRef, useState } from "react";
import './css/MangaCard.css';
import '../../smallComponents/mangaStatus.css';
import { useGSAP} from "@gsap/react";
import { MangaCardSkel } from "./skeletons/mangaCardSkel";
// import { FilterContext } from "./MangaContainer";
gsap.registerPlugin(useGSAP, ScrambleTextPlugin, Observer)
export function MangaCard(props) {
  const {
    main_picture_large, title, 
    english_title, rank, popularity,
    start_date='', end_date='', synopsis, mean, 
    status, media_type, num_volumes,
    } = props;
  // const {loading} = useContext(FilterContext);
  const vibrantColors = [
"#FF6B6B",
"#4ECDC4",
"#45B7D1",
"#FED766",
"#8A2BE2",
"#FF8C00",
"#20B2AA",
"#9370DB",
"#F08080",
"#3CB371",
"#FFA07A",
"#BA55D3",
"#6A5ACD",
"#FFD700",
"#7B68EE",
"#00FA9A",
"#FF69B4",
"#1E90FF",
"#F7786B",
"#7FFFD4" 
  ];

  const sYearObj = new Date(start_date).getFullYear();
  const eYearObj = new Date(end_date).getFullYear();
  const startYear = isNaN(sYearObj) ? null : sYearObj.toString();
  const endYear = isNaN(eYearObj) ? null : eYearObj.toString(); 

  const [isRight, setIsRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  // const [imgWidth, setImgWidth] = useState(184);
  // const [windowWidth, setWindowWidth] = useState(null);
  
  const cardRef = useRef();
  const imgRef  = useRef();
  const titleRef = useRef()

  const detailAndsynopsisRef = useRef();
  const detailRef = useRef();
  const synopsisTextRef = useRef();
  const synopsisRef = useRef();

  const meanRef = useRef();
  const statusRef = useRef();
  const mediaTypeRef = useRef();
  const numVolumesRef = useRef();
  const titleDateContainerRef = useRef();
  const dRef = useRef()

  const dateRef = useRef();
  const dateStartRef = useRef();
  const dateEndRef = useRef();

  const tlDetailPauseThreshold = useRef();
  
  const statusMap = {
    finished: 'Completed',
    currently_publishing: 'Publishing',
    on_hiatus: 'On_hiatus',
    discontinued: 'Canceled'
  };
  const bgColor = useMemo(() => vibrantColors[Math.floor(Math.random() * vibrantColors.length)], []);
  
  useEffect(() => {

    //first method
    // if (loading) return;
    const rect = cardRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const newIsRight = (rect.right > viewportWidth * 0.8) 
    setIsRight(newIsRight);

    // const img = imgRef.current;
    // if (!img) return;
    // const handleImgDimensions = () => {
    //   setImgWidth(img.naturalWidth * 280 / img.naturalHeight );
    // }
    // if (img.complete) {
    //   handleImgDimensions();
    // } else {
    //   img.addEventListener('load', handleImgDimensions);
    //   return () => img.removeEventListener('load', handleImgDimensions);
    // }

    //second method
    // const handleResize = () => {
    //   const newWidth = window.innerWidth
    //   setWindowWidth(newWidth);
    //   setIsMobile(newWidth < 768);
    // }
    // window.addEventListener('resize', handleResize);

    // return () => window.removeEventListener('resize', handleResize);

    //third method

    const img = imgRef.current;
    const handleImgLoad = () => setImgLoading(false)
    if (!img) return;
    if (!imgLoading) return;
    if (img.complete){
      handleImgLoad();
    } else {
      img.addEventListener('load', handleImgLoad);
      return () => img.removeEventListener('load', handleImgLoad);
    }
    
  }, [])
  
  useGSAP(()=> {
    gsap.set(imgRef.current, {
      opacity:0,
    })
    if (imgLoading){
      
    } else{
      gsap.to(imgRef.current, {
        opacity: 1,
        duration:1
      })
    }
  }, {dependencies: [imgLoading], scope: imgRef})
  useGSAP(() => {
    // if (loading) return;

    const tlCard = gsap.timeline({paused: true});
    const tlDetail = gsap.timeline({paused: true});
    const tlSynopsis = gsap.timeline({paused: true});

    const synopsisStyle = window.getComputedStyle(synopsisRef.current);
    const synopsisWidth = parseFloat(synopsisStyle.getPropertyValue('width'));
    const synopsisPadding = parseFloat(synopsisStyle.getPropertyValue('padding'));
    const synopsisWidthAA = synopsisWidth + (2 * synopsisPadding);

    tlCard
    .to(detailAndsynopsisRef.current, 
      {
      pointerEvents: 'all',
      duration: 0.1
    })
    .to(detailRef.current,
    {
    opacity:1,
    borderRadius: 16, 
    width: synopsisWidthAA,//match media
    x:0,
    color: 'rgba(236, 244, 250, 1)',
    '--blur': '9px',
    ease: 'power3',
    duration: 0.5
    }, 0)
    .to(titleRef.current, {
      opacity: 0,
      x:10,
      pointerEvents: 'none',
      duration: 0.3
    }, 0)

    const tlyoyo = gsap.timeline({paused: true}).fromTo('.svg',{
      y: 0
    }, {
      y:4,
      repeat: -1,
      yoyo: true,
      duration: 0.4,
      ease: 'power3.inOut',
    })



    const tlCartDuration =  tlCard.duration() * 0.4;
    
    tlDetail
    .fromTo([mediaTypeRef.current, statusRef.current, meanRef.current, numVolumesRef?.current], {
      opacity:0,
      x:-10,
    }, {
      stagger: {
        each: 0.1,
      },
      ease: "power3.out",
      opacity:1,
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
    
    tlDetail.to(detailAndsynopsisRef.current, 
    {
      height: 2.15 * 119,//match media
      duration: 0.1
    })
    .fromTo([mediaTypeRef.current, statusRef.current, titleDateContainerRef.current, meanRef.current, dRef.current, numVolumesRef?.current, '.synopsis-svg__container'], {
      pointerEvents:'all',
      y: 0
    }, {
      stagger: {
      },
      y: 10,
      opacity: 0,
      pointerEvents: 'none',
      ease: 'power2.inOut',
      duration: 0.2
    }, '<' )
    .to(detailRef.current, {
      height: 2.15 * 119, //match media
      ease: 'power3.inOut',
      duration: 0.2,
    }, '<')
    
    tlSynopsis
    .to(synopsisRef.current, 
    {
      y: 0,
      opacity: 1,
      pointerEvents: 'all',
      duration: 0.2
    })

    tlCard;
    tlDetail;
    tlSynopsis;

    // Observer.create({
    //   target: window,
    //   type: 'scroll',
    //   tolerance: 50,

    //   onChangeY: (self) => {
    //     if (self.event.pointerType === 'mouse') return;
    //     const pauseTime = tlDetailPauseThreshold.current;
    //     if (tlDetail.time() > pauseTime) {
    //         tlCard.timeScale(2).reverse().eventCallback('onUpdate', () => {
    //           tlSynopsis.timeScale(2).reverse().eventCallback('onReverseComplete', () => {
    //             tlSynopsis.revert();
    //             tlDetail.revert();
    //             tlyoyo.revert();
    //           })
    //         })
    //     } else {
    //       tlCard.timeScale(2).reverse()
    //       tlyoyo.revert();
    //     }
    //   }
    // })
    Observer.create({
      target: cardRef.current,
      type: 'pointer', 

      onHover: (self) => {
        if (self.event.pointerType !== 'mouse') return;
        tlCard.timeScale(1).play()
        tlDetail.timeScale(1).play(0);
        tlyoyo.play(0)
      },
      onHoverEnd: (self) => {
        if (self.event.pointerType !== 'mouse') return;
        const pauseTime = tlDetailPauseThreshold.current;
        if (tlDetail.time() > pauseTime) {
            tlCard.timeScale(2).reverse().eventCallback('onUpdate', () => {
              tlSynopsis.timeScale(2).reverse().eventCallback('onReverseComplete', () => {
                tlSynopsis.revert();
                tlDetail.revert();
                tlCard.revert();
                tlyoyo.revert();
              })
            })
        } else {
          tlCard.timeScale(2).reverse()
        }
      }
    });
    Observer.create({
      target: detailRef.current,
      target: cardRef.current,
      type: 'touch',
      tolerance: 20,

      onRight: () => {
        console.log(tlCard.progress())  
        if (tlCard.progress() > 0) return;
        tlCard.timeScale(1).play()
        tlDetail.timeScale(1).play(0);
        tlyoyo.play(0)
      },
      onLeft: () => {
        const pauseTime = tlDetailPauseThreshold.current;
        if (tlDetail.time() > pauseTime) {
            tlCard.timeScale(2).reverse().eventCallback('onUpdate', () => {
              tlSynopsis.timeScale(2).reverse().eventCallback('onReverseComplete', () => {
                tlSynopsis.revert();
                tlDetail.revert();
                tlyoyo.revert();
              })
            })
        } else {
          tlCard.timeScale(2).reverse()
          tlyoyo.revert();
        }
      }
    })
    
    Observer.create({
      preventDefault: true,
      target: [detailRef.current],
      type: 'touch,pointer',

      onClick: () => {

        if (tlSynopsis.progress() ===1) {
          if (tlDetail.progress() === 1) {
            tlDetail.timeScale(2).reverse().eventCallback('onUpdate', () => {
              tlSynopsis.timeScale(2).reverse()
            })
          }
        } 
        else {
          tlDetail.timeScale(1).play().eventCallback('onComplete', () => {
            if(tlCard.progress() > 0.5) tlSynopsis.timeScale(1).play()
          })
        }
      },
      onDown: () => {
        tlDetail.timeScale(1).play().eventCallback('onComplete', () => {
          if(tlCard.progress() > 0.5) tlSynopsis.timeScale(1).play()
        })
      },
    })

    Observer.create({
      target: [synopsisRef.current],
      preventDefault: true,
      type: 'touch,pointer',
      onUp: () => {
        if (tlDetail.progress() === 1) {
          tlDetail.timeScale(1).reverse().eventCallback('onUpdate', () => {
            tlSynopsis.timeScale(1).reverse()
          })
        }
      },
      onClick: () => {
        if (tlDetail.progress() === 1) {
          tlDetail.timeScale(1).reverse().eventCallback('onUpdate', () => {
            tlSynopsis.timeScale(1).reverse()
          })
        }
      },
    })

  }, {dependencies: [isMobile, num_volumes], scope: cardRef.current});
  
  const statusClass = statusMap[status] || 'NA';
  const CapitalizedMediaType = media_type ? media_type.charAt(0).toUpperCase() + media_type.slice(1) : '';

    return (
    <>
    {/* {loading ? <MangaCardSkel /> :  */}
    <div className={`whole ${isRight ? "right" : "left"}`} 
    ref={cardRef}
    >
      <div className="card" draggable='false' style={{backgroundColor: bgColor}}>
          <img ref={imgRef} src={main_picture_large} alt={title} draggable='false'/>
          <h4 className="title center-text" ref={titleRef}>{title}</h4>
      </div>
      <div className={`detail-and-synopsis__container ${isRight ? "rightC" : "leftC"}`} ref={detailAndsynopsisRef}>
          <div className={`detail__container ${isRight && "detail__container--right"}`} ref={detailRef}>
              <div className='media-type-and-status__container'>
                <h5 className={`media-type ${media_type}`} ref={mediaTypeRef}>{(CapitalizedMediaType==='one_shot')? CapitalizedMediaType.replace('_', '-'): CapitalizedMediaType.replace('_', ' ')}</h5>
                <h5 className={`status ${statusClass}`} ref={statusRef}>{statusClass}</h5>
              </div>
              <div className="title-date__container" ref={titleDateContainerRef}>
                <h1 className='title'>{title}</h1>
                <h4 className='date' ref={dateRef}>(
                {(startYear || endYear) ?   
                <>
                  <span className='start-date' ref={dateStartRef}>0000</span>
                  {endYear && <span className='end-date' ref={dateEndRef}>-{endYear}</span>} 
                </>             
                : <span>Date: N/A</span>
                }
                )</h4>
              </div>
              <div className="mean__container">
                {mean ? <h4 className="score" ref={meanRef}>Score: {mean}</h4> : ''}
                {(isMobile && num_volumes>0) ? <div className="d" ref={dRef}></div> : ""}
                {(isMobile && num_volumes>0) ? <h4 className="vols" ref={numVolumesRef}>Volumes: {num_volumes}</h4> :""}
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
            <p className='synopsis' ref={synopsisRef}>{synopsis}</p>
      </div>
    </div>  
    {/* } */}
    </>
    )
}