import { Head, Link, router } from '@inertiajs/react';
import { route } from '../../ziggy';

export default function Staff({ staff, organizations }) {
    function handleDelete(userId) {
        if (confirm('Are you sure you want to remove this staff member?')) {
            router.delete(route('admin.staff.destroy', userId));
        }
    }

    return (
        <>
            <Head title="Manage Staff" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Staff Members</h1>
                        <p className="text-sm text-gray-500">Manage staff across organizations</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.staff.create')}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all">
                            Add Staff
                        </Link>
                        <Link href={route('admin.dashboard')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Back
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Email</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Organization</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Assigned Issues</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {staff.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                                        <td className="py-3 px-4 text-gray-500">{user.email}</td>
                                        <td className="py-3 px-4 text-gray-600">{user.organization_name || '-'}</td>
                                        <td className="py-3 px-4 text-center">
                                            <Link href={route('admin.staff.issues', user.id)}
                                                className="text-indigo-600 hover:text-indigo-800 font-medium">
                                                {user.issues_count}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button onClick={() => handleDelete(user.id)}
                                                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {staff.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400">
                                            No staff members yet. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
