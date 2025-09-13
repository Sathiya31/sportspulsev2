'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
    const searchParams = useSearchParams();
    const error = searchParams?.get('error');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Authentication Error</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {error === 'AccessDenied' 
                            ? 'Access denied. Only administrators can sign in.'
                            : 'There was an error signing in.'}
                    </p>
                </div>
                <div className="mt-4 text-center">
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}