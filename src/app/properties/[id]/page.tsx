import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * dynamicParams = false ensures only the generated params are available.
 */
export const dynamicParams = false;

/**
 * Generates the static paths for the properties detail page.
 * For a static export, we must provide at least one path.
 * Real IDs are handled client-side in PropertyDetailClient.
 */
export async function generateStaticParams() {
  return [
    { id: 'placeholder' }
  ];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  // Next.js 15: params must be awaited
  const resolvedParams = await params;
  
  return <PropertyDetailClient id={resolvedParams.id} />;
}
