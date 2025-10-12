import { useRef } from 'react';
import './css/mangaCardSkel.css';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export function MangaCardSkel(props) {
  const {color} = props
  const cardRef = useRef(null);
  const titleRef = useRef(null)

  useGSAP(() => {
    gsap.timeline()
    .to(titleRef.current, {
      backgroundPosition: '200% 100%',
      duration: 1.6,
      repeat:-1,
      ease: 'power1.inOut',
    }, 0)
  })
  return(
    <div ref={cardRef} className='card--skel' style={{
      backgroundImage: `linear-gradient(135deg, ${color[0]} 30%, ${color[1]} 50%, ${color[0]} 70%)`,
      backgroundPosition: '100% 0',
      backgroundSize: '600% 100%'}}>
      <div ref={titleRef} className='title--skel'></div>
    </div>
  )
}