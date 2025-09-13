'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { isAdmin } from '@/config/auth';

export default function SignInButton() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div>...</div>;
    }

    if (session) {
        return (
            <div className="group relative">
                <div 
                    onClick={() => signOut()}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    title={session.user?.email || 'User Profile'}
                >
                    {session.user?.email &&
                     (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {session.user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    )}
                    {isAdmin(session.user?.email) && (
                        <div className="w-2 h-2 absolute -top-0.5 -right-0.5 bg-green-500 rounded-full" title="Admin"/>
                    )}
                </div>
                <div className="hidden group-hover:block absolute right-0 top-full mt-2 py-2 w-48 bg-white rounded-md shadow-lg">
                    <p className="px-4 py-1 text-sm text-gray-600 truncate border-b">
                        {session.user?.email}
                    </p>
                    {isAdmin(session.user?.email) && (
                        <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                            Dashboard
                        </Link>
                    )}
                    <div 
                        onClick={() => signOut()}
                        className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer"
                    >
                        Sign Out
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div 
            onClick={() => signIn('google')}
            className="w-8 h-8 p-1 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center cursor-pointer shadow-sm border border-gray-200 transition-colors"
            title="Sign in with Google"
        >
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
        </div>
    );
}