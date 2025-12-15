import { useMemo, useRef } from 'react'
import styles from './Footer.module.css'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { SplitText } from 'gsap/SplitText'
import { useIsMobile } from '../SmallComponents/IsMobileProvider.jsx'

export function Footer() {
  gsap.registerPlugin(SplitText)
  const year = new Date().getFullYear()

  const contactRef = useRef([])
  const footerAndYear = useRef(null)
  const githubRef = useRef(null)
  const telegramRef = useRef(null)
  const incremt = useRef(0)
  const isMobile = useIsMobile()

  const anchorTagAnimation = useRef(null)
  const inTl = useRef(null)
  const outTl = useRef(null)

  function hexToRgba(hexColor, opacity) {
    let hex = hexColor.replace('#', '')
    if (hexColor.length < 4) {
      hex = hexColor.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b}, ${opacity})`;
  }


  function buildCopySpans(times, content, ref, hexEndColor) {
    if (isMobile) return

    const contentClass = content.split(' ').join('')
    const classname = `${contentClass}_copy`


    return Array.from({ length: times }, (_, i) => {
      let color = hexEndColor
      if ((i % 2) === 0) color = '#dcc5b2'
      return (<span key={`block-${i}`} ref={(el) => ref.current[i] = el} style={{ zIndex: `${(90 - i)}`, color: hexToRgba(color, (times - i) / times) }} className={`${styles.copy} footer${contentClass} ${styles[classname]}`}>{content}</span>)
    })
  }

  const contactCopy = useMemo(() => buildCopySpans(20, 'Contact Me', contactRef, '#faf7f3'), [])

  const { contextSafe } = useGSAP(() => {

  }, { scope: footerAndYear })

  const onMouseOverAnchorTag = contextSafe((itemToAnimateRef) => {
    const split = SplitText.create(itemToAnimateRef.current, { type: 'chars' })
    anchorTagAnimation.current = gsap.timeline({ paused: true })
      .to(split.chars, {
        stagger: 0.05,
        ease: 'power2.out',
        scale: 1.6,
        fontWeight: 500,
        marginRight: 8,
        duration: 0.3
      })
    anchorTagAnimation.current.play()
  })
  const onMouseLeaveAnchorTag = contextSafe(() => {
    anchorTagAnimation.current.reverse()
  })

  const onMouseEnter = contextSafe(() => {
    gsap.to('.footerContactMe', {
      x: (i) => (i + 1),
      // y: (i) => (i + 1) * 1,
      scale: (i) => 0.001 * (i + 1) + 1,
      opacity: 1,
      stagger: {
        each: 0.015,
        ease: 'power1.out'
      },
      rotate: (i) => i + 1,
      ease: 'power3.out'
    })
  })
  const onMouseLeave = contextSafe(() => {
    gsap.to('.footerContactMe', {
      x: 0,
      opacity: 0,
      stagger: 0.03,
      scale: 0.6,

      rotate: (i) => (30 - i + 1),
      ease: 'power3.in',

    })
  })
  return (
    <div className={styles.footerAndYear} ref={footerAndYear}>
      <div className={styles.footer__container}>
        <div className={styles.contacts__container}>
          <a className={styles.contact} href=''
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          ><span className={styles.contactHidden}>Contact Me</span><span className={styles.contactSpan}>Contact Me</span> {contactCopy}</a>
          <a href=''
            className={styles.anchor_animation}
            ref={telegramRef}
            onMouseEnter={() => onMouseOverAnchorTag(telegramRef)}
            onMouseLeave={() => onMouseLeaveAnchorTag(telegramRef)}
          >
            Telegram
          </a>
          <a href=''
            className={styles.anchor_animation}
            ref={githubRef}
            onMouseEnter={() => onMouseOverAnchorTag(githubRef)}
            onMouseLeave={() => onMouseLeaveAnchorTag(githubRef)}
          >
            Github
          </a>
        </div>
      </div>
      <div className={styles.footContainer} >
        <p className={styles.year}>© {year} siteName?</p>
        <div className=''>
          <p className={styles.p}>all rights reserved. manga data courtesy of myanimelist.net—used under their terms. this is an unofficial fan site.</p>
          <div className={styles.terms}>
            <a href="">DMCA</a>
            <a href="">Privacy</a>
            <a href="">Terms</a>
          </div>
        </div>
      </div>
    </div >
  )
};
