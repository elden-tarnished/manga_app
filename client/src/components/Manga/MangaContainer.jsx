import { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '../Header/Header.jsx';
import axios from 'axios';
import { MangaCard } from './MangaCard/MangaCard.jsx';
import { MangaCardSkel } from '../../Skeletons/MangaCard/MangaCard.jsx'
import { Filter } from '../Filter/Filter.jsx';
import { Pagination } from './Pagination/Pagination.jsx';
import { FilterContext } from "../SmallComponents/FilterContext.js";
import { FilterSkel } from "../../Skeletons/Filter/Filter.jsx";
import { useAppError } from "../../Context/AppErrorContext.jsx";
import { gsap } from 'gsap';
import { Observer } from "gsap/Observer"
import { Flip } from "gsap/Flip";
import ItemLoading from './OnClick/ItemLoading.jsx'
import Item from './OnClick/Item.jsx'
import './MangaContainer.css'
import { useIsMobile } from '../SmallComponents/IsMobileProvider.jsx';


const API_URL = import.meta.env.VITE_API_URL;
const FAVORITE_PAGE_SIZE = 24;
const toFavoriteFlag = (value) => value === true || value === "t" || value === 1 || value === "1";
const parsePageFromQuery = () => {
  if (typeof window === 'undefined') return 1;
  const rawPage = new URLSearchParams(window.location.search).get('page');
  const parsedPage = Number.parseInt(rawPage ?? '1', 10);
  return Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
};

export function MangaContainer({ mode = 'browse' }) {
  const isFavoritesMode = mode === 'favorites';
  const { setGlobalError } = useAppError();
  const containerRef = useRef(null);

  gsap.registerPlugin(Observer, Flip);
  const mangaContainerRef = useRef(null);

  const isMobile = useIsMobile()
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staticLoading, setStaticLoading] = useState(true);
  const [mangas, setMangas] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [error, setError] = useState(null);

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

  const [rerenderImgs, setRerenderImgs] = useState(0);
  useEffect(() => {

    const cardWidth = isMobile ? 147 : 180;
    let bucket = Math.floor(window.innerWidth / cardWidth);
    const atWidthRerender = () => {
      const nextBucket = Math.floor(window.innerWidth / cardWidth);
      if (nextBucket !== bucket) {
        bucket = nextBucket;
        setRerenderImgs(bucket);
      }
    }
    window.addEventListener("resize", atWidthRerender)
    return () => window.removeEventListener("resize", atWidthRerender)

  }, [isMobile])

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [page])

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
        const result = await axios.get(API_URL + `/manga/${currentId}`, { withCredentials: true })
        setItemData(result.data)
        setItemLoaded(true)
        setImgUrl(result.data.manga.main_picture_large)
      }
      catch (err) {
        console.log('Error fetching data by ID:', err);
        setGlobalError(err?.response?.data?.error || 'Failed to load manga details.');
        // Reset state on error to prevent being stuck in loading
        setCurrentId(-1);
        //alert("Failed to load manga details.");
      }
    }

    fetchDataById()
  }, [currentId, setGlobalError])

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
    if (isFavoritesMode) return;
    let isMounted = true;

    async function fetchBrowseData() {
      setLoading(true);
      try {
        const result = await axios.get(API_URL + '/manga', {
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
        if (!isMounted) return;
        const mangaItem = result.data.page;
        setData(result.data ?? null);
        setMangas(mangaItem ?? []);
        setError(null);
        if (result.data?.pageNum && result.data.pageNum !== page) {
          setPage(result.data.pageNum);
        }
      } catch (err) {
        if (!isMounted) return;
        console.log('error', err);
        setMangas([]);
        const message = err?.response?.data?.error || 'Failed to load manga.';
        setError(message);
        setGlobalError(message);
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setStaticLoading(false);
      }
    }

    fetchBrowseData()
    return () => {
      isMounted = false;
    };
  }, [
    isFavoritesMode,
    page,
    genre,
    theme,
    explicitGenre,
    order,
    demographic,
    type,
    limit,
    direction,
    setGlobalError]);

  useEffect(() => {
    if (!isFavoritesMode) return;
    let isMounted = true;

    async function fetchFavorites() {
      try {
        setLoading(true);
        const result = await axios.get(`${API_URL}/user/favorites`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        setFavoriteItems(result.data?.favorited ?? []);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setFavoriteItems([]);
        const message = err?.response?.status === 401 ? 'Please log in to view favorites.' : 'Failed to load favorites.';
        setError(message);
        setGlobalError(message);
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setStaticLoading(false);
      }
    }

    fetchFavorites();
    return () => {
      isMounted = false;
    };
  }, [isFavoritesMode, setGlobalError]);

  const favoriteMaxPageNum = useMemo(
    () => Math.max(1, Math.ceil(favoriteItems.length / FAVORITE_PAGE_SIZE)),
    [favoriteItems.length],
  );

  useEffect(() => {
    if (!isFavoritesMode) return;
    if (page <= favoriteMaxPageNum) return;
    setPage(favoriteMaxPageNum);
  }, [isFavoritesMode, page, favoriteMaxPageNum]);

  const visibleMangas = useMemo(() => {
    if (!isFavoritesMode) return mangas;
    const startIndex = (page - 1) * FAVORITE_PAGE_SIZE;
    const endIndex = startIndex + FAVORITE_PAGE_SIZE;
    return favoriteItems.slice(startIndex, endIndex);
  }, [isFavoritesMode, mangas, favoriteItems, page]);

  const maxPageNum = isFavoritesMode ? favoriteMaxPageNum : (data?.maxPageNum ?? 1);
  const skeletonCount = isFavoritesMode ? FAVORITE_PAGE_SIZE : Number.parseInt(limit, 10);
  const showSkeleton = loading;
  const emptyMessage = isFavoritesMode ? (error || 'No favorites yet.') : (error || 'No manga found.');

  return (<div className='body' ref={containerRef}>
    <Header />

    <FilterContext value={filter}>
      {!isFavoritesMode && (staticLoading ?
        <FilterSkel />
        :
        data?.sortOption ? <Filter FilterOptions={data.sortOption} /> : null
      )}
      <ItemLoading
        currentId={currentId}
        itemLoaded={itemLoaded}
        setItemLoaded={setItemLoaded}
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
        {showSkeleton ? Array.from({ length: skeletonCount }, (_, i) => <MangaCardSkel key={i} />) :
          visibleMangas.map((e) =>
            <MangaCard
              isMobile={isMobile}
              render={rerenderImgs}
              setItemLoaded={setItemLoaded}
              setIsCurrentIdFromCard={setIsCurrentIdFromCard}
              isCurrentIdFromCard={isCurrentIdFromCard}
              setCurrentId={setCurrentId}
              key={e.id}
              id={e.id}
              main_picture_large={e.main_picture_large || e.main_picture_medium}
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
              favorites={isFavoritesMode ? true : toFavoriteFlag(e.favorites)}
            />
          )
        }
        {!loading && visibleMangas.length === 0 && (
          <h2 style={{ padding: '20px 0' }}>{emptyMessage}</h2>
        )}
      </div>
      {staticLoading ? <h1 className='paginationMangaContainer'>pagination loading...</h1> :
        <Pagination maxPageNum={maxPageNum} />}
    </FilterContext>
  </div>)
}
