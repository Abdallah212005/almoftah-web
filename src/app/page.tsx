'use client';

import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property-card';
import { PropertyFilters } from '@/components/property-filters';
import type { Unit } from '@/lib/definitions';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, limit, query } from 'firebase/firestore';
import Link from 'next/link';
import { Building2, Plus, ArrowRight, ShieldCheck, Zap, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  const { user } = useUser();
  const firestore = useFirestore();
  const unitsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'units'), limit(6)) : null, [firestore]);
  const { data: featuredUnits, isLoading } = useCollection<Unit>(unitsQuery);

  const isAdmin = user && (user.role === 'admin' || user.role === 'superadmin');

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <Image 
          src="https://picsum.photos/seed/hero/1920/1080" 
          alt="Modern Architecture" 
          fill 
          priority
          className="object-cover brightness-50"
          data-ai-hint="luxury house"
        />
        <div className="container relative z-10 mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg font-headline">
            Almoftah Real Estate
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90 drop-shadow-md">
            The most exclusive listings across Egypt's most prestigious locations.
          </p>
          <div className="max-w-4xl mx-auto">
             <PropertyFilters />
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2 text-foreground">Featured Listings</h2>
              <p className="text-muted-foreground">Hand-picked properties just for you</p>
            </div>
            <Button variant="ghost" asChild className="text-primary font-semibold">
              <Link href="/properties">View all properties <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
          
          {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-[400px] rounded-lg bg-muted animate-pulse" />
                ))}
             </div>
          ) : featuredUnits && featuredUnits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredUnits.map((unit) => (
                <PropertyCard key={unit.id} unit={unit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-background rounded-3xl border-2 border-dashed flex flex-col items-center justify-center">
                <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Properties Available</h3>
                <p className="text-muted-foreground mb-8">We're updating our listings. Check back soon!</p>
                {isAdmin && (
                  <Button asChild>
                    <Link href="/admin/units">
                      <Plus className="mr-2 h-4 w-4" /> Add Property
                    </Link>
                  </Button>
                )}
            </div>
          )}
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 border-t">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Professional real estate management and marketing solutions.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Safe & Secure</h3>
              <p className="text-muted-foreground">
                We ensure all property listings and user data are handled with the highest security standards.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">24/7 Support</h3>
              <p className="text-muted-foreground">
                Our agents are available to assist you with any inquiries via our live chat system.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 bg-card rounded-2xl shadow-sm border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast Search</h3>
              <p className="text-muted-foreground">
                Find your dream property in seconds with our advanced filtering and search engine.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
