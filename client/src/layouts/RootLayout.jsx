import { useEffect, useRef, useState } from 'react';
import { useOutlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Footer } from '../components/Footer/Footer.jsx';
import { IsMobileProvider, useIsMobile } from '../components/SmallComponents/IsMobileProvider.jsx';
import { AppErrorProvider, useAppError } from '../Context/AppErrorContext.jsx';
import styles from './RootLayout.module.css';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';


// COMMENTING OUT OLD TRANSITION AS REQUESTED
// const pageTransition = {
//   initial: {
//     opacity: 0,
//   },
//   animate: {
//     opacity: 1,
//     y: 0,
//     transition: {
//       duration: 0.3,
//       ease: 'easeOut'
//     }
//   },
//   exit: {
//     x: 100,
//     opacity: 0,
//     transition: {
//       duration: 0.2,
//       ease: 'easeIn'
//     }
//   }
// };

const expandTransition = {
  initial: {
    scaleX: 1,
    transformOrigin: 'right'
  },
  enter: (i) => ({
    scaleX: 0,
    transformOrigin: 'right',
    transition: {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1],
      delay: 0.05 * i,
    },
  }),
  exit: (i) => ({
    scaleX: 1,
    transformOrigin: 'left',
    transition: {
      duration: 0.8,
      ease: [0.76, 0, 0.24, 1],
      delay: 0.05 * i,
    },
  }),
};

function LayoutContent() {
  const location = useLocation();
  const isMobile = useIsMobile()
  const currentOutlet = useOutlet();
  const { errorState, clearGlobalError } = useAppError();

  const isAuthPage = ['/'].includes(location.pathname);

  const errorRef = useRef(null)
  useGSAP(() => {
    console.log("current: ", errorState.error)
    if (!errorState.error) return;

    gsap.timeline()
      .fromTo(errorRef.current, {
        y: -50,
        opacity: 0,
        scale: 0.8,
      }, {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: 'back.out',
      })
      .to(errorRef.current, {
        y: -50,
        opacity: 0,
        onComplete: () => clearGlobalError(),
      }, "+=4") // Start after a 2 second delay
  }, { dependencies: [errorState.error] })

  const onClickError = () => {
    gsap.to(errorRef.current, {
      y: -50,
      opacity: 0,
      onComplete: () => clearGlobalError(),
    })
  }

  return (
    <div className={styles.layout}>
      {(errorState.error) && (
        <div
          onClick={onClickError}
          className={styles.globalError}
          role="alert" aria-live="assertive"
          ref={errorRef}
        >
          <p className={styles.globalErrorText}>{errorState.message}</p>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.main
          className={styles.main}
          key={location.pathname}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {/* 
              TRANSITION OVERLAY 
              This creates the 10 sliding divs.
              - Fixed position to cover screen.
              - High z-index to be on top.
              - Pointer events none to not block clicks when hidden (though scaleX:0 handles that visually).
            */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'row'
          }}>
            {
              [...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={expandTransition}
                  style={{
                    //height: `${100 / 10 + 0.5}vh`, // Slightly more than 10% to prevent gaps
                    width: '100%',
                    height: '100%',
                    //width: `${100 / 5 + 0.5}vw`, // Slightly more than 10% to prevent gaps
                    //marginTop: i === 0 ? 0 : '-0.5vh', // Pull them up slightly to overlap
                    backgroundColor: 'black',
                  }}
                />
              ))
            }
          </div>

          {/* Render the captured element instead of the live <Outlet /> */}
          {currentOutlet}
        </motion.main>
      </AnimatePresence>
      {isAuthPage && <Footer />}
    </div>
  );
}

export function RootLayout() {
  return (
    <IsMobileProvider breakpoint={768}>
      <AppErrorProvider>
        <LayoutContent />
      </AppErrorProvider>
    </IsMobileProvider>
  );
}
export function AuthenticationLayout() {
  const location = useLocation()
  const currentOutlet = useOutlet()
  return (
    <AnimatePresence mode='wait'>
      <motion.div
        key={location.pathname}
        // variants={pageTransition} // Commented out to match style, though mostly focused on RootLayout
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {currentOutlet}
      </motion.div>
    </AnimatePresence>
  )
}
