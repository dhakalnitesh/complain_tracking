import { Head, Link, router, useForm } from '@inertiajs/react';
import { route } from '../../../ziggy';
import { useState } from 'react';

export default function Organizations({ organizations }) {
    const [showCreate, setShowCreate] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        type: 'educational',
        address: '',
        phone: '',
        email: '',
        website: '',
        description: '',
    });

    function handleCreate(e) {
        e.preventDefault();
        post(route('admin.organizations.store'), {
            onSuccess: () => {
                setShowCreate(false);
                reset();
            },
        });
    }

    const typeConfig = {
        educational: 'bg-blue-50 text-blue-700',
        municipality: 'bg-purple-50 text-purple-700',
        government: 'bg-indigo-50 text-indigo-700',
        hospital: 'bg-rose-50 text-rose-700',
    };

    return (
        <>
            <Head title="Manage Organizations" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
                        <p className="text-sm text-gray-500">Manage registered organizations on the platform</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreate(!showCreate)}
                            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all"
                        >
                            {showCreate ? 'Cancel' : 'Add Organization'}
                        </button>
                        <Link href={route('admin.dashboard')} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            Back to Admin
                        </Link>
                    </div>
                </div>

                {showCreate && (
                    <div className="bg-white rounded-xl border border-gray-200/60 p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">New Organization</h3>
                        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    value={data.type}
                                    onChange={e => setData('type', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="educational">Educational</option>
                                    <option value="municipality">Municipality</option>
                                    <option value="government">Government</option>
                                    <option value="hospital">Hospital</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={data.address}
                                    onChange={e => setData('address', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input
                                    type="url"
                                    value={data.website}
                                    onChange={e => setData('website', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="https://"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={data.description}
                                    onChange={e => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm"
                                >
                                    {processing ? 'Creating...' : 'Create Organization'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600">Address</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Issues</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Users</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {organizations.map(org => (
                                    <tr key={org.id} className="hover:bg-gray-50/50">
                                        <td className="py-3 px-4">
                                            <span className="font-medium text-gray-900">{org.name}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeConfig[org.type] || 'bg-gray-50 text-gray-600'}`}>
                                                {org.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{org.address || '-'}</td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-900">{org.issues_count}</td>
                                        <td className="py-3 px-4 text-center font-medium text-gray-900">{org.users_count}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                org.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                                {org.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => router.post(route('admin.organizations.toggle', org.id))}
                                                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                                                    org.is_active
                                                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                                                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                }`}
                                            >
                                                {org.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {organizations.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-gray-400">
                                            No organizations registered yet.
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
