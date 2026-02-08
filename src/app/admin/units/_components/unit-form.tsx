'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Upload, X } from 'lucide-react';
import type { Unit } from '@/lib/definitions';
import { unitCategories, egyptData } from '@/lib/data';
import Image from 'next/image';
import { useRef, useEffect } from 'react';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.enum(['Sale', 'Rent']),
  category: z.enum(['Apartment', 'Villa', 'Office', 'Land']),
  price: z.coerce.number().min(1, 'Price is required'),
  description: z.string().min(1, 'Description is required'),
  governorate: z.string().min(1, 'Governorate is required'),
  city: z.string().min(1, 'City is required'),
  bedrooms: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().optional()),
  bathrooms: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().optional()),
  area: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().optional()),
  clientName: z.string().min(1, 'Client name is required'),
  clientPhone: z.string().min(1, 'Client phone is required'),
  fromBroker: z.boolean().default(false),
  photos: z.array(z.object({
    id: z.string(),
    url: z.string(),
    hint: z.string(),
  })).min(1, 'You have to upload at least one photo.'),
});

type UnitFormProps = {
  unit?: Unit | null;
  onSave: (values: Unit) => void;
  isSaving: boolean;
};

export function UnitForm({ unit, onSave, isSaving }: UnitFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: unit?.title || '',
      type: unit?.type || 'Sale',
      category: unit?.category || 'Apartment',
      price: unit?.price || 0,
      description: unit?.description || '',
      governorate: unit?.governorate || '',
      city: unit?.city || '',
      bedrooms: unit?.bedrooms,
      bathrooms: unit?.bathrooms,
      area: unit?.area,
      clientName: unit?.clientName || '',
      clientPhone: unit?.clientPhone || '',
      fromBroker: unit?.fromBroker || false,
      photos: unit?.photos || [],
    },
  });

  const selectedGov = form.watch('governorate');
  const availableCities = egyptData.find(g => g.id === selectedGov)?.cities || [];

  useEffect(() => {
    const currentCity = form.getValues('city');
    if (currentCity && !availableCities.includes(currentCity)) {
        form.setValue('city', '');
    }
  }, [selectedGov, availableCities, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "photos"
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 4 * 1024 * 1024) {
          form.setError('photos', { message: `File ${file.name} is too large (max 4MB).` });
          continue;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          append({
            id: 'img' + Math.random().toString(36).substring(2, 9),
            url: dataUrl,
            hint: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if(event.target) event.target.value = '';
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const safeId = unit?.id || Math.random().toString(36).substring(2, 12);
    
    const newUnitData: Unit = {
        ...values,
        id: safeId,
        createdBy: unit?.createdBy || '',
        createdByName: unit?.createdByName || '',
    };
    onSave(newUnitData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Modern Apartment in New Cairo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Listing Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Sale" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      For Sale
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="Rent" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      For Rent
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {unitCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Price (EGP)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="3500000" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                <Textarea placeholder="A stunning, modern apartment..." {...field} />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
            control={form.control}
            name="governorate"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Governorate</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a governorate" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {egyptData.map(gov => <SelectItem key={gov.id} value={gov.id}>{gov.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
                <FormItem>
                <FormLabel>City</FormLabel>
                 <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedGov}
                >
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={selectedGov ? "Select a city" : "Select governorate first"} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {availableCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="bedrooms"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bedrooms</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="3" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="bathrooms"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Bathrooms</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="2" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Area (m²)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="180" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="border-t pt-6 mt-6 space-y-4">
          <h3 className="text-lg font-semibold">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client/Broker Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Contact Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Phone Number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="fromBroker"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    From Broker
                  </FormLabel>
                  <FormDescription>
                    Check this if the property is being listed by an external broker.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="photos"
          render={() => (
            <FormItem>
               <div className="mb-4">
                    <FormLabel>Photos</FormLabel>
                    <FormDescription>Upload one or more photos for the property (max 4MB each).</FormDescription>
                </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {fields.map((item, index) => (
                  <div key={item.id} className="relative group aspect-video">
                    <Image src={item.url} alt={item.hint} fill className="object-cover rounded-md border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={() => remove(index)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                ))}
                <div
                  className="flex items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center text-center p-2">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Upload Photos</p>
                  </div>
                </div>
              </div>
              <FormControl>
                <Input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full h-11" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Property'}
        </Button>
      </form>
    </Form>
  );
}
