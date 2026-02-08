'use client';

import { useState } from "react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Unit, Broker, Client, AdminUser } from "@/lib/definitions";
import { PlusCircle, User, Phone, Building2, Share2, History, Bed, Bath, Square, MapPin, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { UnitForm } from "./_components/unit-form";
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
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where, or, and } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

export default function UnitsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const unitsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    if (user.role === 'superadmin') {
      return collection(firestore, 'units');
    }
    return query(
      collection(firestore, 'units'), 
      or(where('createdBy', '==', user.uid), where('sharedWith', 'array-contains', user.uid))
    );
  }, [firestore, isUserLoading, user]);

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    return query(collection(firestore, 'admin_users'), where('visible', '==', true));
  }, [firestore, isUserLoading, user]);

  const { data: units, isLoading } = useCollection<Unit>(unitsQuery);
  const { data: admins } = useCollection<AdminUser>(adminsQuery);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [selectedContact, setSelectedContact] = useState<{ name: string; phone: string; isBroker: boolean } | null>(null);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);

  const [selectedUnitDetail, setSelectedUnitDetail] = useState<Unit | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);

  const [shareTargetUnit, setShareTargetUnit] = useState<Unit | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedTargetAdminId, setSelectedTargetAdminId] = useState<string>('');

  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingUnitId, setDeletingUnitId] = useState<string | null>(null);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(price);

  const handleAddClick = () => {
    setEditingUnit(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (unit: Unit) => {
    setEditingUnit(unit);
    setIsSheetOpen(true);
  };

  const handleDetailClick = (unit: Unit) => {
    setSelectedUnitDetail(unit);
    setIsDetailSheetOpen(true);
  };

  const handleDeleteClick = (unitId: string) => {
    setDeletingUnitId(unitId);
    setIsDeleteAlertOpen(true);
  };

  const handleContactClick = (name: string, phone: string, isBroker: boolean) => {
    setSelectedContact({ name, phone, isBroker });
    setIsContactSheetOpen(true);
  };

  const handleShareClick = (unit: Unit) => {
    setShareTargetUnit(unit);
    setIsShareDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingUnitId && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'units', deletingUnitId));
      toast({
        title: "Unit Deleted",
        description: "The property has been removed.",
      });
    }
    setIsDeleteAlertOpen(false);
    setDeletingUnitId(null);
  };

  const handleShare = () => {
    if (!firestore || !shareTargetUnit || !selectedTargetAdminId || !user) return;
    
    const targetAdmin = admins?.find(a => a.id === selectedTargetAdminId);
    if (!targetAdmin) return;

    const currentSharedWith = shareTargetUnit.sharedWith || [];
    if (currentSharedWith.includes(targetAdmin.id)) {
       toast({ title: "Already Shared", description: `This property is already shared with ${targetAdmin.username}.` });
       setIsShareDialogOpen(false);
       return;
    }

    const currentHistory = shareTargetUnit.shareHistory || [];
    const newHistory = [
      ...currentHistory,
      {
        fromId: user.uid,
        fromName: user.username,
        toId: targetAdmin.id,
        toName: targetAdmin.username,
        at: new Date().toISOString()
      }
    ];

    const unitRef = doc(firestore, 'units', shareTargetUnit.id);
    setDocumentNonBlocking(unitRef, {
      sharedWith: [...currentSharedWith, targetAdmin.id],
      shareHistory: newHistory
    }, { merge: true });

    toast({
      title: "Property Shared",
      description: `"${shareTargetUnit.title}" is now shared with ${targetAdmin.username}.`,
    });

    setIsShareDialogOpen(false);
    setShareTargetUnit(null);
    setSelectedTargetAdminId('');
  };
  
  const handleSave = (unitData: Unit) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    const finalUnitData: Unit = {
      ...unitData,
      createdBy: unitData.createdBy || user.uid,
      createdByName: unitData.createdByName || user.username
    };
    
    setDocumentNonBlocking(doc(firestore, 'units', finalUnitData.id), finalUnitData, { merge: true });
    
    if (finalUnitData.clientName && finalUnitData.clientPhone) {
      const contactId = finalUnitData.clientPhone.replace(/\D/g, '');
      if (finalUnitData.fromBroker) {
        const brokerData: Broker = {
          id: contactId,
          name: finalUnitData.clientName,
          company: 'Unknown',
          phone: finalUnitData.clientPhone,
          createdBy: finalUnitData.createdBy,
          createdByName: finalUnitData.createdByName
        };
        setDocumentNonBlocking(doc(firestore, 'brokers', contactId), brokerData, { merge: true });
      } else {
        const clientData: Client = {
          id: contactId,
          name: finalUnitData.clientName,
          phone: finalUnitData.clientPhone,
          createdBy: finalUnitData.createdBy,
          createdByName: finalUnitData.createdByName
        };
        setDocumentNonBlocking(doc(firestore, 'clients', contactId), clientData, { merge: true });
      }
    }
    
    toast({
      title: editingUnit ? "Unit Updated" : "Unit Added",
      description: `"${finalUnitData.title}" has been saved.`,
    });
    
    setIsSaving(false);
    setIsSheetOpen(false);
    setEditingUnit(null);
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-headline">Properties</h1>
            <p className="text-muted-foreground">
              {user?.role === 'superadmin' ? 'Viewing all units across the company.' : 'Manage your listed real estate units.'}
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Unit
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || isUserLoading) && Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))}
                {units?.map((unit) => (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">
                      <button 
                        onClick={() => handleDetailClick(unit)}
                        className="text-primary hover:underline font-bold text-left"
                      >
                        {unit.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={unit.type === 'Rent' ? 'secondary' : 'default'} className="text-[10px] uppercase">
                        {unit.type || 'Sale'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{unit.category}</Badge>
                    </TableCell>
                    <TableCell>{unit.city}</TableCell>
                    <TableCell>
                      {formatPrice(unit.price)}
                      {unit.type === 'Rent' && <span className="text-[10px] text-muted-foreground">/mo</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={(value) => {
                        if (value === 'edit') handleEditClick(unit);
                        if (value === 'share') handleShareClick(unit);
                        if (value === 'delete') handleDeleteClick(unit.id);
                      }}>
                        <SelectTrigger className="w-[110px] h-8 text-xs ml-auto">
                          <SelectValue placeholder="Actions" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="edit">Edit</SelectItem>
                          <SelectItem value="share">Share</SelectItem>
                          <SelectItem value="delete" className="text-destructive">Delete</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-2xl flex flex-col">
          <SheetHeader>
            <SheetTitle>{editingUnit ? 'Edit Property' : 'Add New Property'}</SheetTitle>
            <SheetDescription>
              {editingUnit ? 'Update the details of your property.' : 'Fill in the form to add a new property to your listing.'}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-1 -mx-6">
            <div className="px-6 py-4">
              <UnitForm unit={editingUnit} onSave={handleSave} isSaving={isSaving} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-2xl">
          <SheetHeader>
            <div className="flex items-center gap-2 mb-1">
               <Badge variant={selectedUnitDetail?.type === 'Rent' ? 'secondary' : 'default'}>
                 For {selectedUnitDetail?.type || 'Sale'}
               </Badge>
            </div>
            <SheetTitle>{selectedUnitDetail?.title}</SheetTitle>
            <SheetDescription>
              {selectedUnitDetail?.city}, {selectedUnitDetail?.governorate}
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
            <div className="mt-6 space-y-6 pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedUnitDetail?.photos.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-video rounded-lg overflow-hidden border">
                    <Image src={photo.url} alt={photo.hint} fill className="object-cover" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Bed className="h-3 w-3" /> Beds</p>
                  <p className="font-bold">{selectedUnitDetail?.bedrooms ?? '-'}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Bath className="h-3 w-3" /> Baths</p>
                  <p className="font-bold">{selectedUnitDetail?.bathrooms ?? '-'}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Square className="h-3 w-3" /> Area</p>
                  <p className="font-bold">{selectedUnitDetail?.area ? `${selectedUnitDetail.area}m²` : '-'}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs text-primary/70 font-semibold">Price</p>
                  <p className="font-bold text-primary">
                    {selectedUnitDetail?.price ? formatPrice(selectedUnitDetail.price) : '-'}
                    {selectedUnitDetail?.type === 'Rent' && <span className="text-xs ml-1">/mo</span>}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Description</h3>
                <p className="text-sm leading-relaxed">{selectedUnitDetail?.description}</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Original Owner Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><User className="h-4 w-4" /></div>
                     <div>
                        <p className="text-xs text-muted-foreground">Listed By</p>
                        <p className="text-sm font-medium">{selectedUnitDetail?.createdByName}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"><Phone className="h-4 w-4" /></div>
                     <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="text-sm font-medium">{selectedUnitDetail?.clientPhone}</p>
                     </div>
                  </div>
                </div>
              </div>

              {user?.role === 'superadmin' && selectedUnitDetail?.shareHistory && selectedUnitDetail.shareHistory.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold flex items-center gap-2">
                    <History className="h-4 w-4" /> Share History
                  </h3>
                  <div className="space-y-2">
                    {selectedUnitDetail.shareHistory.map((h, i) => (
                      <div key={i} className="text-xs p-3 bg-muted rounded-lg border flex items-center gap-3">
                        <Share2 className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          Shared from <span className="font-bold">{h.fromName}</span> to <span className="font-bold">{h.toName}</span> on {new Date(h.at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Sheet open={isContactSheetOpen} onOpenChange={setIsContactSheetOpen}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {selectedContact?.name}
            </SheetTitle>
            <SheetDescription>
              Details and listing history for this {selectedContact?.isBroker ? 'broker' : 'client'}.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </p>
                <p className="font-medium">{selectedContact?.phone}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Type
                </p>
                <p className="font-medium">{selectedContact?.isBroker ? 'Professional Broker' : 'Individual Client'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-4 flex justify-between items-center">
                <span>Associated Properties</span>
                <Badge variant="secondary">{units?.filter(u => u.clientPhone === selectedContact?.phone).length ?? 0}</Badge>
              </h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {units?.filter(u => u.clientPhone === selectedContact?.phone).map(u => (
                    <div key={u.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex flex-col">
                           <p className="font-medium group-hover:text-primary transition-colors">{u.title}</p>
                           <p className="text-[10px] text-muted-foreground">For {u.type || 'Sale'}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{u.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{u.city}</p>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-primary">{formatPrice(u.price)}</p>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setIsContactSheetOpen(false);
                          handleDetailClick(u);
                        }}>View</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Property
            </DialogTitle>
            <DialogDescription>
              Collaborate on "{shareTargetUnit?.title}" with another team member.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Recipient Admin</label>
              <Select value={selectedTargetAdminId} onValueChange={setSelectedTargetAdminId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an admin..." />
                </SelectTrigger>
                <SelectContent>
                  {admins?.filter(a => a.id !== user?.uid).map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.username} ({admin.role})
                    </SelectItem>
                  ))}
                  {admins?.filter(a => a.id !== user?.uid).length === 0 && (
                    <p className="p-2 text-sm text-muted-foreground text-center">No other active admins found.</p>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleShare} disabled={!selectedTargetAdminId}>Confirm Sharing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the unit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUnitId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
