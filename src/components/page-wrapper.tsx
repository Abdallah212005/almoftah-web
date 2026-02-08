'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

export function PageWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    return (
        <>
            {!isAuthPage && <Header />}
            <main className="flex-grow">{children}</main>
            {!isAuthPage && <Footer />}
        </>
    );
}
