import styles from './Item.module.css';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import ItemImage from './ItemImage';
import ImageSlideShow from './ImageSlideShow';
import { useGSAP } from '@gsap/react';
import { useRef, useEffect } from 'react';
import { useIsMobile } from '../../SmallComponents/IsMobileProvider';

export default function Item(props) {
  const {
    mainPictureLarge,
    title, englishTitle, synonym, japaneseTitle,
    startDate, endDate,
    synopsis, background,
    mean, rank, popularity, numListUsers, numScoringUsers,
    status, nsfw, mediaType,
    numChapters, numVolumes,
    serialization,
    picturesLarge, picturesMedium,
    authors, tags,
  } = props.manga;

  const {
    relatedManga,
    recommendedManga,
    setInnerCardId,
    imageUrl,
    setImgUrl,
    itemLoaded,
    isCurrentIdFromCard,
    setIsCurrentIdFromCard,
    setItemLoaded,
    currentId
  } = props;


  const containerRef = useRef(null);
  const staggerRef = useRef([]);
  const fadersRef = useRef([]);
  const isMobile = useIsMobile()

  useEffect(() => {
    // Lock scroll
    if (itemLoaded) {
      document.body.style.overflow = 'hidden';
    }

    // Handle Escape Key
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        backAnimation()
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      // Unlock scroll
      document.body.style.overflow = "visible";
      window.removeEventListener('keydown', handleEsc);
    };
  }, [itemLoaded]);

  // Entrance Animation
  useGSAP(() => {
    //if (isCurrentIdFromCard) return
    // Ensure container is visible
    gsap.set(containerRef.current, { opacity: isCurrentIdFromCard ? 0 : 1, display: "flex" });

    const leftStagger = staggerRef.current.slice(0, 4);
    const rightStagger = staggerRef.current.slice(4, staggerRef.current.length);

    const tlInInside = gsap.timeline()
      .to(containerRef.current, {
        opacity: 1,
        duration: 0.4
      }, 0.2);
    [leftStagger, rightStagger].forEach(group => {
      tlInInside.fromTo(group,
        {
          opacity: 0,
          y: 50
        },
        {
          opacity: 1,
          y: 0,
          stagger: 0.02,
          ease: 'power2.out'
        }
        , 0.5);
    })
  }, {
    dependencies: [
      props.manga,

      //itemLoaded
    ], scope: containerRef
  });
  //
  // useGSAP(() => {
  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleRelatedClick = contextSafe((mangaData, e) => {
    // Capture Flip State
    const targetImage = e.currentTarget.querySelector('img');
    if (targetImage) {
      setImgUrl(mangaData.mainPictureLarge)
    }

    const leftStagger = staggerRef.current.slice(0, 4);
    const rightStagger = staggerRef.current.slice(4, staggerRef.current.length);
    [leftStagger, rightStagger].forEach(group => {
      gsap.fromTo(group,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -20,
          stagger: 0.05,
          duration: 0.4,
          ease: 'power2.out',
          onComplete: () => {
            setInnerCardId(mangaData.id);
            setIsCurrentIdFromCard(false);
            // Scroll to top of container so the new item starts fresh
            if (containerRef.current) containerRef.current.scrollTop = 0;
          }
        }
      );
    })
  });

  function backAnimation() {
    setInnerCardId(-1)
    setItemLoaded(false);
    document.body.style.overflow = "visible";
    gsap.to(containerRef.current, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => gsap.set(containerRef.current, { display: "none" })
    })

  }

  const startYear = startDate === null ? null : new Date(startDate).getFullYear().toString();
  const endYear = endDate === null ? null : new Date(endDate).getFullYear().toString();

  const STATUS_MAP = {
    finished: 'Completed',
    currently_publishing: 'Publishing',
    on_hiatus: 'On_hiatus',
    discontinued: 'Canceled'
  };

  const statusClass = STATUS_MAP[status] || 'NA';
  const tagsSpan = tags ? tags.map((e, i) => <span key={i} className={styles.tag}>{e.tag}</span>) : [];

  const authorContainer = authors ? authors.map(e => {
    return (
      <div className={styles.authors} key={`${e.firstName}-${e.lastName}`}>
        <h3 className={styles.font_size}>{e.firstName} {e.lastName}</h3>
        <hr className={styles.hr_author_role} />
        <h3 className={styles.font_size}>{e.role}</h3>
      </div>
    );
  }) : [];
  const titleAndThings =
    <div className={styles.title__synonym__container}>
      <div className={styles.status_type__container} ref={(el) => staggerRef.current[4] = el}>
        <h4 className={`status ${statusClass}`}>{statusClass}</h4>
        <h4 className={`media-type ${mediaType}`}>{mediaType}</h4>
      </div>
      <div className={styles.title__container} ref={(el) => staggerRef.current[5] = el}>
        <h2 className={styles.title}>{englishTitle ? englishTitle : title}</h2>
        <span className={styles.year}>
          (
          <span className={styles.start_year}>{startYear}</span>
          {endYear ? <span className={styles.end_year}>-{endYear}</span> : ""}
          )
        </span>
      </div>
      <div className={styles.synonym} ref={(el) => staggerRef.current[6] = el}>
        synonym: {synonym}, {japaneseTitle}
      </div>
    </div>
  const mainImage =
    <div className={styles.img__div} ref={(el) => staggerRef.current[0] = el}>
      <img
        className={styles.img}
        src={mainPictureLarge}
        alt={`${title} cover`}
      />
    </div>

  const serializations = serialization ? serialization.split(",").map((e, i) => <span key={`${e}-${i}`} className={`${styles.serialization} ${styles.font_size}`}>{e}</span>) : [];

  return (
    <div className={styles.container} ref={containerRef}>
      <button className={styles.button} ref={(el) => fadersRef.current[0] = el} onClick={backAnimation}>Back</button>
      <div className={styles.fader} ref={(el) => fadersRef.current[1] = el}>
      </div>

      {/* Main Content Area */}
      <div className={styles.imgAndRight} >

        <div className={styles.mainImgContainer}>
          <div className={styles.img__container}>
            {isMobile ?
              <div className={styles.img__title}>
                {mainImage}
                {titleAndThings}
              </div> :
              mainImage
            }
            {tags && tags.length > 0 && (
              <div ref={(el) => staggerRef.current[1] = el} className={styles.tags_and_title}>
                <h3 className={styles.tags_title}>Tags</h3>
                <div className={styles.tags__container}>
                  {tagsSpan}
                </div>
              </div>
            )}
            <div className={styles.scores__container} ref={(el) => staggerRef.current[2] = el}>
              {mean && <h3 className={styles.score}>Score: <span>{mean}</span></h3>}
              {mean && rank && <hr />}
              {rank && <h3 className={styles.score}>Rank: <span>{rank}</span></h3>}
              {(mean || rank) && <hr />}
              <h3 className={styles.score}>Popularity: <span>{popularity}</span> </h3>
            </div>
            <div className={styles.volumes__container} ref={(el) => staggerRef.current[3] = el}>
              <h3 className={styles.volumes}>Chapters: <span>{numChapters}</span></h3>
              <hr />
              <h3 className={styles.volumes}>Volumes: <span>{numVolumes}</span></h3>
            </div>
          </div>
        </div>
        <div className={styles.right}>

          {!isMobile &&
            titleAndThings
          }
          {synopsis && <p className={styles.p} ref={(el) => staggerRef.current[7] = el}>{synopsis}</p>}
          <div className={styles.author_serialization} ref={(el) => staggerRef.current[8] = el}>
            {authors && authors.length > 0 && (
              <div
                className={styles.authors__container}
                style={{ flexDirection: authorContainer.length > 1 ? "column" : "column" }}>
                <div className={styles.title_role}>
                  <h3 className={`${styles.author_title} ${styles.t}`}>{authorContainer.length > 1 ? "Authors" : "Author"}</h3>
                  <h3 className={`${styles.author_role} ${styles.t}`}>Role</h3>
                </div>
                <hr />
                {authorContainer}
              </div>
            )}
            {serialization && <h3 className={`${styles.serialization__container} ${styles.t}`}>Serialization: {serializations}</h3>}
          </div>
          {picturesLarge && picturesLarge.length > 0 && (
            <div
              className={styles.imgs__container}
              ref={(el) => staggerRef.current[9] = el}
            >
              <h3 className={`${styles.other_pictures_title} ${styles.t}`}>Other Pictures</h3>
              <ImageSlideShow
                images={picturesLarge}
                isCover={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Background & Related */}
      {(background || (relatedManga && relatedManga.length > 0)) && (
        <div className={`${styles.background_related} ${(relatedManga.length > 2) ? styles.bg_related_3_plus : styles.bg_related_2}`} ref={(el) => staggerRef.current[10] = el}>
          {background && (
            <div className={styles.background__container}>
              <h3 className={`${styles.background_title} ${styles.t}`}>Background</h3>
              <p className={styles.background}>{background}</p>
            </div>
          )}
          {relatedManga && relatedManga.length > 0 && (
            <div className={`${styles.relatedManga_container} ${(relatedManga.length > 2) ? styles.related_3_plus : styles.related_2}`}>
              <h3 className={`${styles.other_pictures_title} ${styles.t}`}>related manga</h3>
              <ImageSlideShow
                images={relatedManga}
                onItemClick={handleRelatedClick}
              />
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      {recommendedManga && recommendedManga.length > 0 && (
        <div className={styles.recommended__container} ref={(el) => staggerRef.current[11] = el}>
          <h3 className={`${styles.other_pictures_title} ${styles.t}`}>recommendation</h3>
          <ImageSlideShow
            images={recommendedManga}
            onItemClick={handleRelatedClick}
          />
        </div>
      )}

      <div className={styles.faderBottom} ref={(el) => fadersRef.current[2] = el} >
      </div>
    </div>
  );
}
