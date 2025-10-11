import styles from './css/filterSkel.module.css';
import {useRef} from "react";
import gsap from "gsap";
import {useGSAP} from "@gsap/react";

export function FilterSkel() {

  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);
  useGSAP(() => {
    const tl = gsap.timeline()
      .to([ref1.current, ref2.current, ref3.current], {
      backgroundPositionX: '0%',
      duration: 1.5,
      ease: 'none',
      repeat: -1,
    })
    tl.play();
  })
  return (
    <div className={styles.filter__container}>
      <button className={styles.filter__expand}>exp</button>
      <div className={styles.order__container} ref={ref3}></div>
      <div className={styles.direction__container} ref={ref2}></div>
      <div className={styles.limit__container} ref={ref1}></div>
    </div>
  )
}