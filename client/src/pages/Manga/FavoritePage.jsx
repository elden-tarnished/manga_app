import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Header } from "../../Components/Header/Header.jsx";
import { MangaCard } from "../../Components/Manga/MangaCard/MangaCard.jsx";
import { MangaCardSkel } from "../../Skeletons/MangaCard/MangaCard.jsx";
import { Pagination } from "../../Components/Manga/Pagination/Pagination.jsx";
import { FilterContext } from "../../Components/SmallComponents/FilterContext.js";
import ItemLoading from "../../Components/Manga/OnClick/ItemLoading.jsx";
import Item from "../../Components/Manga/OnClick/Item.jsx";
import "../../Components/Manga/MangaContainer.css";

const URL = "http://localhost:3000";
const PAGE_SIZE = 24;

const parsePageFromQuery = () => {
  if (typeof window === "undefined") return 1;
  const rawPage = new URLSearchParams(window.location.search).get("page");
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  return Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
};

export function FavoritePage() {
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(parsePageFromQuery);
  const [error, setError] = useState(null);
  const [itemData, setItemData] = useState(null);
  const [itemLoaded, setItemLoaded] = useState(false);
  const [currentId, setCurrentId] = useState(-1);
  const [isCurrentIdFromCard, setIsCurrentIdFromCard] = useState(true);
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const result = await axios.get(`${URL}/user/favorites`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        setFavorites(result.data?.favorited ?? []);
      } catch (err) {
        if (!isMounted) return;
        setFavorites([]);
        setError(err?.response?.status === 401 ? "Please log in to view favorites." : "Failed to load favorites.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchFavorites();
    return () => {
      isMounted = false;
    };
  }, []);

  const maxPageNum = useMemo(
    () => Math.max(1, Math.ceil(favorites.length / PAGE_SIZE)),
    [favorites.length],
  );

  useEffect(() => {
    if (page <= maxPageNum) return;
    setPage(maxPageNum);
  }, [page, maxPageNum]);

  useEffect(() => {
    if (currentId === -1) return;
    let isMounted = true;
    const fetchDataById = async () => {
      try {
        const result = await axios.get(`${URL}/manga/${currentId}`, {
          withCredentials: true,
        });
        if (!isMounted) return;
        setItemData(result.data);
        setItemLoaded(true);
        setImgUrl(result.data?.manga?.main_picture_large ?? null);
      } catch {
        if (!isMounted) return;
        setCurrentId(-1);
      }
    };
    fetchDataById();
    return () => {
      isMounted = false;
    };
  }, [currentId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const currentPage = Number.parseInt(params.get("page") ?? "1", 10);
    if (currentPage === page) return;
    params.set("page", String(page));
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [page]);

  const pagedFavorites = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return favorites.slice(startIndex, endIndex);
  }, [favorites, page]);

  const filterContextValue = useMemo(
    () => ({
      page,
      setPage,
      loading,
    }),
    [page, loading],
  );

  return (
    <div className="body" style={{ height: "100vh" }}>
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
            : pagedFavorites.map((manga) => (
              <MangaCard
                key={manga.id}
                id={manga.id}
                main_picture_large={manga.main_picture_large || manga.main_picture_medium}
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
                favorites={true}
                setCurrentId={setCurrentId}
                setIsCurrentIdFromCard={setIsCurrentIdFromCard}
                setItemLoaded={setItemLoaded}
              />
            ))}
          {!loading && pagedFavorites.length === 0 && (
            <h2 style={{ padding: "20px 0" }}>{error || "No favorites yet."}</h2>
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
