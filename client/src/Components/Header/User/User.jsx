import { useRef } from "react";
import { useNavigate } from "react-router";
import { useIsMobile } from "../../SmallComponents/IsMobileProvider.jsx";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import styles from "./User.module.css";

const MENU_ROUTES = {
  0: '/login',    // First item navigates to login
  1: '/signup',   // Second item navigates to signup
  2: '/profile',  // Third item navigates to profile (we'll add this route later)
};

export function UserIcon() {
  const navigate = useNavigate();

  const circle = useRef(null)
  const rects = useRef([])
  const rect = useRef(null)
  const background = useRef(null)

  const tlIn = useRef(null)
  const tlHover = useRef(null)

  const isMobile = useIsMobile()
  const { contextSafe } = useGSAP(() => {
    if (!rects.current) return
    gsap.set(rects.current, { scale: 0.2, marginTop: -24, y: 12, rotate: 0 })
    const toAnimate = gsap.utils.toArray(rects.current)
    tlIn.current = gsap.timeline({ paused: true })
      .to(circle.current, {
        scale: 5.1,
        y: 10,
        ease: 'power3.out',
      })
      .to(rect.current, {
        y: 70
      }, 0.2)
      .to(toAnimate, {
        x: () => isMobile ? -25 : 0
      }, 0)
      .to(toAnimate, {
        y: (i) => i * 34,
        scale: 1,
        ease: 'back.out',
        stagger: 0.1,
        borderRadius: 10,
        pointerEvents: 'all',
        color: 'white',
      }, 0)
      .fromTo(background.current, {
        opacity: 0,
      }, {
        opacity: 1,
        duration: 0.3
      }, 0.1)


    tlHover.current = gsap.timeline({ paused: true })
      .to(rect.current, { scaleY: 1.2, ease: 'power3.out' })
  }, { dependencies: [isMobile] })

  const onClick = contextSafe(() => {
    if (tlIn.current.progress() > 0) {
      tlIn.current.timeScale(2).reverse()
      return
    }
    tlIn.current.timeScale(1).play(0);
  })
  const onHoverIn = contextSafe((e) => {
    console.log('hellnah')
    if (tlIn.current.progress() === 1) {
      gsap.to(e.currentTarget, {
        scale: 1.1,
        duration: 0.1,
        fontWeight: 900
      })
    }
  })
  const onHoverOut = contextSafe((e) => {
    if (tlIn.current.progress() === 1) {
      gsap.to(e.currentTarget, {
        scale: 1,
        duration: 0.1,
        fontWeight: 400
      })
    }
  })

  /**
   * Handles clicking on a menu item
   * @param {number} index - Which menu item was clicked (0, 1, or 2)
   * @param {Event} e - The click event
   */
  const onMenuItemClick = (index) => {
    if (!rects.current[index]) return
    const destination = MENU_ROUTES[index];
    const toAnimate = gsap.utils.toArray(rects.current)
    if (destination) {
      gsap.to(toAnimate, {
        scale: 1,
        duration: 0.1,
        fontWeight: 400,
        onComplete: () => {
          tlIn.current.timeScale(1.5).reverse()
        }
      })

      navigate(destination);
    }
  };

  return (
    <div className={styles.user__container}
    >
      <div className={styles.click} onClick={onClick}></div>
      <div className={styles.circle} ref={circle}></div>
      <div className={styles.rects} ref={rect}>
        {[0, 1, 2].map((_, i) => {
          const text = i === 0 ? "login" : i === 1 ? "signUP" : "profile"
          return (<button
            className={`${styles.rect} ${styles[`rect${i}`]} rectUser`} key={i}
            ref={(el) => rects.current[i] = el}
            onMouseEnter={onHoverIn}
            onMouseLeave={onHoverOut}
            onClick={() => onMenuItemClick(i)}
            role="button"
            tabIndex={0}
          >{text}</button>)
        })}
      </div>
      <div className={styles.background} ref={background}></div>
    </div>
  )
}
