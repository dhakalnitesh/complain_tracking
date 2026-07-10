import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../../ziggy';
import { useState } from 'react';

const identityTypes = [
    { value: 'citizenship', label: 'नागरिकता (Citizenship)', needsBack: true },
    { value: 'passport', label: 'पासपोर्ट (Passport)', needsBack: false },
    { value: 'voter_id', label: 'मतदाता परिचय पत्र (Voter ID)', needsBack: false },
];

export default function StaffEdit({ staff, organizations }) {
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);

    const { data, setData, put, processing, errors } = useForm({
        name: staff.name,
        email: staff.email,
        password: '',
        password_confirmation: '',
        organization_id: String(staff.organization_id || ''),
        identity_type: staff.identity_type || '',
        identity_number: staff.identity_number || '',
        identity_document_front: null,
        identity_document_back: null,
        phone: staff.phone || '',
        address: staff.address || '',
    });

    const needsBack = identityTypes.find(t => t.value === data.identity_type)?.needsBack;

    function handleSubmit(e) {
        e.preventDefault();
        put(route('admin.staff.update', staff.id));
    }

    function handleFrontFile(e) {
        const file = e.target.files[0];
        if (file) {
            setData('identity_document_front', file);
            setFrontPreview(URL.createObjectURL(file));
        }
    }

    function handleBackFile(e) {
        const file = e.target.files[0];
        if (file) {
            setData('identity_document_back', file);
            setBackPreview(URL.createObjectURL(file));
        }
    }

    return (
        <>
            <Head title="Edit Staff" />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
                {/* Nav */}
                <div className="flex items-center gap-2 mb-6">
                    <Link href={route('admin.dashboard')} className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all">
                        Dashboard
                    </Link>
                    <Link href={route('admin.staff')} className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-all">
                        Staff
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 ml-2">Edit Staff: {staff.name}</h1>
                </div>

                <div className="bg-white rounded-xl border border-gray-200/60 p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                        {/* Basic Info */}
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Basic Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                                    <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        New Password <span className="text-gray-400">(leave blank to keep current)</span>
                                    </label>
                                    <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
                                    <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Organization *</label>
                                    <select value={data.organization_id} onChange={e => setData('organization_id', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Select organization...</option>
                                        {organizations.map(org => (
                                            <option key={org.id} value={org.id}>{org.name}</option>
                                        ))}
                                    </select>
                                    {errors.organization_id && <p className="text-red-500 text-xs mt-1">{errors.organization_id}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Identity */}
                        <div>
                            <h2 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Identity Document</h2>
                            <p className="text-xs text-gray-400 mb-3">Leave document fields empty to keep existing files.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Document Type *</label>
                                    <select value={data.identity_type} onChange={e => setData('identity_type', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                        <option value="">Select type...</option>
                                        {identityTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                    {errors.identity_type && <p className="text-red-500 text-xs mt-1">{errors.identity_type}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Document Number *</label>
                                    <input type="text" value={data.identity_number} onChange={e => setData('identity_number', e.target.value)}
                                        placeholder="e.g. 23-01-12345678"
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {errors.identity_number && <p className="text-red-500 text-xs mt-1">{errors.identity_number}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                                    <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)}
                                        placeholder="98XXXXXXXX"
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                                    <textarea value={data.address} onChange={e => setData('address', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                                    {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Document Front</label>
                                    {staff.identity_document_front_url && !frontPreview && (
                                        <div className="mb-2">
                                            <a href={staff.identity_document_front_url} target="_blank" rel="noopener noreferrer"
                                                className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                                                View current document
                                            </a>
                                        </div>
                                    )}
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById('front-upload').click()}>
                                        {frontPreview ? (
                                            <div className="relative">
                                                {data.identity_document_front?.type?.startsWith('image/') ? (
                                                    <img src={frontPreview} alt="Front" className="max-h-32 mx-auto rounded" />
                                                ) : (
                                                    <p className="text-sm text-indigo-600">{data.identity_document_front?.name}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">Click to change</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <p className="text-xs text-gray-400 mt-1">Upload new front side</p>
                                            </div>
                                        )}
                                    </div>
                                    <input id="front-upload" type="file" accept="image/*,.pdf" onChange={handleFrontFile} className="hidden" />
                                    {errors.identity_document_front && <p className="text-red-500 text-xs mt-1">{errors.identity_document_front}</p>}
                                </div>
                                {needsBack && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Document Back</label>
                                        {staff.identity_document_back_url && !backPreview && (
                                            <div className="mb-2">
                                                <a href={staff.identity_document_back_url} target="_blank" rel="noopener noreferrer"
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                                                    View current document
                                                </a>
                                            </div>
                                        )}
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                            onClick={() => document.getElementById('back-upload').click()}>
                                            {backPreview ? (
                                                <div className="relative">
                                                    {data.identity_document_back?.type?.startsWith('image/') ? (
                                                        <img src={backPreview} alt="Back" className="max-h-32 mx-auto rounded" />
                                                    ) : (
                                                        <p className="text-sm text-indigo-600">{data.identity_document_back?.name}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">Click to change</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <svg className="w-8 h-8 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <p className="text-xs text-gray-400 mt-1">Upload new back side</p>
                                                </div>
                                            )}
                                        </div>
                                        <input id="back-upload" type="file" accept="image/*,.pdf" onChange={handleBackFile} className="hidden" />
                                        {errors.identity_document_back && <p className="text-red-500 text-xs mt-1">{errors.identity_document_back}</p>}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={processing}
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm shadow-sm">
                            {processing ? 'Saving...' : 'Update Staff Member'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
