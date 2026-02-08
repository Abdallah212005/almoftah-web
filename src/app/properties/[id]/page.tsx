import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * We set dynamicParams to false to ensure only generated paths are accessible.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  // Return at least one placeholder path for the static build process
  return [
    { id: 'placeholder' }
  ];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  // Next.js 15: params must be awaited
  const { id } = await params;
  
  return <PropertyDetailClient id={id} />;
}
