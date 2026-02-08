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
import type { AdminUser } from "@/lib/definitions";
import { UserPlus, ShieldCheck, Mail, ShieldAlert, Key, Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { UserForm } from "./_components/user-form";
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
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { firebaseConfig } from "@/firebase/config";

export default function UsersPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  const adminsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !user || user.role !== 'superadmin') return null;
    return collection(firestore, 'admin_users');
  }, [firestore, isUserLoading, user]);

  const { data: admins, isLoading } = useCollection<AdminUser>(adminsQuery);
  
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const togglePasswordVisibility = (id: string) => {
    if (!id) return;
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddClick = () => {
    setEditingUser(null);
    setIsSheetOpen(true);
  };

  const handleEditClick = (userToEdit: AdminUser) => {
    setEditingUser(userToEdit);
    setIsSheetOpen(true);
  };

  const handleDeleteClick = (userId: string) => {
    if(userId === user?.uid) {
        toast({ variant: 'destructive', title: "Action Denied", description: "Self-deletion is not permitted." });
        return;
    }
    setDeletingUserId(userId);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deletingUserId && firestore) {
      deleteDocumentNonBlocking(doc(firestore, 'admin_users', deletingUserId));
      deleteDocumentNonBlocking(doc(firestore, 'roles_admin', deletingUserId));
      toast({
        title: "Account Removed",
        description: "The admin account has been purged.",
      });
    }
    setIsDeleteAlertOpen(false);
    setDeletingUserId(null);
  };

  const handleSave = async (userData: AdminUser, password?: string) => {
    if (!firestore) return;
    setIsSaving(true);
    
    try {
      let finalUid = userData.id;

      if (!userData.id && password) {
        const secondaryApp = getApps().find(a => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary');
        const secondaryAuth = getAuth(secondaryApp);
        
        try {
          const userCred = await createUserWithEmailAndPassword(secondaryAuth, userData.email, password);
          finalUid = userCred.user.uid;
          await signOut(secondaryAuth);
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
             throw new Error("This email is already registered.");
          }
          throw authError;
        }
      }

      if (!finalUid) throw new Error("A valid User ID is required.");

      const finalData = { 
        ...userData, 
        id: finalUid,
        password: password || userData.password || ''
      };
      
      setDocumentNonBlocking(doc(firestore, 'admin_users', finalUid), finalData, { merge: true });
      setDocumentNonBlocking(doc(firestore, 'roles_admin', finalUid), { active: true }, { merge: true });

      toast({
          title: userData.id ? "Profile Updated" : "Account Created",
          description: "All changes synchronized successfully.",
      });
      
      setIsSheetOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: "Sync Error",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVisibilityChange = (adminId: string, visible: boolean) => {
    if (!firestore || !adminId) return;
    const adminRef = doc(firestore, 'admin_users', adminId);
    setDocumentNonBlocking(adminRef, { visible }, { merge: true });
    
    toast({
        title: visible ? "Access Granted" : "Access Revoked",
        description: `Permissions updated for this admin.`,
    });
  }

  if (isUserLoading) {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-48"/>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-64"/>
                    <Skeleton className="h-4 w-full"/>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full"/>
                </CardContent>
            </Card>
        </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return (
        <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-6 w-6" /> Access Denied
                </CardTitle>
                <CardDescription>Super Admin privileges required.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm">Only the system owner can manage administrative accounts.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Company Team</h1>
          <p className="text-muted-foreground">Oversee administrative access and assign employee tasks.</p>
        </div>
        <Button onClick={handleAddClick} size="lg" className="shadow-lg">
          <UserPlus className="mr-2 h-5 w-5" /> New Admin Account
        </Button>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Auth Credentials</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isLoading) && Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-40"/></TableCell>
                      <TableCell><Skeleton className="h-10 w-40"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                      <TableCell><Skeleton className="h-5 w-20"/></TableCell>
                      <TableCell><Skeleton className="h-6 w-12 rounded-full"/></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 ml-auto"/></TableCell>
                  </TableRow>
              ))}
              {admins?.map((admin) => {
                const isPassVisible = !!visiblePasswords[admin.id];
                return (
                  <TableRow key={admin.id} className="group transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{admin.username || 'Unnamed'}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {admin.email || 'No email'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <div className="p-1.5 bg-muted rounded flex items-center gap-2 border">
                            <Key className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-mono">
                                {isPassVisible ? admin.password || '••••••••' : '••••••••'}
                            </span>
                            <button 
                                onClick={() => togglePasswordVisibility(admin.id)}
                                className="hover:text-primary transition-colors"
                            >
                                {isPassVisible ? <EyeOff className="h-3 w-3" /> : <Key className="h-3 w-3" />}
                            </button>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.role === 'superadmin' ? 'default' : 'secondary'} className="capitalize font-bold">
                        {admin.role || 'admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 font-semibold">
                          {admin.visible ? <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> : <ShieldAlert className="h-3.5 w-3.5 text-orange-600" />}
                          <span className={admin.visible ? 'text-green-600' : 'text-orange-600'}>
                            {admin.visible ? 'Active' : 'Suspended'}
                          </span>
                        </Badge>
                    </TableCell>
                    <TableCell>
                        <Switch 
                            checked={!!admin.visible} 
                            onCheckedChange={(checked) => handleVisibilityChange(admin.id, checked)}
                            disabled={admin.email === 'abdallah@almoftah.com'}
                        />
                    </TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={(value) => {
                        if (value === 'edit') handleEditClick(admin);
                        if (value === 'delete') handleDeleteClick(admin.id);
                      }}>
                        <SelectTrigger className="w-[110px] h-8 text-xs ml-auto">
                          <SelectValue placeholder="Actions" />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="edit">Edit Profile</SelectItem>
                          {admin.email !== 'abdallah@almoftah.com' && (
                            <SelectItem value="delete" className="text-destructive">Purge Account</SelectItem>
                          )}
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

      <Sheet open={isSheetOpen} onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingUser(null);
      }}>
          <SheetContent className="sm:max-w-md flex flex-col p-0">
            <SheetHeader className="p-6 pb-2 border-b bg-muted/20">
              <SheetTitle className="text-2xl font-bold">{editingUser ? 'Profile Detail' : 'Activate Employee'}</SheetTitle>
              <SheetDescription>
                Configure credentials and assign administrative duties.
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="flex-1">
              <div className="p-6">
                <UserForm user={editingUser} onSave={handleSave} isSaving={isSaving} />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" /> Confirm Removal
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action is irreversible. The employee will lose all access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingUserId(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90 font-bold">Purge</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
