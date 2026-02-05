import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../Header/Header.jsx';
import axios from 'axios';
import { MangaCard } from './MangaCard/MangaCard.jsx';
import { MangaCardSkel } from '../../Skeletons/MangaCard/MangaCard.jsx'
import { Filter } from '../Filter/Filter.jsx';
import { Pagination } from './Pagination/Pagination.jsx';
import { FilterContext } from "../SmallComponents/FilterContext.js";
import { FilterSkel } from "../../Skeletons/Filter/Filter.jsx";
import { gsap } from 'gsap';
import { Observer } from "gsap/Observer"
import { Flip } from "gsap/Flip";
import ItemLoading from './OnClick/ItemLoading.jsx'
import Item from './OnClick/Item.jsx'
import './MangaContainer.css'


const URL = "http://localhost:3000"
const toFavoriteFlag = (value) => value === true || value === "t" || value === 1 || value === "1";
const parsePageFromQuery = () => {
  if (typeof window === 'undefined') return 1;
  const rawPage = new URLSearchParams(window.location.search).get('page');
  const parsedPage = Number.parseInt(rawPage ?? '1', 10);
  return Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
};

export function MangaContainer() {

  gsap.registerPlugin(Observer, Flip);
  const mangaContainerRef = useRef(null);
  // const [mangaContainerWidth, setMangaContainerWidth] = useState(null)


  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(true);

  const [mangas, setMangas] = useState([]);

  const [genre, setGenre] = useState([]);
  const [theme, setTheme] = useState([]);
  const [explicitGenre, setExplicitGenre] = useState([]);
  const [demographic, setDemographic] = useState([]);
  const [type, setType] = useState([]);
  const [order, setOrder] = useState(null);
  const [limit, setLimit] = useState('60');
  const [direction, setDirection] = useState(null);

  const [page, setPage] = useState(parsePageFromQuery);

  const [itemData, setItemData] = useState(null)
  const [itemLoaded, setItemLoaded] = useState(false)

  const [currentId, setCurrentId] = useState(-1);
  const [isCurrentIdFromCard, setIsCurrentIdFromCard] = useState(true);

  // New State for shared element transitions
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const currentPage = Number.parseInt(params.get('page') ?? '1', 10);
    if (currentPage === page) return;
    params.set('page', String(page));
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [page]);

  useEffect(() => {
    if (currentId === -1) return;
    const fetchDataById = async () => {

      try {
        const result = await axios.get(URL + `/manga/${currentId}`, { withCredentials: true })
        setItemData(result.data)
        setItemLoaded(true)
        setImgUrl(result.data.manga.main_picture_large)
      }
      catch (err) {
        console.log('Error fetching data by ID:', err);
        // Reset state on error to prevent being stuck in loading
        setCurrentId(-1);
        //alert("Failed to load manga details.");
      }
    }

    fetchDataById()
  }, [currentId])

  //
  // useGSAP(() => {
  //   Observer.create({
  //     target: window,
  //     type: "touch",
  //     onPress: () => {
  //       dragLock.current = false;
  //     },
  //     onChangeY:(self) => {
  //       if (dragLock.current) return;
  //       const distance = Math.abs(self.startY - self.y)
  //       if (distance > 50) {
  //         dragLock.current = true;
  //         setIsWheeling(true);
  //       }
  //     },
  //     onStop: () => {
  //       dragLock.current = false;
  //       setIsWheeling(false);
  //     }
  //   })
  // }, {}) // it have a initial stutter at wheeling for some reason everytime u have to first stutter at when the stuttering triggers and then smooth till the next wheeling

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
        const result = await axios.get(URL + '/manga', {
          withCredentials: true,
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
        const mangaItem = result.data.page


        setData(result.data);
        setMangas(mangaItem);
        if (result.data.pageNum && result.data.pageNum !== page) {
          setPage(result.data.pageNum);
        }
      } catch (err) {
        console.log('eRRor', err);
      } finally {
        setLoading(false);
        setStaticLoading(false);
      }
    }


    fetchData()
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

  const showSkeleton = loading && mangas.length === 0;

  return (<div className='body'>
    <Header />

    <FilterContext value={filter}>
      {staticLoading ?
        <FilterSkel />
        :
        <Filter FilterOptions={data.sortOption} />
      }
      <ItemLoading
        currentId={currentId}
        itemLoaded={itemLoaded}
        isCurrentIdFromCard={isCurrentIdFromCard}
      />
      {
        itemData &&
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
      }
      <div className='manga__container' ref={mangaContainerRef}>
        {showSkeleton ? Array.from({ length: parseInt(limit, 10) }, (_, i) => <MangaCardSkel key={i} />) :
          mangas.map((e) =>
            <MangaCard
              setItemLoaded={setItemLoaded}
              setIsCurrentIdFromCard={setIsCurrentIdFromCard}
              isCurrentIdFromCard={isCurrentIdFromCard}
              setCurrentId={setCurrentId}
              key={e.id}
              id={e.id}
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
              favorites={toFavoriteFlag(e.favorites)}
            />
          )}
      </div>
      {staticLoading ? <h1 className='paginationMangaContainer'>pagination loading...</h1> :
        <Pagination maxPageNum={data.maxPageNum} />}
    </FilterContext>
  </div>)
}
