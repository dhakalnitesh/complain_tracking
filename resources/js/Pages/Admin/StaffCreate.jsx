import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../../ziggy';

export default function StaffCreate({ organizations }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        organization_id: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        post(route('admin.staff.store'));
    }

    return (
        <>
            <Head title="Add Staff" />

            <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
                <div className="bg-white rounded-xl border border-gray-200/60 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-lg font-bold text-gray-900">Add Staff Member</h1>
                        <Link href={route('admin.staff')} className="text-sm text-indigo-600 hover:text-indigo-800">
                            &larr; Back
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                            <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                            <select value={data.organization_id} onChange={e => setData('organization_id', e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="">Select organization...</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            {errors.organization_id && <p className="text-red-500 text-xs mt-1">{errors.organization_id}</p>}
                        </div>

                        <button type="submit" disabled={processing}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm">
                            {processing ? 'Creating...' : 'Create Staff'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
