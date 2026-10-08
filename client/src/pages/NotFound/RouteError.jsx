/**
 * RouteError Page
 *
 * Shown by the router when a page component throws while rendering
 * (for example on data it did not expect). Without it, one broken card
 * replaces the whole site with React Router's developer error screen.
 */

import { useRouteError } from 'react-router';
import styles from './NotFound.module.css';

export function RouteError() {
    const error = useRouteError();
    console.error(error);

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1 className={styles.code}>Oops</h1>
                <h2 className={styles.title}>Something went wrong</h2>
                <p className={styles.message}>
                    This page hit an unexpected problem. Reloading usually helps.
                </p>
                {/* A full page load, not a router Link: it resets the broken state. */}
                <a href="/" className={styles.homeLink}>
                    ← Back to Home
                </a>
            </div>
        </div>
    );
}
