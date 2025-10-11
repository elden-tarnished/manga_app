import {useContext, useMemo, useRef, useEffect, useState} from "react";
import {FilterContext} from "./context.js";
import {FilterButton} from "./button";
import './css/filter.css';
import {useGSAP} from "@gsap/react";
import gsap from "gsap";
import {useWindowSize} from "../../smallComponents/useWindowSize.jsx";

export function Filter({FilterOptions}) {

  gsap.registerPlugin(useGSAP)

  const {
    genre,
    theme,
    explicitGenre,
    demographic,
    type,

    order,
    limit,
    direction,

    //setters:

    setGenre,
    setTheme,
    setExplicitGenre,
    setDemographic,
    setType,

    setOrder,
    setLimit,
    setDirection
  } = useContext(FilterContext);

  const setter = {
    genre: setGenre,
    theme: setTheme,
    demographic: setDemographic,
    type: setType,
    explicitGenre: setExplicitGenre
  }
  const limits = ['25', '50', '60', '100', '200']
  const directionValues = ['ASC', 'DESC'];
  const filtersKeys = Object.keys(FilterOptions).filter(e => e !== 'validOrder');

  const windowSize = useWindowSize();
  const [isMobile, setIsMobile] = useState(false);

  const filterRef = useRef(null);
  const filterExpandRef = useRef(null);
  const filterHorizontalContainerRef = useRef(null);

  const tlRef = useRef(null);
  const innterTlRef = useRef(null);

  // const limitOrderDirectionCurrents = useMemo(() => {
  //   return (new Set([...genre, ...theme, ...explicitGenre, ...demographic, ...type]));
  // }, [genre, theme, explicitGenre, demographic, type]);

  useEffect(() => {
    const handleIsMobile = () => {
      setIsMobile(windowSize.width > 768)
    };
    handleIsMobile();

  }, [windowSize])

  const {contextSafe} = useGSAP(() => {
    let mm = gsap.matchMedia()
    const tags = ['demographic', 'type', 'explicitGenre', 'genre', 'theme'];

    const breakPoint = 768;
    innterTlRef.current = gsap.timeline({paused: true});
    tlRef.current = gsap.timeline({paused: true,
      defaults: {
        duration: 0.4
      }})

    mm.add({
      isMobile: `(max-width: ${breakPoint - 1}px)`,
      isDesktop: `(min-width: ${breakPoint}px)`
    }, (context) => {

      let {isMobile} = context.conditions;

        tlRef.current.to('.filter__container', {
          height: filterRef.current.scrollHeight + 'px',
          padding: isMobile ? '10px' : '20px',
          duration: 1,
          ease: 'power3.inOut',
        }, 0)
        .to('.filter__expand', {
          flexGrow: 0,
          ease: 'power3.inOut',
          padding: !isMobile ? '10px 20px' : '',
        }, 0);
      tags.forEach(tag => {
        const string = tag.toString();
        const container = `.${string}__container`
        const name = `.filter__title.${string}`;
        const tags = `.btn.${string}`;
        const tagsArray = gsap.utils.toArray(tags);
        console.log(tagsArray)
        const tweenContainer = gsap.from(container, {
          x: isMobile ? 0 : -100,
          y: isMobile ? -100 : 0,
          scale: 0.8,
          opacity: 0,
          duration: 0.6,
          ease: 'back',
        })
        const tweenName = gsap.from(name, {
          opacity: 0,
          x: -20,
          ease: 'power3.out'
        })
        const tweenTags = gsap.from(tags, {
          opacity: 0,
          x: isMobile ? 0 : -50,
          y: isMobile ? -20 : 0,
          rotate: -5,
          scale: 0.8,
          stagger: {
            amount: isMobile ? 0.5 : 0.7,
            from: 'start',
            grid: 'auto',
            axis: isMobile ? 'y' : ''
          },
          ease: 'back',
        })
        innterTlRef.current.add(tweenContainer, isMobile ? '<0.2' : '<0.1')
        innterTlRef.current.add(tweenName, '<')
        innterTlRef.current.add(tweenTags, '<')
      })
    })

    tlRef.current
      .to('.limit__container, .order__container, .direction__container', {
        flexGrow: 1,
        ease: 'power3.inOut',
      }, 0)


  }, {scope: filterRef.current});


  const onClick = contextSafe(() => {
    if (tlRef.current.progress() > 0) {
      tlRef.current.reverse()
      return;
    }
    tlRef.current.play();
    innterTlRef.current.play(0);
    console.log(filterRef.current.scrollHeight)
  })
  const tagCurrents = useMemo(() => [genre,theme,demographic,type,explicitGenre],
  [genre,theme,demographic,type,explicitGenre]);

  const selectedValuesSetter = useMemo(() => {
    return {
    genre: tagCurrents[0],
    theme: tagCurrents[1],
    demographic: tagCurrents[2],
    type: tagCurrents[3],
    explicitGenre: tagCurrents[4],}
  }, [tagCurrents])

  const orderButtons = useMemo(() => {
    return FilterOptions.validOrder.map(item =>
       <FilterButton key={item} value={item} selectedValues={order} setter={setOrder} filterType={'order'}></FilterButton>
    )
  }, [order]);
  const limitButtons = useMemo(() => {
    return limits.map(item => 
      <FilterButton key={item} value={item} selectedValues={limit} setter={setLimit} filterType={'limit'}></FilterButton>
    )
  }, [limit]);
  const directionButtons = useMemo(() => {
    return directionValues.map(item => 
      <FilterButton key={item} value={item} selectedValues={direction} setter={setDirection} filterType={'direction'}></FilterButton>
    )
  }, [direction])


  //keys: demographic, type, explicitGenre, genre, theme
  const tagButtons = useMemo(() => {
    return (filtersKeys.map((key) => 
    (<div key={key} className={`${key}__container`}>
      <h1 className={`filter__title ${key}`}>{key}</h1>
      <div className={`${key}-btn__container tags__btn`}>
      {FilterOptions[key].map( item => 
      (<FilterButton 
        key={`${key}-${item}`} 
        value={item}
        selectedValues={selectedValuesSetter[key]}
        setter={setter[key]}
        filterType={key}
        >
      </FilterButton>))}
      </div>
    </div>)))
  }, [tagCurrents])

  return (
    <div className="filter__container"
         ref={filterRef}>

      <div className={'filter--horizontal__container'} ref={filterHorizontalContainerRef}>
        <button className={"filter__expand"} ref={filterExpandRef} onClick={onClick}>exp</button>
        <div className="order__container">
          <div className="order-btn__container">{orderButtons}</div>
        </div>

        <div className="limit__container">
          <h1 className={'filter__title'}>Limit</h1>
          <div className="limit-btn__container">{limitButtons}</div>
        </div>

        <div className="direction__container">
          <h1 className={'filter__title'}>direction</h1>
          <div className="direction-btn__container">{directionButtons}</div>
        </div>

      </div>

      <div className="tags__container">{tagButtons}</div>
      <button className={"btn done"} onClick={onClick}>Done</button>
    </div>
  );
}