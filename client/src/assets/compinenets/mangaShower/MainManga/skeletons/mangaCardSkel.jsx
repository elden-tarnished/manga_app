import { useRef } from 'react';
import '../css/mangaCardSkel.css';
import { useGSAP } from '@gsap/react';

export function MangaCardSkel() {
  const cardRef = useRef();
  const titleRef = useRef()

  useGSAP(() => {
    gsap.timeline()
    .to(cardRef.current, {
      backgroundPosition: '200% 100%',

      duration: 1.6,
      repeat:-1,
      ease: 'power1.inOut',

    })
    .to(titleRef.current, {
      backgroundPosition: '200% 100%',
    
      duration: 1.6,
      repeat:-1,
      ease: 'power1.inOut',
    }, 0)
  })
  return(
    <div ref={cardRef} className='card--skel'>
      <div ref={titleRef} className='title--skel'></div>
    </div>
  )
}