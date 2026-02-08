'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Unit } from '@/lib/definitions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Bed, Bath, Square } from 'lucide-react';

type PropertyCardProps = {
  unit: Unit;
};

export function PropertyCard({ unit }: PropertyCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const firstPhoto = unit.photos[0] || { url: 'https://picsum.photos/seed/placeholder/800/600', hint: 'property placeholder' };

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-none shadow-md">
      <CardHeader className="p-0 relative group">
        <Link href={`/properties/${unit.id}`}>
          <div className="aspect-[4/3] w-full overflow-hidden">
             <Image
              src={firstPhoto.url}
              alt={unit.title}
              width={800}
              height={600}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              data-ai-hint={firstPhoto.hint}
            />
          </div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge className="shadow-lg" variant="secondary">{unit.category}</Badge>
          <Badge className="shadow-lg bg-primary text-primary-foreground border-none">
            For {unit.type || 'Sale'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-5">
        <CardTitle className="text-xl font-headline mb-3 leading-snug">
          <Link href={`/properties/${unit.id}`} className="hover:text-primary transition-colors">
            {unit.title}
          </Link>
        </CardTitle>
        <div className="flex items-center text-muted-foreground text-sm mb-5">
          <MapPin className="w-4 h-4 mr-1 text-primary" />
          <span>{unit.city}, {unit.governorate}</span>
        </div>
        <div className="flex items-center space-x-6 text-sm text-foreground/80 border-t pt-4">
          {unit.bedrooms && (
            <div className="flex items-center">
              <Bed className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{unit.bedrooms}</span>
            </div>
          )}
          {unit.bathrooms && (
            <div className="flex items-center">
              <Bath className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{unit.bathrooms}</span>
            </div>
          )}
          {unit.area && (
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{unit.area} m²</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-5 flex justify-between items-center bg-muted/30 border-t">
        <p className="text-2xl font-bold text-primary">
          {formatPrice(unit.price)}
          {unit.type === 'Rent' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
        </p>
        <Button asChild size="sm" variant="default" className="shadow-sm">
          <Link href={`/properties/${unit.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
