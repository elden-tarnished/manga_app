/**
 * Page Animation Variants
 * 
 * This file contains reusable animation configurations for page transitions.
 * Import the variant you want and pass it to AnimatedPage.
 * 
 * Usage:
 *   import { fadeSlideUp, fadeScale } from './pageAnimations';
 *   <AnimatedPage variants={fadeSlideUp}>...</AnimatedPage>
 */

/**
 * Fade + Slide Up
 * 
 * The default animation. Page fades in while sliding up from below.
 * Good for most content pages.
 */
export const fadeSlideUp = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
    },
    exit: {
        opacity: 0,
        y: -20,
    },
    transition: {
        duration: 0.3,
        ease: 'easeInOut',
    },
};

/**
 * Fade + Scale
 * 
 * Page fades in while scaling up from 95% to 100%.
 * Creates a subtle "zoom in" effect. Good for modal-like pages.
 */
export const fadeScale = {
    initial: {
        opacity: 0,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        scale: 1,
    },
    exit: {
        opacity: 0,
        scale: 0.95,
    },
    transition: {
        duration: 0.25,
        ease: 'easeOut',
    },
};

/**
 * Slide from Right
 * 
 * Page slides in from the right side.
 * Good for "forward" navigation (going deeper into content).
 */
export const slideFromRight = {
    initial: {
        opacity: 0,
        x: 100,  // Start 100px to the right
    },
    animate: {
        opacity: 1,
        x: 0,
    },
    exit: {
        opacity: 0,
        x: -100,  // Exit to the left
    },
    transition: {
        duration: 0.3,
        ease: 'easeInOut',
    },
};

/**
 * Slide from Left
 * 
 * Page slides in from the left side.
 * Good for "back" navigation (going back to previous content).
 */
export const slideFromLeft = {
    initial: {
        opacity: 0,
        x: -100,
    },
    animate: {
        opacity: 1,
        x: 0,
    },
    exit: {
        opacity: 0,
        x: 100,
    },
    transition: {
        duration: 0.3,
        ease: 'easeInOut',
    },
};

/**
 * Simple Fade
 * 
 * Just a fade with no movement. Very subtle and professional.
 * Good when you don't want to draw attention to the transition.
 */
export const simpleFade = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
    },
    exit: {
        opacity: 0,
    },
    transition: {
        duration: 0.2,
        ease: 'easeInOut',
    },
};

/**
 * Staggered Fade
 * 
 * For pages with multiple sections that should animate in sequence.
 * Use this as the parent, and add staggerChildren to animate
 * child elements one by one.
 * 
 * Example:
 *   <motion.div variants={staggerContainer}>
 *     <motion.div variants={staggerItem}>Section 1</motion.div>
 *     <motion.div variants={staggerItem}>Section 2</motion.div>
 *   </motion.div>
 */
export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,  // Each child animates 0.1s after the previous
        },
    },
    exit: {},
};

export const staggerItem = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
        },
    },
    exit: {
        opacity: 0,
        y: -10,
        transition: {
            duration: 0.2,
        },
    },
};
