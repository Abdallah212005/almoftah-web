import { PropertyDetailClient } from './property-detail-client';

/**
 * Next.js 15 Static Export Requirement:
 * When using 'output: export', dynamic routes must provide parameters at build time.
 * dynamicParams = false ensures only the generated params are available.
 */
export const dynamicParams = false;

export async function generateStaticParams() {
  // We provide a placeholder ID so the static build succeeds.
  // Real property IDs are handled dynamically on the client side via Firestore.
  return [{ id: 'placeholder' }];
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  
  return <PropertyDetailClient id={id} />;
}
