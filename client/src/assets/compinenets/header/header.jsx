import { SearchBar } from "./searchbar/SearchBar"
import { useRef } from "react"
import { useGSAP } from "@gsap/react"
import { gsap } from "gsap"
import styles from "./header.module.css"
import {useIsMobile} from "../smallComponents/IsMobileProvider.jsx";
export function UserIcon() {
  const circle = useRef(null)
  const rects = useRef([])
  const rect = useRef(null)
  const background = useRef(null)

  const tlIn = useRef(null)
  const tlOut = useRef(null)
  const tlHover = useRef(null)

  const isMobile = useIsMobile()
  const { contextSafe } = useGSAP(() => {
    console.log('iiismobile', isMobile)
    if (!rects.current) return
    gsap.set(rects.current, {scale: 0.2,  marginTop: -24, y: 12, rotate: 180})
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
        rotate: 0,
        ease: 'back.out',
        stagger: 0.2,
        borderRadius: 10,
        pointerEvents: 'all',
        color: 'white'
      }, 0)
      .fromTo(background.current, {
        opacity: 0,
      },{
        opacity: 1,
        duration: 0.3
      } ,0.1)


    tlHover.current = gsap.timeline({paused: true})
      .to(rect.current, {scaleY: 1.2, ease: 'power3.out'})
  }, {dependencies: [isMobile]})

  const onClick = contextSafe(() => {
    if (tlIn.current.progress() > 0 ) {
      tlIn.current.reverse()
      return
    }
    tlIn.current.play(0)
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
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.1,
      fontWeight: 400
    })
  })

  return (
    <div className={styles.user__container}
    >
      <div className={styles.click} onClick={onClick}></div>
      <div className={styles.circle} ref={circle}></div>
      <div className={styles.rects} ref={rect}>
        {[0, 1, 2].map((_, i) => {
          const text = i === 0 ? "login" : i === 1 ? "signUP" : "profile"
          return (<div
            className={`${styles.rect} ${styles[`rect${i}`]}`} key={i}
            ref={(el) => rects.current[i] = el}
            onMouseEnter={onHoverIn}
            onMouseLeave={onHoverOut}
          ><span >{text}</span></div>)
        })}
      </div>
      <div className={styles.background} ref={background}></div>
    </div>
  )
}
export function Header() {
  return (
    <div className={styles.header__container}>
      <div className={styles.searchBar}>
        <SearchBar />
      </div>
      <div className={styles.user}><UserIcon /></div>
    </div>
  )
}
