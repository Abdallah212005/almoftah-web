import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', all dynamic routes MUST provide parameters at build time.
 * dynamicParams MUST be false to ensure only generated paths are served.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  /**
   * We provide a placeholder to satisfy the build requirement for the dynamic route segment.
   * In a production environment with 'output: export', you would fetch all actual IDs here.
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
