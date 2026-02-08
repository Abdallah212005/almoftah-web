'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Briefcase, DollarSign, ListChecks } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, or, and } from 'firebase/firestore';
import type { Unit, Lead, Broker, AdminUser } from '@/lib/definitions';
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const isAdmin = user && user.role !== 'user';
  const isActive = isAdmin && (user.role === 'superadmin' || (user as AdminUser).visible !== false);

  const unitsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isActive || !user) return null;
    const baseCol = collection(firestore, 'units');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, or(where('createdBy', '==', user.uid), where('sharedWith', 'array-contains', user.uid)));
  }, [firestore, isUserLoading, user, isActive]);
  const { data: units } = useCollection<Unit>(unitsQuery);

  const leadsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isActive || !user) return null;
    const baseCol = collection(firestore, 'leads');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, or(where('createdBy', '==', user.uid), where('sharedWith', 'array-contains', user.uid)));
  }, [firestore, isUserLoading, user, isActive]);
  const { data: allLeads } = useCollection<Lead>(leadsQuery);

  const newLeadsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isActive || !user) return null;
    const baseCol = collection(firestore, 'leads');
    if (user.role === 'superadmin') return query(baseCol, where('status', '==', 'New'));
    
    return query(
      baseCol, 
      and(
        where('status', '==', 'New'), 
        or(where('createdBy', '==', user.uid), where('sharedWith', 'array-contains', user.uid))
      )
    );
  }, [firestore, isUserLoading, user, isActive]);
  const { data: newLeads } = useCollection<Lead>(newLeadsQuery);

  const brokersQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading || !isActive || !user) return null;
    const baseCol = collection(firestore, 'brokers');
    if (user.role === 'superadmin') return baseCol;
    return query(baseCol, where('createdBy', '==', user.uid));
  }, [firestore, isUserLoading, user, isActive]);
  const { data: allBrokers } = useCollection<Broker>(brokersQuery);

  const totalValue = units?.reduce((sum, unit) => sum + (unit.price || 0), 0) ?? 0;
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', notation: 'compact' }).format(value);

  const adminTasks = user && 'tasks' in user ? (user as AdminUser).tasks : [];

  if (isUserLoading || !isActive || !user) {
      return (
          <div className="space-y-8">
              <Skeleton className="h-10 w-48" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        {user?.role === 'superadmin' && (
          <Badge variant="outline" className="px-3 py-1 border-primary text-primary font-bold">
            Super User Mode
          </Badge>
        )}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Units</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Properties listed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newLeads?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active inquiries</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Brokers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allBrokers?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">Partners</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">Assets value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Operational statistics for {user.username}.</p>
          </CardContent>
        </Card>
        
        {adminTasks && adminTasks.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Goals</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 pt-4 text-sm text-foreground">
                {adminTasks.map((task, index) => (
                  <li key={index} className="flex items-center">
                    <span className="h-2 w-2 rounded-full bg-primary mr-3 shrink-0"></span>
                    {task}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
