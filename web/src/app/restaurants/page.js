import { Suspense } from 'react';
import RestaurantsClient from './RestaurantsClient';
import styles from './page.module.css';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function LoadingSkeleton() {
    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div>
                        <h1>Restaurants</h1>
                        <p>Loading...</p>
                    </div>
                </div>
                <div className={styles.grid}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.skeletonCard}>
                            <div className={styles.skeletonImage}></div>
                            <div className={styles.skeletonContent}>
                                <div className={styles.skeletonTitle}></div>
                                <div className={styles.skeletonText}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function RestaurantsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <RestaurantsClient />
        </Suspense>
    );
}
