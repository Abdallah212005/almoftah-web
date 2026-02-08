import { PropertyDetailClient } from './property-detail-client';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', all dynamic routes MUST provide parameters at build time.
 * dynamicParams MUST be false to ensure only generated paths are served.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);
    const querySnapshot = await getDocs(collection(db, 'units'));
    
    const paths = querySnapshot.docs.map((doc) => ({
      id: doc.id,
    }));
    
    // Always include a placeholder to ensure the route is valid even if DB is empty during build
    return paths.length > 0 ? paths : [{ id: 'placeholder' }];
  } catch (error) {
    console.warn('Could not fetch static params from Firestore, using placeholder.', error);
    return [{ id: 'placeholder' }];
  }
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  // Next.js 15: params must be awaited
  const { id } = await params;
  
  return <PropertyDetailClient id={id} />;
}
