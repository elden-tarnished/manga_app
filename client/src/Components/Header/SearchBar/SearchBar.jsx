import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { SearchResult } from "./SearchResult/SearchResult.jsx";
import styles from "./SearchBar.module.css"
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { SplitText } from "gsap/SplitText";
import { useIsMobile } from '../../SmallComponents/IsMobileProvider.jsx'
import ItemLoading from "../../Manga/OnClick/ItemLoading.jsx";
import Item from "../../Manga/OnClick/Item.jsx";
import { useNavigate } from "react-router";

gsap.registerPlugin(SplitText, Observer)
const toFavoriteFlag = (value) => value === true || value === "t" || value === 1 || value === "1";

export function SearchBar() {
  const URL = 'http://localhost:3000/';
  const navigate = useNavigate();


  const isMobile = useIsMobile()

  const count = useRef(0)
  const isAnimating = useRef(false)

  const messageRef = useRef(null);
  const resultContainerRef = useRef(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const formRef = useRef(null);
  const inputRef = useRef(null);
  const cardsRef = useRef(null)


  const tlRef = useRef(null);

  const [visibleData, setVisibleData] = useState([])
  const [isOpen, setIsOpen] = useState(false);
  //const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [data, setData] = useState([]);
  const [message, setMessage] = useState(null)
  const [itemData, setItemData] = useState(null);
  const [itemLoaded, setItemLoaded] = useState(false);
  const [currentId, setCurrentId] = useState(-1);
  const [isCurrentIdFromCard, setIsCurrentIdFromCard] = useState(true);
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    async function fetchData() {
      if (!inputValue) {
        setMessage('Search for something :)')
        setError(null);
        setData([]);
        return;
      }
      try {
        const result = await axios.get(`${URL}search?q=${inputValue}`, {
          withCredentials: true,
        })
        if (result.data.length === 0) {
          setData([])

          setMessage('No result were found :(')
          return
        } else {
          setMessage('')
        }
        setData((prevData) => {
          const resultDataIds = JSON.stringify(result.data?.map((e) => e.id).sort())
          const prevDataIds = JSON.stringify(prevData?.map((e) => e.id).sort())
          if (resultDataIds === prevDataIds) return prevData;
          return result.data;
        })

      } catch (err) {
        setError('Failed to fetch results, try again later.');
        console.error(err);
      } finally {
        //setIsLoading(false);
      }
    }
    const timeOutId = setTimeout(fetchData, 500);
    return () => clearTimeout(timeOutId);
  }, [inputValue]);

  function resultContainerHeightAnimate(itemsNumber) {
    let height = 98;
    function resultTween() {
      return (
        gsap.to(resultContainerRef.current, {
          height: height,
        })
      )
    }
    if (itemsNumber === 0) {
      height = 98
      resultTween()
      return
    }
    if (itemsNumber > 4) { height = 3 * 98 + 2 * 8; }
    else if (itemsNumber > 2) { height = 2 * 98 + 8 }
    else { height = 98 }
    resultTween()
  }

  useGSAP(() => {
    const animationProperties = {
      toAnimate: gsap.utils.toArray('.searchBarCardRef').slice(0, 6),
      toAnimateLength: gsap.utils.toArray('.searchBarCardRef').slice(0, 6).length,
      toFade: gsap.utils.toArray('.searchBarCardRef').splice(0, 6),
    }

    resultContainerHeightAnimate(animationProperties.toAnimateLength)
    if (animationProperties.toAnimate.length === 0) {
      return
    }

    gsap.timeline().fromTo(animationProperties.toAnimate, {
      opacity: 0,
      y: 0,
      scale: 0.7,
    }, {
      overwrite: true,
      stagger: {
        amount: 0.3,
        grid: 'auto',
        ease: 'none',
      },
      duration: 0.3,
      ease: 'back',
      opacity: 1,
      scale: 1,
    })
      .to(animationProperties.toFade, {
        opacity: 1,
        duration: 0.3
      })

  }, { dependencies: [visibleData] })

  useGSAP(() => {
    if (!isOpen)
      resultContainerHeightAnimate(2)
  }, { dependencies: [isOpen] })

  useGSAP(() => {
    if (!count) return
    const toAnimate = gsap.utils.toArray('.searchBarCardRef')


    if (!toAnimate || toAnimate.length === 0) {
      setVisibleData(data)
      return () => { }
    }

    gsap.to(toAnimate, {
      scale: 0.7,
      y: 20,
      opacity: 0,
      duration: 0.16,
      ease: 'power2.in',
      onComplete: () => {
        isAnimating.current = false
        count.current = 0
        gsap.set(cardsRef.current, { y: 0 })
        setVisibleData(data)
      }
    })

    return () => {
    }
  }, { dependencies: [data] })

  useGSAP(() => {
    if (!messageRef.current) return;
    let split = SplitText.create(messageRef.current, { autoSplit: true, type: 'chars' })
    gsap.timeline()
      .from(split.chars, {
        stagger: {
          each: 0.02,
        },
        autoAlpha: 0,
        y: 10,
        scaleY: 0.2,
        x: -5,
      })

  }, { dependencies: [message] })

  function animateRows(classNameOrRef, itemHeight, isMobile, computerRows, mobileRows, lastRowOnDisplay, count) {
    let rowsToAnimate = computerRows
    if (isMobile) rowsToAnimate = mobileRows
    if (count > rowsToAnimate - lastRowOnDisplay) return;
    if (count < 0) return;
    gsap.to(classNameOrRef, {
      y: -(count * itemHeight),
      ease: 'power2.out',
      duration: 0.2,
      onStart: () => isAnimating.current = true,
      onComplete: () => isAnimating.current = false
    })
  }
  useGSAP(() => {
    Observer.create({
      target: resultContainerRef.current || window, // Fallback to window if ref isn't ready
      type: 'wheel, touch',
      preventDefault: true,
      onUp: () => {
        if (!cardsRef.current) return;
        if (isAnimating.current) return
        let maxRows = isMobile ? 24 : 12;
        count.current++;
        if (count.current > maxRows - 3) count.current = maxRows - 3;
        animateRows(cardsRef.current, 98 + 8, isMobile, 12, 24, 3, count.current);

      },
      onDown: () => {
        if (!cardsRef.current) return;
        if (isAnimating.current) return
        count.current--;
        if (count.current < 0) count.current = 0
        animateRows(cardsRef.current, 98 + 8, isMobile, 12, 24, 3, count.current);
      },
    });
  }, { dependencies: [isMobile] });

  const { contextSafe } = useGSAP(() => {
    tlRef.current = gsap.timeline({ paused: true })
      .from(containerRef.current, {
        width: 0,
      })
      .from((inputRef.current), {
        width: 0,
        padding: 0,
        margin: 0,
        ease: 'power4'
      }, 0)
      .from(resultContainerRef.current, {
        pointerEvents: 'none',
        scale: 0.6,
        width: 0,
        y: -20,
        opacity: 0,
        duration: 0.5,
        ease: 'power3',
        height: 0
      }, '0.02')
  });


  const onPointerEnter = contextSafe(() => {
    tlRef.current.play()
  })

  const onPointerLeave = contextSafe(() => {
    console.log('in pointer: ', inputValue)
    if (!inputValue) {
      resultContainerHeightAnimate(0)
      tlRef.current.reverse().eventCallback("onUpdate", () => setInputValue(""))
      setIsOpen(false)
    }
  })

  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value);
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setIsOpen(false);
    resultContainerHeightAnimate(0);
    tlRef.current?.reverse();
    navigate(`/search?q=${encodeURIComponent(trimmed)}&page=1`);
  };
  const handleFocus = () => {
    setIsOpen(true);
    tlRef.current.play();
  }

  useEffect(() => {
    if (currentId === -1) return;
    let isMounted = true;
    const fetchDataById = async () => {
      try {
        const result = await axios.get(`${URL}manga/${currentId}`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        setItemData(result.data);
        setItemLoaded(true);
        setImgUrl(result.data?.manga?.main_picture_large ?? null);
      } catch (err) {
        if (!isMounted) return;
        console.log('Error fetching data by ID:', err);
        setCurrentId(-1);
      }
    };

    fetchDataById();
    return () => {
      isMounted = false;
    };
  }, [currentId]);

  useEffect(() => {
    function handleMouseOut(e) {
      if (resultContainerRef.current && (resultContainerRef.current.contains(e.target)) || inputRef.current.contains(e.target)) {
        return
      }
      setIsOpen(false)
      resultContainerHeightAnimate(0)
      tlRef.current.reverse().eventCallback("onUpdate", () => setInputValue(""))
    }
    document.addEventListener('mousedown', handleMouseOut)
    return () => document.removeEventListener('mousedown', handleMouseOut)

  }, [isOpen])

  return (
    <>
      <div
        className={styles.container}
        ref={containerRef}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
      >
        <form className={styles.form} onSubmit={handleSubmit} ref={formRef}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search..."
            value={inputValue}
            onChange={handleChange}
            onFocus={handleFocus}
          //onBlur={}
          />
          <button
            className={styles.button}
            ref={buttonRef}

          >
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 30 30">
              <path d="M 13 3 C 7.4889971 3 3 7.4889971 3 13 C 3 18.511003 7.4889971 23 13 23 C 15.396508 23 17.597385 22.148986 19.322266 20.736328 L 25.292969 26.707031 A 1.0001 1.0001 0 1 0 26.707031 25.292969 L 20.736328 19.322266 C 22.148986 17.597385 23 15.396508 23 13 C 23 7.4889971 18.511003 3 13 3 z M 13 5 C 17.430123 5 21 8.5698774 21 13 C 21 17.430123 17.430123 21 13 21 C 8.5698774 21 5 17.430123 5 13 C 5 8.5698774 8.5698774 5 13 5 z"></path>
            </svg>
          </button>
        </form>
        <div className={styles.result__container} ref={resultContainerRef}
        >
          <div className={styles.message__wrapper}>
            <h4 className={styles.message} ref={messageRef}>{message || error}</h4>
          </div>
          <div
            ref={cardsRef}
            className={styles.searchBarCardsRef}
          >
            {visibleData.map((e) => {
              return (
                <div className={`${styles.resultCard} searchBarCardRef`} key={e.id}>
                  <SearchResult
                    id={e.id}
                    title={e.title}
                    main_image_medium={e.main_picture_medium}
                    status={e.status}
                    mean={e.mean}
                    synopsis={e.synopsis}
                    start_date={e.start_date}
                    end_date={e.end_date}
                    media_type={e.media_type}
                    favorites={toFavoriteFlag(e.favorites)}
                    setCurrentId={setCurrentId}
                    setIsCurrentIdFromCard={setIsCurrentIdFromCard}
                    setItemLoaded={setItemLoaded}
                  ></SearchResult>
                </div>)
            })}
          </div>
        </div>

      </div>
      <ItemLoading
        currentId={currentId}
        itemLoaded={itemLoaded}
        isCurrentIdFromCard={isCurrentIdFromCard}
      />
      {itemData && (
        <Item
          currentId={currentId}
          itemLoaded={itemLoaded}
          setItemLoaded={setItemLoaded}
          setInnerCardId={setCurrentId}
          manga={itemData.manga}
          relatedManga={itemData?.relatedManga}
          recommendedManga={itemData?.recommendedManga}
          imgUrl={imgUrl}
          setImgUrl={setImgUrl}
          setIsCurrentIdFromCard={setIsCurrentIdFromCard}
          isCurrentIdFromCard={isCurrentIdFromCard}
        />
      )}
    </>
  )
}
