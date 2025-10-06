import { useGSAP } from '@gsap/react';
import './css/button.css'
import { useContext, useRef } from 'react';

export function FilterButton({value, selectedValues, setter, filterType}) {
  let isSelected = false ;
  if (Array.isArray(selectedValues)){
    isSelected = selectedValues.includes(value);
  } 
  if (selectedValues===value) {
    isSelected = true
  }
  const buttonRef = useRef(null);
  const tl = useRef(null);


    // func
  function RandomNumGenretator(min, max, excludeMin, excludeMax, snapIncrement=1) {
    const unfiltered = Array.from({length: max - min + 1}, (_, i) => min + i)
    const excluded = Array.from({length: excludeMax - excludeMin + 1}, (_, i) => i + excludeMin);
    const filtered = unfiltered.filter(e => !(excluded.includes(e)))
    const snapped = filtered.filter(e => (e - min) % snapIncrement === 0)
    return gsap.utils.random(snapped);
  }
    // func

  const {contextSafe} = useGSAP(() => {
    // const bgColor = buttonRef.current.getComputedStyle().backgroundColor;

    const timeline = gsap.timeline({paused: true});
    timeline
    .to(buttonRef.current, {
      backgroundColor: 'black',
      color: 'white',
      duration: 0.2
    })
    .to(buttonRef.current, {
      rotate: RandomNumGenretator(-10, 10, -3, 3),
      duration: 0.4,
      ease: 'back.out'
    }, '+=-0.1')
    .to(buttonRef.current, {
      duration: 0.2,
      ease: 'power1',
      borderRadius: '5px',
      scale: 1.05,
    }, '<')

    tl.current = timeline;
  }, {scope: buttonRef})

  const onMouseEnter = contextSafe(() => {
    tl.current.play();
  });
  const onMouseLeave = contextSafe(() => {
    tl.current.timeScale(2).reverse();
  })


  const onClick = () => {
    setter(prev => {
      if (Array.isArray(prev)) {
        if (prev.includes(value)) {
          return prev.filter(e => e!==value)
        } else {
          return [...prev, value]
        }
      }
      if (typeof prev==='string' || typeof prev==='number') {  
        return value;  
      }
    })
  }
  const formatName = () => {
    if (typeof value === 'string'){
      if (value === 'one_shot') return value.replace('_', '-');
        return value.replace('_', ' ');
    }
    return value;  
  }
  const displayLabel = formatName();

  return(
    <button className={`btn ${filterType} ${isSelected? 'active': ''}`} 
    onClick={onClick} 
    onMouseEnter={onMouseEnter}
    onMouseLeave={onMouseLeave} 
    ref={buttonRef}>{displayLabel}</button>
  )
}