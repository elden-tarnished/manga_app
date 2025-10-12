import {useEffect, useMemo, useRef, useState} from 'react';
import axios from 'axios';
import {MangaCard} from './MangaCard';
import {MangaCardSkel} from '../mainMangaSkel/mangaCardSkel';
import {Filter} from './filter';
import {Pagination} from './pagination';
import {FilterContext} from "./context.js";
import './css/MangaContainer.css'
import {FilterSkel} from "../mainMangaSkel/filterSkel.jsx";


export function MangaContainer() {

  const mangaContainerRef = useRef(null);
  const IntersectionObserverRef = useRef(null);
  // const [mangaContainerWidth, setMangaContainerWidth] = useState(null)


  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(true);

  const [mangas, setMangas] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  const [genre,         setGenre] =         useState([]);
  const [theme,         setTheme] =         useState([]);
  const [explicitGenre, setExplicitGenre] = useState([]);
  const [demographic,   setDemographic] =   useState([]);
  const [type,          setType] =          useState([]);
  const [order,         setOrder] =         useState('');
  const [limit,         setLimit] =         useState('60');
  const [direction,     setDirection] =     useState('');

  const [page,          setPage] =          useState(1);


  function randomColors(pageAmount, colors, opacity) {
    return Array.from({length: pageAmount}, () => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const rgba = hexToRgba(color, opacity);
      return [color, rgba]
    })
  }
  function hexToRgba(hexColor, opacity) {
    let hex = hexColor.replace('#', '')
    if (hexColor.length < 4) {
      hex = hexColor.split('').map(char => char + char).join('');
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgba(${r},${g},${b}, ${opacity})`;
  }
  const colors =  [
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
  const randomColorsMemo = useMemo(() => {
    return randomColors(parseInt(limit, 10) || 0, colors, 0.7);

  }, [page, limit]);

  const filter = useMemo(() => ({
    genre,
    theme,
    explicitGenre,
    order, 
    demographic,
    type,
    limit,
    direction,
    
    setGenre,
    setTheme,
    setExplicitGenre,
    setOrder,
    setDemographic,
    setType,
    setLimit,
    setDirection,
    
    page,
    setPage,

    loading
  }), [
      loading,
      page,
      genre,
      theme,
      explicitGenre,
      order,
      demographic,
      type,
      limit,
      direction,])

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setVisibleCount(24);
      try {
        const result = await axios.get('http://localhost:3000/manga', {
          params: {
            genre,
            theme,
            explicitGenre,
            demographic,
            type,
            order,
            limit,
            direction,
            page,
          }
        });
        setData(result.data);
        setMangas(result.data.page);
        setHasMore(result.data.page.length > 24);
      } catch (err) {
        console.log('eRRor', err);
      } finally {
        setLoading(false);
        setStaticLoading(false);
      }
    }

    const timeOutId = setTimeout(() => fetchData().catch((err) => console.log(err)), 500)
    return () => clearTimeout(timeOutId)

  }, [
    page,
    genre,
    theme,
    explicitGenre,
    order,
    demographic,
    type,
    limit,
    direction]);


  useEffect(() => {
    if (!hasMore) return;
    console.log(window.innerWidth)
    const target = IntersectionObserverRef.current;
    if (!target) return;
    const options = {
      root: null,
      rootMargin: '1000px',
      threshold: 0,
    }
    const callback = (entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          if (mangas.length >= visibleCount) {
            setVisibleCount(prev => {
              if (mangas.length > visibleCount && hasMore) {
                return (prev + Math.min(12, mangas.length - prev));
              }
              else {
                setHasMore(false);
                return mangas.length
              }
            });
          }
        }
      })
    }
  
    const observer = new IntersectionObserver(callback, options);
    observer.observe(target)
    return () => {
        observer.unobserve(target)
        observer.disconnect()
    }
    
  }, [hasMore, mangas, hasMore])

  const visibleMangas =mangas ? (mangas.slice(0, visibleCount)): [];
  console.log(' visibleCount: '+ visibleCount + ' colors : ' + randomColorsMemo.length + ' mangas: ' + mangas.length);

  return(<div className='body'>
  <FilterContext value={filter}>
    {staticLoading ?
    <FilterSkel/> :
    <Filter FilterOptions={data.sortOption}/>
    }
    <div className='manga__container' ref={mangaContainerRef}>
      {loading ? Array.from({length: visibleCount}, (_, i) => <MangaCardSkel key={i} color={randomColorsMemo[i]}/>) :
        visibleMangas.map( (e, i)=>
        <MangaCard
        color={randomColorsMemo[i]}
        key={e.id}
        main_picture_large={e.main_picture_large}
        title={e.title}
        english_title={e.english_title}
        mean={e.mean}
        media_type={e.media_type}
        num_volumes={e.num_volumes}
        popularity={e.popularity}
        rank={e.rank}
        start_date={e.start_date}
        status={e.status}
        synopsis={e.synopsis}
        />
      )}
    </div>
      <div ref={IntersectionObserverRef} style={{width: '300px', height: '2px', backgroundColor: 'black'}}></div>
  { staticLoading? <h1>pagination loading...</h1>:
  <Pagination maxPageNum={data.maxPageNum}/>}
  </FilterContext>
  </div>)
}