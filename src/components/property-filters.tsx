'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { egyptData, unitCategories } from '@/lib/data';

function FiltersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGov, setSelectedGov] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setSelectedType(searchParams.get('type') || 'all');
    setSelectedCategory(searchParams.get('category') || 'all');
    setSelectedGov(searchParams.get('governorate') || 'all');
    setSelectedCity(searchParams.get('city') || 'all');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
  }, [searchParams]);

  if (!mounted) {
    return (
      <Card className="shadow-lg border-none bg-background/80 backdrop-blur">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
             <div className="h-11 bg-muted animate-pulse rounded-md" />
             <div className="h-11 bg-muted animate-pulse rounded-md" />
             <div className="h-11 bg-muted animate-pulse rounded-md" />
             <div className="h-11 bg-muted animate-pulse rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentGovData = egyptData.find(g => g.id === selectedGov);
  const cities = currentGovData ? currentGovData.cities : [];

  const handleGovChange = (val: string) => {
    setSelectedGov(val);
    setSelectedCity('all');
  };

  const handleFind = () => {
    const params = new URLSearchParams();
    if (selectedType && selectedType !== 'all') params.set('type', selectedType);
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory);
    if (selectedGov && selectedGov !== 'all') params.set('governorate', selectedGov);
    if (selectedCity && selectedCity !== 'all') params.set('city', selectedCity);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    router.push(`/properties/?${params.toString()}`);
  };

  const handleClear = () => {
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedGov('all');
    setSelectedCity('all');
    setMinPrice('');
    setMaxPrice('');
    router.push('/properties/');
  };

  return (
    <Card className="shadow-xl border-none bg-background/95 backdrop-blur">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full h-11 bg-background border-muted-foreground/20">
                  <SelectValue placeholder="Sale / Rent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Sale">For Sale</SelectItem>
                  <SelectItem value="Rent">For Rent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full h-11 bg-background border-muted-foreground/20">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {unitCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Governorate</label>
              <Select value={selectedGov} onValueChange={handleGovChange}>
                <SelectTrigger className="w-full h-11 bg-background border-muted-foreground/20">
                  <SelectValue placeholder="Governorate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Egypt</SelectItem>
                  {egyptData.map((gov) => (
                    <SelectItem key={gov.id} value={gov.id}>{gov.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">City</label>
              <Select 
                value={selectedCity} 
                onValueChange={setSelectedCity} 
                disabled={selectedGov === 'all'}
              >
                <SelectTrigger className="w-full h-11 bg-background border-muted-foreground/20">
                  <SelectValue placeholder={selectedGov === 'all' ? "Select Region" : "All Cities"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="flex gap-2 items-center md:col-span-2">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Min Price</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="Min EGP" 
                    className="pl-9 h-11 bg-background border-muted-foreground/20"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Max Price</label>
                <div className="relative">
                  <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="number" 
                    placeholder="Max EGP" 
                    className="pl-9 h-11 bg-background border-muted-foreground/20"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 w-full">
              <Button size="lg" className="flex-1 h-11 text-sm font-bold shadow-lg bg-primary hover:bg-primary/90" onClick={handleFind}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleClear}
                className="h-11 w-11 shrink-0 text-muted-foreground border-muted-foreground/20 hover:text-destructive hover:border-destructive/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PropertyFilters() {
  return (
    <Suspense fallback={<div className="h-48 w-full bg-muted/20 animate-pulse rounded-xl" />}>
      <FiltersContent />
    </Suspense>
  );
}
