'use client';

import { useSearchParams } from 'next/navigation';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { PropertyCard } from '@/components/property-card';
import { PropertyFilters } from '@/components/property-filters';
import type { Unit } from '@/lib/definitions';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';
import { Suspense } from 'react';

function PropertiesContent() {
  const firestore = useFirestore();
  const searchParams = useSearchParams();

  const typeFilter = searchParams.get('type');
  const categoryFilter = searchParams.get('category');
  const govFilter = searchParams.get('governorate');
  const cityFilter = searchParams.get('city');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    
    let baseQuery = collection(firestore, 'units');
    const constraints: any[] = [];

    if (typeFilter && typeFilter !== 'all') {
      constraints.push(where('type', '==', typeFilter));
    }
    if (categoryFilter && categoryFilter !== 'all') {
      constraints.push(where('category', '==', categoryFilter));
    }
    if (govFilter && govFilter !== 'all') {
      constraints.push(where('governorate', '==', govFilter));
    }
    if (cityFilter && cityFilter !== 'all') {
      constraints.push(where('city', '==', cityFilter));
    }
    
    if (minPrice) {
      constraints.push(where('price', '>=', Number(minPrice)));
    }
    if (maxPrice) {
      constraints.push(where('price', '<=', Number(maxPrice)));
    }

    if (constraints.length > 0) {
        return query(baseQuery, ...constraints);
    }
    return baseQuery;
  }, [firestore, typeFilter, categoryFilter, govFilter, cityFilter, minPrice, maxPrice]);

  const { data: units, isLoading } = useCollection<Unit>(unitsQuery);

  return (
    <div className="bg-background min-h-screen pb-20">
      <div className="bg-primary/5 border-b py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold mb-4 font-headline tracking-tight text-primary">Explore Properties</h1>
              <p className="text-muted-foreground text-lg">
                Showing {units?.length || 0} premium listings matching your criteria.
              </p>
            </div>
          </div>
          <div className="max-w-5xl">
            <PropertyFilters />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : units && units.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {units.map((unit) => (
              <PropertyCard key={unit.id} unit={unit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed rounded-3xl bg-muted/20">
             <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-6 opacity-40" />
             <h2 className="text-2xl font-bold mb-2">No matching properties found</h2>
             <p className="text-muted-foreground max-w-sm mx-auto">
               Try adjusting your budget or changing your location filters.
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading properties...</div>}>
      <PropertiesContent />
    </Suspense>
  );
}
