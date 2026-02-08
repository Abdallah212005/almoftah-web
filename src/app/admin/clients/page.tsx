'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Client, Unit } from '@/lib/definitions';
import { UserPlus, Search, User, Phone, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ClientForm } from "./_components/client-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, deleteDocumentNonBlocking, setDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export default function ClientsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const clientsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    const baseCol = collection(firestore, 'clients');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, where('createdBy', '==', user.uid));
  }, [firestore, isUserLoading, user]);

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    const baseCol = collection(firestore, 'units');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, where('createdBy', '==', user.uid));
  }, [firestore, isUserLoading, user]);

  const { data: clients, isLoading: isClientsLoading } = useCollection<Client>(clientsQuery);
  const { data: units } = useCollection<Unit>(unitsQuery);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingClient(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
    setIsSheetOpen(true);
  };

  const handleDetailClick = (client: Client) => {
    setSelectedClientDetail(client);
    setIsDetailSheetOpen(true);
  };

  const handleDeleteClick = (clientId: string) => {
    setDeletingClientId(clientId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deletingClientId && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'clients', deletingClientId));
      toast({
        title: "Client Deleted",
        description: "The client record has been removed.",
      });
    }
    setIsDeleteAlertOpen(false);
    setDeletingClientId(null);
  };

  const handleSave = (clientData: Client) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    const finalClientData: Client = {
      ...clientData,
      createdBy: clientData.createdBy || user.uid,
      createdByName: clientData.createdByName || user.username
    };

    setDocumentNonBlocking(doc(firestore, 'clients', finalClientData.id), finalClientData, { merge: true });
    
    toast({
        title: editingClient ? "Client Updated" : "Client Added",
        description: `Client "${finalClientData.name}" has been saved.`,
    });
    
    setIsSaving(false);
    setIsSheetOpen(false);
    setEditingClient(null);
  };

  const filteredClients = clients?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const associatedUnits = units?.filter(u => u.clientPhone === selectedClientDetail?.phone) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Clients</h1>
          <p className="text-muted-foreground">
            {user?.role === 'superadmin' ? 'Management of all property owners.' : 'Manage your direct property owners.'}
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <UserPlus className="mr-2 h-4 w-4" /> Add Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="relative w-full max-sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or phone..." 
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
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Properties</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isClientsLoading || isUserLoading) && Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48"/></TableCell>
                      <TableCell><Skeleton className="h-5 w-36"/></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-5 w-8 ml-auto"/></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto"/></TableCell>
                  </TableRow>
              ))}
              {filteredClients?.map((client) => {
                const count = units?.filter(u => u.clientPhone === client.phone).length || 0;
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <button 
                        onClick={() => handleDetailClick(client)}
                        className="font-medium text-primary hover:underline text-left"
                      >
                        {client.name}
                      </button>
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{count}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Select onValueChange={(v) => {
                          if (v === 'edit') handleEditClick(client);
                          if (v === 'delete') handleDeleteClick(client.id);
                        }}>
                          <SelectTrigger className="w-[110px] h-8 text-xs ml-auto">
                            <SelectValue placeholder="Options" />
                          </SelectTrigger>
                          <SelectContent align="end">
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="delete" className="text-destructive">Delete</SelectItem>
                          </SelectContent>
                        </Select>
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
            <SheetTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</SheetTitle>
            <SheetDescription>Enter the contact information for the property owner.</SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <ClientForm client={editingClient} onSave={handleSave} isSaving={isSaving} />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {selectedClientDetail?.name}
            </SheetTitle>
            <SheetDescription>Individual Client Profile</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="font-medium">{selectedClientDetail?.phone}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Type
                </p>
                <p className="font-medium">Direct Client</p>
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
                      <p className="text-xs text-muted-foreground mb-2">{u.city}</p>
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
            <AlertDialogDescription>This will permanently delete this client record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingClientId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
