import { useRef } from 'react'
import styles from './footer.module.css'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import ScrambleTextPlugin from 'gsap/ScrambleTextPlugin'

export function Footer() {
  gsap.registerPlugin(ScrambleTextPlugin)
  const year = new Date().getFullYear()

  const contactRef = useRef([])
  const footerAndYear = useRef(null)
  const telegramRef = useRef(null)
  const telegramAnimRef = useRef(null)
  const githubRef = useRef(null)
  const githubAnimRef = useRef(null)


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


  function spanmaker(times, content, ref, hexEndColor) {

    const contentClass = content.split(' ').join('')
    console.log(content)

    const classname = `${contentClass}_copy`


    return Array.from({ length: times }, (_, i) => {
      let color = hexEndColor
      if ((i % 2) === 0) color = '#dcc5b2'
      return (<span key={`block-${i}`} ref={(el) => ref.current[i] = el} style={{ zIndex: `${(90 - i)}`, color: hexToRgba(color, (times - i) / times) }} className={`${styles.copy} footer${contentClass} ${styles[classname]}`}>{content}</span>)
    })
  }

  const contactcopy = spanmaker(20, 'Contact Me', contactRef, '#faf7f3')

  const { contextSafe } = useGSAP(() => {
    const insetTl =
      gsap.timeline()
        .to(telegramRef.current, {
          clipPath: 'inset(0 0% 0 0%)',
          duration: 0.8
        })
    const inTl = gsap.timeline()
      .to(telegramAnimRef.current, {
        color: 'black',
        scrambleText: {
          text: '{original}',
          chars: 'lowercase',
          speed: 5,
        },
        duration: 1,
        ease: 'power1.out'
      }, 0)

    const outTl =
      gsap.timeline()
        .to(telegramRef.current, {
          clipPath: 'inset(0 0% 0 100%)',
          onComplete: () => gsap.set(telegramRef.current, { clipPath: 'inset(0 100% 0 0%)' })
        })
        .to(telegramAnimRef.current, {
          color: 'white'
        }, 0)

  }, { scope: footerAndYear })

  const onMouseOverKPR = contextSafe(() => {

  })
  const onMouseLeaveKPR = contextSafe(() => {

  })

  const onMouseEnter = contextSafe(() => {
    gsap.to('.footerContactMe', {
      x: (i) => (i + 1) * 1,
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
          ><span className={styles.contactHidden}>Contact Me</span><span className={styles.contactSpan}>Contact Me</span> {contactcopy}</a>
          <a href=''
            className={styles.animation__container}
            onMouseOver={onMouseOverKPR}
            onMouseLeave={onMouseLeaveKPR}
          >
            <span className={styles.space} ref={telegramRef}>telegram</span>
            <span className={styles.animation} ref={telegramAnimRef}>telegram</span>
          </a>
          <a href=''
            className={styles.animation__container}
            onMouseDown={onMouseOverKPR}
            onMouseLeave={onMouseLeaveKPR}
          >
            <span className={styles.space} ref={githubRef}>github</span>
            <span className={styles.animation} ref={githubAnimRef}>github</span>
          </a>
        </div>
      </div>
      <div className={styles.footContainer} >
        <p className={styles.year}>© {year} siteName?</p>
        <div className=''>
          <p className={styles.p}>all rights reserved. manga data courtesy of myanimelist.net—used under their terms. this is an unofficial fan site.</p>
          <div className={styles.terms}>
            <a href="">DMACA</a>
            <a href="">Privacy</a>
            <a href="">Terms</a>
          </div>
        </div>
      </div>
    </div >
  )
};
