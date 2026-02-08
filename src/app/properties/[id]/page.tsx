import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * For static exports, dynamicParams MUST be false.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  // Provide a placeholder ID to satisfy the build requirements for static export.
  // The actual property data is fetched on the client side in PropertyDetailClient.
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
