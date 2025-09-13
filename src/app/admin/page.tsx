'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AdminGuard from '@/components/auth/AdminGuard';

export default function AdminDashboard() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return <div>Loading...</div>;
    }

    if (!session) {
        redirect('/');
    }

    return (
        <AdminGuard>
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Example admin actions */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Manage Results</h2>
                        <p className="text-gray-600 mb-4">Upload and manage sports results</p>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Upload Results
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">User Management</h2>
                        <p className="text-gray-600 mb-4">Manage user roles and permissions</p>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            View Users
                        </button>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4">Calendar Events</h2>
                        <p className="text-gray-600 mb-4">Manage upcoming sports events</p>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Edit Calendar
                        </button>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}