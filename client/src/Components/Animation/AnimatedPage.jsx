/**
 * AnimatedPage Component
 * 
 * This is a wrapper that adds entrance and exit animations to any page.
 * Wrap your page content with this component to get smooth transitions.
 * 
 * Usage (default animation):
 *   <AnimatedPage>
 *     <YourPageContent />
 *   </AnimatedPage>
 * 
 * Usage (custom animation):
 *   import { fadeScale } from './pageAnimations';
 *   <AnimatedPage variants={fadeScale}>
 *     <YourPageContent />
 *   </AnimatedPage>
 * 
 * How it works:
 * 1. When the page mounts, it animates from 'initial' to 'animate' state
 * 2. When navigating away, it animates to 'exit' state
 * 3. AnimatePresence (in RootLayout) coordinates the timing
 */

import { motion } from 'framer-motion';
import { fadeSlideUp } from './pageAnimations.js';

/**
 * AnimatedPage Component
 * 
 * @param {object} props
 * @param {React.ReactNode} props.children - The page content to animate
 * @param {string} props.className - Optional CSS class to apply
 * @param {object} props.variants - Optional custom animation variants
 *                                  (defaults to fadeSlideUp)
 */
export function AnimatedPage({
    children,
    className = '',
    variants = fadeSlideUp
}) {
    return (
        <motion.div
            className={className}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={variants.transition}
        >
            {children}
        </motion.div>
    );
}
