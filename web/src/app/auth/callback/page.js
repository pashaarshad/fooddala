import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';
import styles from './page.module.css';

// Force dynamic rendering - don't prerender this page
export const dynamic = 'force-dynamic';

function LoadingSpinner() {
    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.spinner}></div>
                <p>Loading...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AuthCallbackClient />
        </Suspense>
    );
}
