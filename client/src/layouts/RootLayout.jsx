
import { useOutlet, useLocation } from 'react-router';
import { Outlet } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '../Components/Header/Header.jsx';
import { Footer } from '../Components/Footer/Footer.jsx';
import { IsMobileProvider } from '../Components/SmallComponents/IsMobileProvider.jsx';
import styles from './RootLayout.module.css';

const pageTransition = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export function RootLayout() {
  const location = useLocation();
  const currentOutlet = useOutlet();

  const isAuthPage = ['/login', '/signup', '/profile'].includes(location.pathname);

  return (
    <IsMobileProvider brealpoint={768}>
      <div className={styles.layout}>
        {!isAuthPage && <Header />}
        <AnimatePresence mode="wait">
          <motion.main
            className={styles.main}
            key={location.pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageTransition}
          >
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
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {currentOutlet}
      </motion.div>
    </AnimatePresence>
  )


}
