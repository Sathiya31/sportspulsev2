'use client';

import { Suspense } from 'react';
import ErrorContent from '@/components/auth/ErrorContent';

export default function AuthError() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Loading...</h2>
                    </div>
                </div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}