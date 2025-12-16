/**
 * NotFound (404) Page
 * 
 * This page is shown when the user visits a URL that doesn't match
 * any of our defined routes. It provides a friendly message and
 * a way to get back to the home page.
 */

import { Link } from 'react-router';
import styles from './NotFound.module.css';

export function NotFound() {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                {/* Big 404 number for visual impact */}
                <h1 className={styles.code}>404</h1>

                {/* Friendly message */}
                <h2 className={styles.title}>Page Not Found</h2>
                <p className={styles.message}>
                    Oops! The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Link back to safety */}
                <Link to="/" className={styles.homeLink}>
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}
