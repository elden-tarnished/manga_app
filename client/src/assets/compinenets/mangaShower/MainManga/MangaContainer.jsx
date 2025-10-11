import {useState, useEffect, useMemo, useRef} from 'react';
import axios from 'axios';
import {MangaCard} from './MangaCard';
import { MangaCardSkel } from '../mainMangaSkel/mangaCardSkel';
import { Filter } from './filter';
import { Pagination } from './pagination';
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
      try {
        console.log(`
          getGenre: ${genre}\n
          getTheme: ${theme}\n
          getExplicitGenre: ${explicitGenre}\n
          getOrder: ${order}\n
          getDemographic: ${demographic}\n
          getType: ${type}
          other: ${limit}
          other2: ${direction}`
        );
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

        setVisibleCount(30);
        setData(result.data);
        setMangas(result.data.page);
        setHasMore(result.data.page.length > 30);

        console.log('num: ', result.data.pageNum, result.data.maxPageNum)
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
    if (!IntersectionObserverRef) return;
    console.log(window.innerWidth)
    const target = IntersectionObserverRef.current;
    const options = {
      root: null,
      rootMargin: '1000px',
      threshold: 0,
    }
    const callback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting)

        console.log(entry)
        console.log('visible Count',visibleCount)
        if(entry.isIntersecting){
          if (mangas.length >= visibleCount) {
            setVisibleCount(prev => {
              if (mangas.length > visibleCount) {
                return (prev + 24);
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
    
  }, [hasMore, mangas])

  const visibleMangas = mangas.slice(0, visibleCount);

  return(<div className='body'>
  <FilterContext value={filter}>
    {staticLoading ?
    <FilterSkel/> :
    <Filter FilterOptions={data.sortOption}/>
    }
    <div className='manga__container' ref={mangaContainerRef}>
      {loading ? Array.from({length: visibleCount}, (_, i) => <MangaCardSkel key={i}/>) :
        visibleMangas.map( (e)=>
        <MangaCard
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