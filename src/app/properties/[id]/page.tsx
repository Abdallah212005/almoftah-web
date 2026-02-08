import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * By setting dynamicParams = false, we tell Next.js to only generate the paths
 * provided in generateStaticParams.
 */
export const dynamicParams = false;

/**
 * Generates the static paths for the properties detail page.
 * For a static export, we must provide at least one valid path.
 */
export async function generateStaticParams() {
  // In a real build, you might fetch IDs from Firestore here.
  // For the export to succeed without data, we provide a placeholder.
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
