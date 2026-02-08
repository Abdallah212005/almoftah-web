'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Building,
  Users,
  Briefcase,
  UserCheck,
  MessageSquare,
  PanelLeft,
  UserCog,
  LogOut,
  Globe,
} from 'lucide-react';
import { Logo } from '../logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEffect, useState } from 'react';
import { useUser, useAuth } from '@/firebase';
import { Badge } from '../ui/badge';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import type { AdminUser } from '@/lib/definitions';

function NavContent() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const [unreadChats, setUnreadChats] = useState(0);

  useEffect(() => {
    if (!firestore || isUserLoading || !user || user.role === 'user') {
      setUnreadChats(0);
      return;
    }

    const isAdmin = user && user.role !== 'user';
    const isActive = isAdmin && (user.role === 'superadmin' || (user as AdminUser).visible !== false);
    
    if (!isActive) {
      setUnreadChats(0);
      return;
    }
    
    let unsubscribe: () => void = () => {};

    try {
      const chatsRef = collection(firestore, 'chats');
      const q = query(chatsRef, where('readByAdmin', '==', false));
      
      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setUnreadChats(snapshot.size);
        }, 
        (err) => {
          console.warn('Chat count listener permission deferred:', err.message);
          setUnreadChats(0);
        }
      );
    } catch (err) {
      setUnreadChats(0);
    }

    return () => unsubscribe();
  }, [firestore, user, isUserLoading]);
  
  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    router.refresh();
  }

  return (
    <>
      <div className="p-4 border-b">
        <Logo />
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          if (item.role && item.role !== user?.role) {
            return null;
          }
          const isActiveItem = pathname === item.href;
          return (
            <Button
              key={item.href}
              asChild
              variant={isActiveItem ? 'secondary' : 'ghost'}
              className="w-full justify-start relative font-medium"
            >
              <Link href={item.href}>
                <item.icon className={`mr-3 h-5 w-5 ${isActiveItem ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.label}
                {item.href === '/admin/chat' && unreadChats > 0 && (
                  <Badge className="ml-auto h-5 bg-destructive text-destructive-foreground font-bold">{unreadChats}</Badge>
                )}
              </Link>
            </Button>
          );
        })}
        <div className="pt-4 mt-4 border-t">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-primary transition-colors"
          >
            <Link href="/">
              <Globe className="mr-3 h-5 w-5" />
              Live Site
            </Link>
          </Button>
        </div>
      </nav>
      <div className="p-4 border-t bg-muted/20">
        {user && (
          <div className='mb-4 px-2'>
            <p className="text-sm font-bold truncate text-foreground">{user.username}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{user.role}</p>
          </div>
        )}
        <Button variant="outline" className="w-full justify-start border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={handleLogout}>
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </Button>
      </div>
    </>
  );
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/units', label: 'Properties', icon: Building },
  { href: '/admin/leads', label: 'Leads', icon: Users },
  { href: '/admin/clients', label: 'Clients', icon: UserCheck },
  { href: '/admin/brokers', label: 'Brokers', icon: Briefcase },
  { href: '/admin/chat', label: 'Messaging', icon: MessageSquare },
  { href: '/admin/users', label: 'Team Mgmt', icon: UserCog, role: 'superadmin' },
];

export function AdminSidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [pathname, isMobile]);

  const isAdmin = user && user.role !== 'user';
  const isActive = isAdmin && (user.role === 'superadmin' || (user as AdminUser).visible !== false);

  if (!mounted || isUserLoading || !isActive) {
    return null;
  }

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed top-4 left-4 z-50 bg-card shadow-lg border-primary/20">
            <PanelLeft className="h-5 w-5 text-primary" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 flex flex-col w-72">
          <NavContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 shadow-sm">
      <NavContent />
    </aside>
  );
}
