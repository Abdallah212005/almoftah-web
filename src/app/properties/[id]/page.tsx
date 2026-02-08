import { PropertyDetailClient } from './property-detail-client';

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * This ensures the build process can generate the static HTML files for these routes.
 */
export async function generateStaticParams() {
  // We provide a placeholder ID so the static build succeeds.
  // Real property IDs are handled dynamically on the client side via Firestore.
  return [{ id: 'placeholder' }];
}

export default async function PropertyDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return <PropertyDetailClient id={id} />;
}
