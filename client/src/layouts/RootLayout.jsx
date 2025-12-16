
import { useOutlet, useLocation } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from '../Components/Header/Header.jsx';
import { Footer } from '../Components/Footer/Footer.jsx';
import { IsMobileProvider } from '../Components/SmallComponents/IsMobileProvider.jsx';
import styles from './RootLayout.module.css';

const pageTransition = {
  initial: {
    opacity: 0,
    y: 0// Start 20 pixels below final position
  },

  animate: {
    opacity: 1,
    y: 0,
    // Transition config for the entrance animation
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },

  exit: {
    opacity: 0,
    y: -20,  // Slide up as it fades out
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export function RootLayout() {
  /**
   * useLocation Hook
   * 
   * This hook returns an object describing the current URL:
   * {
   *   pathname: "/login",    // The path part of the URL
   *   search: "?foo=bar",    // Query string
   *   hash: "#section",      // Hash fragment
   *   key: "abc123"          // Unique key for this location
   * }
   * 
   * We use the pathname as a "key" for AnimatePresence.
   * When the key changes, AnimatePresence knows the content changed
   * and triggers exit/entrance animations.
   */
  const location = useLocation();

  /**
   * THE FINAL FIX: useOutlet()
   * 
   * Problem: <Outlet /> is a "live" component. It always renders the CURRENT route.
   * When we transition from "/" to "/login":
   * 1. AnimatePresence keeps the old page alive to animate it out.
   * 2. But inside that old page, <Outlet /> sees the URL is now "/login".
   * 3. So the "exiting" page instantly switches its content to the new page!
   * 
   * Solution: useOutlet() captures the component for the route *at that moment*.
   * When AnimatePresence freezes the old page, it freezes the *value* of this variable.
   * So the old page keeps showing the old content while it exits.
   */
  const currentOutlet = useOutlet();

  return (
    <IsMobileProvider brealpoint={768}>
      <div className={styles.layout}>
        <Header />
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
        <Footer />
      </div>
    </IsMobileProvider>
  );
}
