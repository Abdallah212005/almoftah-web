import { PropertyDetailClient } from './property-detail-client';

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 */
export async function generateStaticParams() {
  // Return an empty array or pre-defined list of IDs for the static build
  return [{ id: 'placeholder' }];
}

export default async function PropertyDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  
  return <PropertyDetailClient id={id} />;
}
