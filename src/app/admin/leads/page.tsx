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
import type { Lead, AdminUser } from "@/lib/definitions";
import { PlusCircle, Share2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LeadForm } from "./_components/lead-form";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, query, where, or, and } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusVariant = {
  New: 'default',
  Contacted: 'secondary',
  Qualified: 'default',
  Lost: 'destructive',
} as const;

export default function LeadsPage() {
  const [filterStatus, setFilterStatus] = useState('All');
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  
  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    let baseQuery = collection(firestore, 'leads');
    
    const constraints: any[] = [];
    if (user.role !== 'superadmin') {
      constraints.push(or(where('createdBy', '==', user.uid), where('sharedWith', 'array-contains', user.uid)));
    }
    
    if (filterStatus !== 'All') {
      constraints.push(where('status', '==', filterStatus));
    }
    
    if (constraints.length === 0) return baseQuery;
    if (constraints.length === 1) return query(baseQuery, constraints[0]);
    
    // Explicitly use and() for composite filters
    if (user.role !== 'superadmin' && filterStatus !== 'All') {
        return query(baseQuery, and(constraints[0], constraints[1]));
    }
    
    return query(baseQuery, and(...constraints));
  }, [firestore, filterStatus, isUserLoading, user]);

  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') return null;
    return query(collection(firestore, 'admin_users'), where('visible', '==', true));
  }, [firestore, isUserLoading, user]);

  const { data: leads, isLoading } = useCollection<Lead>(leadsQuery);
  const { data: admins } = useCollection<AdminUser>(adminsQuery);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [shareTargetLead, setShareTargetLead] = useState<Lead | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [selectedTargetAdminId, setSelectedTargetAdminId] = useState<string>('');

  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingLead(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (lead: Lead) => {
    setEditingLead(lead);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (leadId: string) => {
    setDeletingLeadId(leadId);
    setIsDeleteAlertOpen(true);
  };

  const handleShareClick = (lead: Lead) => {
    setShareTargetLead(lead);
    setIsShareDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingLeadId && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'leads', deletingLeadId));
      toast({
        title: "Lead Deleted",
        description: "The lead has been removed.",
      });
    }
    setIsDeleteAlertOpen(false);
    setDeletingLeadId(null);
  };

  const handleShare = () => {
    if (!firestore || !shareTargetLead || !selectedTargetAdminId || !user) return;
    
    const targetAdmin = admins?.find(a => a.id === selectedTargetAdminId);
    if (!targetAdmin) return;

    const currentSharedWith = shareTargetLead.sharedWith || [];
    if (currentSharedWith.includes(targetAdmin.id)) {
        toast({ title: "Already Shared", description: `This lead is already shared with ${targetAdmin.username}.` });
        setIsShareDialogOpen(false);
        return;
    }

    const currentHistory = shareTargetLead.shareHistory || [];
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

    const leadRef = doc(firestore, 'leads', shareTargetLead.id);
    setDocumentNonBlocking(leadRef, {
      sharedWith: [...currentSharedWith, targetAdmin.id],
      shareHistory: newHistory
    }, { merge: true });

    toast({
      title: "Lead Shared",
      description: `Lead for "${shareTargetLead.name}" has been shared with ${targetAdmin.username}.`,
    });

    setIsShareDialogOpen(false);
    setShareTargetLead(null);
    setSelectedTargetAdminId('');
  };

  const handleSave = (leadData: Lead) => {
    if (!firestore || !user) return;
    setIsSaving(true);
    
    const finalLeadData: Lead = {
      ...leadData,
      createdBy: leadData.createdBy || user.uid,
      createdByName: leadData.createdByName || user.username,
      sharedWith: leadData.sharedWith || [],
      shareHistory: leadData.shareHistory || []
    };

    setDocumentNonBlocking(doc(firestore, 'leads', finalLeadData.id), finalLeadData, { merge: true });
    
    toast({
        title: editingLead ? "Lead Updated" : "Lead Added",
        description: `Lead for "${finalLeadData.name}" has been saved.`,
    });
    
    setIsSaving(false);
    setIsSheetOpen(false);
    setEditingLead(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Leads</CardTitle>
              <CardDescription>
                {user?.role === 'superadmin' ? 'Viewing all company leads.' : 'Manage your potential customers.'}
              </CardDescription>
            </div>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="All" onValueChange={setFilterStatus}>
            <TabsList>
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="New">New</TabsTrigger>
                <TabsTrigger value="Contacted">Contacted</TabsTrigger>
                <TabsTrigger value="Qualified">Qualified</TabsTrigger>
                <TabsTrigger value="Lost">Lost</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || isUserLoading) && Array.from({length: 5}).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-24"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-36"/></TableCell>
                        <TableCell><Skeleton className="h-5 w-28"/></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                        <TableCell><Skeleton className="h-8 w-24 ml-auto"/></TableCell>
                    </TableRow>
                ))}
                {leads?.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>{lead.email}</TableCell>
                    <TableCell>{lead.phone}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[lead.status] || 'outline'}>{lead.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={(value) => {
                        if (value === 'edit') handleEditClick(lead);
                        if (value === 'share') handleShareClick(lead);
                        if (value === 'delete') handleDeleteClick(lead.id);
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
          </div>
        </CardContent>
      </Card>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</SheetTitle>
            <SheetDescription>
              {editingLead ? 'Update the details for this lead.' : 'Fill in the form to add a new lead.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <LeadForm lead={editingLead} onSave={handleSave} isSaving={isSaving} />
          </div>
          {user?.role === 'superadmin' && editingLead?.shareHistory && editingLead.shareHistory.length > 0 && (
             <div className="space-y-4 pt-4 mt-6 border-t">
               <h3 className="font-semibold flex items-center gap-2">
                  <History className="h-4 w-4" /> Share History
               </h3>
               <div className="space-y-2">
                 {editingLead.shareHistory.map((h, i) => (
                    <div key={i} className="text-xs p-2 bg-muted rounded border">
                       Shared from <span className="font-bold">{h.fromName}</span> to <span className="font-bold">{h.toName}</span> on {new Date(h.at).toLocaleDateString()}
                    </div>
                 ))}
               </div>
             </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Share Lead
            </DialogTitle>
            <DialogDescription>
              Allow another team member to view and manage the lead for "{shareTargetLead?.name}".
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
              This action cannot be undone. This will permanently delete the lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingLeadId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
