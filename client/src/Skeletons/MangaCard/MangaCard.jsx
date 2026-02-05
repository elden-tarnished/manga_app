import { useRef } from 'react';
import './MangaCard.css';

export function MangaCardSkel() {
  const cardRef = useRef(null);
  const titleRef = useRef(null)

  return (
    <div ref={cardRef} className='card--skel'>
      <div ref={titleRef} className='title--skel'></div>
    </div>
  )
}
