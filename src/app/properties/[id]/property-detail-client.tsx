'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { MapPin, Bed, Bath, Square } from 'lucide-react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Separator } from '@/components/ui/separator';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import type { Unit } from '@/lib/definitions';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'next/navigation';

function PropertyDetailSkeleton() {
    return (
         <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <Card className="overflow-hidden">
                    <CardContent className="p-0">
                        <Skeleton className="aspect-[16/10] w-full" />
                    </CardContent>
                </Card>
                <Card className="mt-8">
                    <CardContent className="p-6 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-6 w-20" />
                        <Separator className="my-6" />
                        <Skeleton className="h-7 w-1/3 mb-4" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-2/3" />
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-1">
                 <Card className="sticky top-24">
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <Skeleton className="h-4 w-1/3 mb-2" />
                            <Skeleton className="h-10 w-1/2" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-1/3" />
                             <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-5 w-1/4" />
                            </div>
                             <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-5 w-1/4" />
                            </div>
                             <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-1/4" />
                                <Skeleton className="h-5 w-1/4" />
                            </div>
                        </div>
                        <Skeleton className="h-12 w-full" />
                    </CardContent>
                 </Card>
            </div>
         </div>
    );
}

export function PropertyDetailClient({ id: initialId }: { id: string }) {
  const params = useParams();
  const firestore = useFirestore();
  
  // Handle URL decoding and hydration issues
  const rawId = (params?.id as string) || initialId;
  const id = rawId ? decodeURIComponent(rawId) : null;

  // Wait for hydration and valid ID before querying
  const unitRef = useMemoFirebase(() => (firestore && id && id !== 'placeholder') ? doc(firestore, 'units', id) : null, [firestore, id]);
  const { data: unit, isLoading } = useDoc<Unit>(unitRef);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12">
        <PropertyDetailSkeleton />
      </div>
    );
  }

  if (!unit || id === 'placeholder') {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground">Property not found</h1>
        <p className="text-muted-foreground mt-2">The property you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Carousel className="w-full">
                <CarouselContent>
                  {unit.photos.map((photo, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-[16/10] bg-muted relative">
                        <Image
                          src={photo.url}
                          alt={`${unit.title} - view ${index + 1}`}
                          fill
                          className="object-cover"
                          data-ai-hint={photo.hint}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </CardContent>
          </Card>
          <Card className="mt-8">
            <CardContent className="p-6">
              <h1 className="text-3xl font-bold font-headline mb-2">{unit.title}</h1>
              <div className="flex items-center text-muted-foreground text-md mb-4">
                <MapPin className="w-5 h-5 mr-2" />
                <span>{unit.city}, {unit.governorate}</span>
              </div>
              <Badge variant="secondary" className="text-sm">{unit.category}</Badge>
              <Separator className="my-6" />
              <h2 className="text-2xl font-bold font-headline mb-4">Description</h2>
              <p className="text-foreground/80 leading-relaxed">{unit.description}</p>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-6">
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p className="text-4xl font-bold text-primary">{formatPrice(unit.price)}</p>
              </div>

              <div className="space-y-4 text-foreground mb-6">
                <h3 className="font-semibold text-lg">Property Details</h3>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-muted-foreground"><Bed className="w-5 h-5 mr-3"/>Bedrooms</span>
                  <span className="font-medium">{unit.bedrooms ?? 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-muted-foreground"><Bath className="w-5 h-5 mr-3"/>Bathrooms</span>
                  <span className="font-medium">{unit.bathrooms ?? 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-muted-foreground"><Square className="w-5 h-5 mr-3"/>Area</span>
                  <span className="font-medium">{unit.area ? `${unit.area} m²` : 'N/A'}</span>
                </div>
              </div>
              
              <ChatInterface unit={unit} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}