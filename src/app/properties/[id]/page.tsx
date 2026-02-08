import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * For static exports, dynamicParams MUST be false to avoid runtime errors on unknown paths.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  /**
   * We provide a placeholder to satisfy the build requirement.
   * In a production static export, you would ideally fetch all unit IDs from Firestore here.
   */
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
