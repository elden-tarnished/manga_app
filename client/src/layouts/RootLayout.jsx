import { useOutlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Footer } from '../Components/Footer/Footer.jsx';
import { IsMobileProvider } from '../Components/SmallComponents/IsMobileProvider.jsx';
import styles from './RootLayout.module.css';


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

export function RootLayout() {
  const location = useLocation();
  const currentOutlet = useOutlet();

  const isAuthPage = ['/login', '/signup', '/profile'].includes(location.pathname);

  return (
    <IsMobileProvider breakpoint={768}>
      <div className={styles.layout}>
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
                [...Array(10)].map((_, i) => (
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
        {!isAuthPage && <Footer />}
      </div>
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
