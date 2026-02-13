import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";
import { Header } from "../../components/Header/Header.jsx";
import { MangaCard } from "../../components/Manga/MangaCard/MangaCard.jsx";
import { MangaCardSkel } from "../../Skeletons/MangaCard/MangaCard.jsx";
import { Pagination } from "../../components/Manga/Pagination/Pagination.jsx";
import { FilterContext } from "../../components/SmallComponents/FilterContext.js";
import ItemLoading from "../../components/Manga/OnClick/ItemLoading.jsx";
import Item from "../../components/Manga/OnClick/Item.jsx";
import { useAppError } from "../../Context/AppErrorContext.jsx";
import "../../components/Manga/MangaContainer.css";

const API_URL = import.meta.env.VITE_API_URL;

const PAGE_SIZE = 24;
const toFavoriteFlag = (value) => value === true || value === "t" || value === 1 || value === "1";

export function SearchPage() {
  const { setGlobalError } = useAppError();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const pageFromQuery = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageFromQuery) || pageFromQuery < 1 ? 1 : pageFromQuery;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [maxPageNum, setMaxPageNum] = useState(1);
  const [error, setError] = useState(null);

  const [itemData, setItemData] = useState(null);
  const [itemLoaded, setItemLoaded] = useState(false);
  const [currentId, setCurrentId] = useState(-1);
  const [isCurrentIdFromCard, setIsCurrentIdFromCard] = useState(true);
  const [imgUrl, setImgUrl] = useState(null);

  const setPage = useCallback(
    (nextPage) => {
      const parsed = Number.parseInt(String(nextPage), 10);
      const normalizedPage = Number.isNaN(parsed) || parsed < 1 ? 1 : parsed;
      const params = new URLSearchParams(searchParams);
      const currentPage = params.get("page") ?? "1";
      const currentQuery = (params.get("q") ?? "").trim();
      if (currentPage === String(normalizedPage) && currentQuery === query) return;
      params.set("page", String(normalizedPage));
      if (query) params.set("q", query);
      else params.delete("q");
      setSearchParams(params, { replace: true });
    },
    [query, searchParams, setSearchParams],
  );

  useEffect(() => {
    if (!query) {
      setLoading(false);
      setResults([]);
      setMaxPageNum(1);
      setError("Type a query in search first.");
      return;
    }

    let isMounted = true;
    const fetchSearchResult = async () => {
      setLoading(true);
      try {
        const result = await axios.get(`${API_URL}/search`, {
          withCredentials: true,
          params: {
            q: query,
            page,
            limit: PAGE_SIZE,
          },
        });
        if (!isMounted) return;
        setResults(result.data?.page ?? []);
        setMaxPageNum(result.data?.maxPageNum ?? 1);
        setError(null);
        if (result.data?.pageNum && result.data.pageNum !== page) {
          setPage(result.data.pageNum);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err?.response?.data?.error ?? "Failed to fetch search results.";
        setResults([]);
        setMaxPageNum(1);
        setError(message);
        setGlobalError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSearchResult();
    return () => {
      isMounted = false;
    };
  }, [query, page, setPage, setGlobalError]);

  useEffect(() => {
    if (currentId === -1) return;
    let isMounted = true;
    const fetchDataById = async () => {
      try {
        const result = await axios.get(`${API_URL}/manga/${currentId}`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        setItemData(result.data);
        setItemLoaded(true);
        setImgUrl(result.data?.manga?.main_picture_large ?? null);
      } catch (err) {
        if (!isMounted) return;
        setGlobalError(err?.response?.data?.error ?? "Failed to load manga details.");
        setCurrentId(-1);
      }
    };
    fetchDataById();
    return () => {
      isMounted = false;
    };
  }, [currentId, setGlobalError]);

  useEffect(() => {
    if (query || page === 1) return;
    setPage(1);
  }, [page, query, setPage]);

  useEffect(() => {
    setCurrentId(-1);
    setItemData(null);
    setItemLoaded(false);
    setImgUrl(null);
  }, [page, query]);

  const filterContextValue = useMemo(
    () => ({
      page,
      setPage,
      loading,
    }),
    [page, setPage, loading],
  );

  return (
    <div className="body">
      <Header />
      <FilterContext value={filterContextValue}>
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
        <div className="manga__container">
          {loading
            ? Array.from({ length: PAGE_SIZE }, (_, i) => <MangaCardSkel key={i} />)
            : results.map((manga) => (
              <MangaCard
                key={manga.id}
                id={manga.id}
                main_picture_large={manga.main_picture_large}
                title={manga.title}
                english_title={manga.english_title}
                mean={manga.mean}
                media_type={manga.media_type}
                num_volumes={manga.num_volumes}
                popularity={manga.popularity}
                rank={manga.rank}
                start_date={manga.start_date}
                status={manga.status}
                synopsis={manga.synopsis}
                favorites={toFavoriteFlag(manga.favorites)}
                setCurrentId={setCurrentId}
                setIsCurrentIdFromCard={setIsCurrentIdFromCard}
                setItemLoaded={setItemLoaded}
              />
            ))}
          {!loading && results.length === 0 && (
            <h2 style={{ padding: "20px 0" }}>{error || "No results found."}</h2>
          )}
        </div>
        {loading ? (
          <h1 className="paginationMangaContainer">pagination loading...</h1>
        ) : (
          <Pagination maxPageNum={maxPageNum} />
        )}
      </FilterContext>
    </div>
  );
}
