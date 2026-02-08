import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 */
export const dynamicParams = true;

export async function generateStaticParams() {
  // Return an empty array or placeholder to satisfy the build process.
  // Since this is a client-side database, we'll handle the actual data fetching on the client.
  return [
    { id: 'placeholder' }
  ];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  // Next.js 15: params must be awaited
  const awaitedParams = await params;
  const id = awaitedParams.id;
  
  return <PropertyDetailClient id={id} />;
}
