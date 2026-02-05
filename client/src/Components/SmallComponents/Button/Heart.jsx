import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import styles from "./Heart.module.css";
import axios from "axios";

const URL = "http://localhost:3000";
gsap.registerPlugin(MorphSVGPlugin);

export function Heart({ mangaId, setError, initialActive = false, width }) {
  const HEART_D =
    "M438.82 74.19c-54.9-54.9-143.92-54.9-198.82 0-54.9-54.9-143.92-54.9-198.82 0-54.9 54.9-54.9 143.92 0 198.82l156.4 156.4a60 60 0 0 0 84.85 0l156.4-156.4c54.9-54.9 54.9-143.92 0-198.82Z";

  const LOADING_D =
    "M398.7 240A239.4 239.4 0 0 0 480 60a60 60 0 0 0-60-60c-71.7 0-136 31.4-180 81.3A239.4 239.4 0 0 0 60 0 60 60 0 0 0 0 60c0 71.7 31.4 136 81.3 180A239.4 239.4 0 0 0 0 420a60 60 0 0 0 60 60c71.7 0 136-31.4 180-81.3A239.4 239.4 0 0 0 420 480a60 60 0 0 0 60-60c0-71.7-31.4-136-81.3-180Z";

  const [loading, setLoading] = useState(false);
  const heartSvgRef = useRef(null);
  const heartPathRef = useRef(null);
  const [active, setActive] = useState(Boolean(initialActive));
  const iconSize = Number.isFinite(Number(width)) && Number(width) > 0 ? Number(width) : 40;

  useEffect(() => {
    setActive(Boolean(initialActive));
  }, [initialActive, mangaId]);

  const startLoadingAnimation = () => {
    gsap.killTweensOf(heartSvgRef.current);
    gsap.to(heartPathRef.current, {
      duration: 0.25,
      morphSVG: { shape: LOADING_D },
      ease: "power2.inOut",
      overwrite: "auto",
    });
    gsap.to(heartSvgRef.current, {
      rotate: 360,
      transformOrigin: "50% 50%",
      duration: 1.1,
      repeat: -1,
      ease: "none",
      overwrite: "auto",
    });
  };

  const finishRequestAnimation = (isActive) => {
    gsap.killTweensOf(heartSvgRef.current);
    gsap.set(heartSvgRef.current, { rotate: 0 });
    gsap.to(heartPathRef.current, {
      duration: 0.25,
      morphSVG: { shape: HEART_D },
      ease: "power2.inOut",
      overwrite: "auto",
    });
    gsap.fromTo(
      heartSvgRef.current,
      { scale: 1, transformOrigin: "50% 50%" },
      {
        scale: isActive ? 1.15 : 1.05,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power1.out",
        overwrite: "auto",
      },
    );
  };

  const onHeartClick = async () => {
    if (loading || !heartPathRef.current || !heartSvgRef.current) return;

    const nextActive = !active;
    const endpoint = `${URL}/manga/user/favorites/${mangaId}`;

    setLoading(true);
    startLoadingAnimation();

    let resolvedActive = active;

    try {
      if (nextActive) {
        await axios.post(endpoint, {}, { withCredentials: true });
      } else {
        await axios.delete(endpoint, { withCredentials: true });
      }
      resolvedActive = nextActive;
      setActive(nextActive);
      setError?.(false);
    } catch (err) {
      console.log("err on posting heart", err?.response?.data || err);
      setError?.(true);
    } finally {
      setLoading(false);
      finishRequestAnimation(resolvedActive);
    }
  };

  return (
    <svg

      ref={heartSvgRef}
      onClick={onHeartClick}
      className={`${styles.svg_heart} ${active ? styles.heart_active : ""}`}
      role="button"
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={iconSize}
      height={iconSize}
    >
      <path
        ref={heartPathRef}
        d={HEART_D}
      />
    </svg>
  );
}
