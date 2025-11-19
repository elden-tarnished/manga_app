import { createContext, useContext, useEffect, useState } from "react";

const IsMobileContext = createContext(false)

export function IsMobileProvider({ children, brealpoint = 768 }) {

  const query = `(max-width: ${brealpoint}px)`
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mm = window.matchMedia(query)
    setIsMobile(mm.matches)

    const handleMatchMedia = () => setIsMobile(mm.matches)
    mm.addEventListener('change', handleMatchMedia)
    return () => mm.removeEventListener('change', handleMatchMedia)
  }, [query])
  console.log('is mobile in the main shit: ', isMobile)


  return (
    <IsMobileContext.Provider value={isMobile}>
      {children}
    </IsMobileContext.Provider>
  )

}

export function useIsMobile() {
  return useContext(IsMobileContext)
}
