
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Broker, Unit } from '@/lib/definitions';
import { PlusCircle, MoreHorizontal, Search, User, Phone, Building2, Briefcase } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { BrokerForm } from "./_components/broker-form";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function BrokersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const brokersQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    const baseCol = collection(firestore, 'brokers');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, where('createdBy', '==', user.uid));
  }, [firestore, isUserLoading, user]);

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    const baseCol = collection(firestore, 'units');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, where('createdBy', '==', user.uid));
  }, [firestore, isUserLoading, user]);

  const { data: brokers, isLoading: isBrokersLoading } = useCollection<Broker>(brokersQuery);
  const { data: units } = useCollection<Unit>(unitsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedBrokerDetail, setSelectedBrokerDetail] = useState<Broker | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingBrokerId, setDeletingBrokerId] = useState<string | null>(null);
  
  const handleAddClick = () => {
    setEditingBroker(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (broker: Broker) => {
    setEditingBroker(broker);
    setIsSheetOpen(true);
  };

  const handleDetailClick = (broker: Broker) => {
    setSelectedBrokerDetail(broker);
    setIsDetailSheetOpen(true);
  };

  const handleDeleteClick = (brokerId: string) => {
    setDeletingBrokerId(brokerId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deletingBrokerId && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'brokers', deletingBrokerId));
      toast({
        title: "Broker Deleted",
        description: "The broker has been removed.",
      });
    }
    setIsDeleteAlertOpen(false);
    setDeletingBrokerId(null);
  };

  const handleSave = (brokerData: Broker) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    const finalBrokerData: Broker = {
      ...brokerData,
      createdBy: brokerData.createdBy || user.uid,
      createdByName: brokerData.createdByName || user.username
    };

    setDocumentNonBlocking(doc(firestore, 'brokers', finalBrokerData.id), finalBrokerData, { merge: true });
    
    toast({
        title: editingBroker ? "Broker Updated" : "Broker Added",
        description: `Broker "${finalBrokerData.name}" has been saved.`,
    });
    
    setIsSaving(false);
    setIsSheetOpen(false);
    setEditingBroker(null);
  };

  const filteredBrokers = brokers?.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.phone.includes(searchTerm)
  );

  const associatedUnits = units?.filter(u => u.clientPhone === selectedBrokerDetail?.phone) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Brokers</h1>
          <p className="text-muted-foreground">
            {user?.role === 'superadmin' ? 'Overview of all active brokers.' : 'Manage your associated real estate brokers.'}
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Broker
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name, company, or phone..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Properties</TableHead>
                {user?.role === 'superadmin' && <TableHead>Admin</TableHead>}
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isBrokersLoading || isUserLoading) && Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-40"/></TableCell>
                      <TableCell><Skeleton className="h-5 w-36"/></TableCell>
                      <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto"/></TableCell>
                      {user?.role === 'superadmin' && <TableCell><Skeleton className="h-5 w-24"/></TableCell>}
                      <TableCell><Skeleton className="h-8 w-8"/></TableCell>
                  </TableRow>
              ))}
              {filteredBrokers?.map((broker) => {
                const count = units?.filter(u => u.clientPhone === broker.phone).length || 0;
                return (
                  <TableRow key={broker.id}>
                    <TableCell>
                      <button 
                        onClick={() => handleDetailClick(broker)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {broker.name}
                      </button>
                    </TableCell>
                    <TableCell>{broker.company}</TableCell>
                    <TableCell>{broker.phone}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{count}</Badge>
                    </TableCell>
                    {user?.role === 'superadmin' && (
                      <TableCell>
                        <Badge variant="secondary" className="font-normal">
                          {broker.createdByName || 'System'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(broker)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(broker.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingBroker ? 'Edit Broker' : 'Add New Broker'}</SheetTitle>
            <SheetDescription>Update the details for this external broker.</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <BrokerForm broker={editingBroker} onSave={handleSave} isSaving={isSaving} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {selectedBrokerDetail?.name}
            </SheetTitle>
            <SheetDescription>{selectedBrokerDetail?.company}</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="font-medium">{selectedBrokerDetail?.phone}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" /> Type
                </p>
                <p className="font-medium">External Broker</p>
              </div>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold mb-4 flex justify-between items-center">
                <span>Associated Properties</span>
                <Badge variant="secondary">{associatedUnits.length}</Badge>
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {associatedUnits.map(u => (
                    <div key={u.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium">{u.title}</p>
                        <Badge variant="outline" className="text-[10px]">{u.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{u.city}, {u.governorate}</p>
                      <p className="text-sm font-bold text-primary">
                        {new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(u.price)}
                      </p>
                    </div>
                  ))}
                  {associatedUnits.length === 0 && (
                    <p className="text-center py-10 text-muted-foreground text-sm">No properties found.</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this broker record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingBrokerId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
