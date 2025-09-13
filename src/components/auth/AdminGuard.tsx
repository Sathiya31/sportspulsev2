'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';
import { isAdmin } from '@/config/auth';

interface AdminGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

export default function AdminGuard({ children, fallback = null }: AdminGuardProps) {
    const { data: session, status } = useSession();
    const userIsAdmin = isAdmin(session?.user?.email);

    if (status === 'loading') {
        return null; // Or a loading spinner
    }

    if (!userIsAdmin) {
        return fallback;
    }

    return <>{children}</>;
}