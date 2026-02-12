import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './ItemLoading.module.css';
import itemStyles from './Item.module.css'; // Import Item styles for layout matching

export default function ItemLoading({ setItemLoaded, currentId, itemLoaded, transitionalImage, isCurrentIdFromCard }) {
  const loadingRef = useRef(null);
  const dotBefore = useRef([]);
  const dotAfter = useRef([]);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const lastId = useRef(-2);

  const tlLoading = useRef(null);
  const tlContainer = useRef(null);
  const tlOut = useRef(null);

  useGSAP(() => {
    tlContainer.current = gsap.timeline({ paused: false });
  }, { dependencies: [] })
  useGSAP(() => {
    lastId.current = currentId
    if (currentId === -1) {
      tlContainer.current?.to(containerRef.current, {
        y: -50,
        opacity: 0,
        onComplete: () => gsap.set(containerRef.current, { display: "none" }),
      })
      return;
    }

    // Reset initial states
    if (tlContainer.current && currentId !== lastId.current && itemLoaded !== false) {
      tlContainer.current.to(containerRef.current, {
        y: 50,
        opacity: 0,
      })
    }


    const delay = 0.2
    tlContainer.current
      .to(containerRef.current, {
        onStart: () => { gsap.set(containerRef.current, { display: "flex" }); },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });



    // Always run the dot loading animation
    tlLoading.current?.revert()
    tlLoading.current = gsap.timeline({
      paused: false,
      onStart: () => { gsap.set([dotAfter.current, dotBefore.current], { height: 5 }); },
      defaults: {
        ease: "power3.out"
      }
    });
    [dotBefore.current, dotAfter.current].forEach((dotGroup) => {
      tlLoading.current.fromTo(dotGroup,
        {
          height: 5,
        },
        {
          height: 20,
          stagger: {
            yoyo: true,
            amount: 6,
            repeat: -1,
            ease: "power1.out",
          },
          duration: 0.8
        }, delay)
    })


  }, { dependencies: [currentId] }); // Re-run when ID or image changes

  useGSAP(() => {
    if (itemLoaded && isCurrentIdFromCard) {
      tlContainer.current
        .to(containerRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            gsap.set(containerRef.current, { display: "none" });
          }
        },)
      return;
    }
    if (itemLoaded) {
      tlContainer.current
        .to(containerRef.current, {
          y: 50,
          opacity: 0,
          duration: 0.5,
          onComplete: () => {
            gsap.set(containerRef.current, { display: "none" });
          }
        },)
    }
  }, { dependencies: [itemLoaded, currentId] })

  const length = 30;
  // Helper to fill refs
  const dots = (position, ref) => Array.from({ length: length }, (_, i) => {
    return position === "after" ?
      <span key={i} ref={(el) => ref.current[i] = el} className={styles.dot}></span> :
      <span key={length + i} ref={(el) => ref.current[length - 1 - i] = el} className={styles.dot}></span>
  });

  const arrBefore = dots("before", dotBefore);
  const arrAfter = dots("after", dotAfter);

  return (
    <div ref={containerRef} className={styles.container}>

      <div className={styles.dotsContainer}>
        {arrBefore}
        <div className={styles.itemLoading}>
          <h3 className={styles.loading} ref={loadingRef}>Loading </h3>
        </div>
        {arrAfter}
      </div>
    </div>
  );
}
