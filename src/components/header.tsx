'use client';

import Link from 'next/link';
import { Logo } from './logo';
import { Button } from './ui/button';
import { Building2, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
    router.refresh();
  }

  const isAdmin = user && user.role !== 'user';

  return (
    <header className="bg-card border-b sticky top-0 z-50 h-16 flex items-center shadow-sm">
      <div className="container mx-auto px-4 flex justify-between items-center h-full">
        <div className="flex items-center h-full">
          <Logo />
        </div>
        
        <nav className="flex items-center gap-2 md:gap-4">
           { isAdmin && (
             <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/admin">
                  <Building2 className="mr-2 h-4 w-4" />
                  Admin
                </Link>
              </Button>
           )}
          {!isUserLoading && (
            <>
              {user ? (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Login
                      </Link>
                    </Button>
                    <Button size="sm" asChild className="hidden sm:flex">
                      <Link href="/signup">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Sign Up
                      </Link>
                    </Button>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
