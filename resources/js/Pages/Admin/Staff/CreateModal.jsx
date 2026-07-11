import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState, useEffect } from 'react';

const identityTypes = [
    { value: 'citizenship', label: 'नागरिकता (Citizenship)', needsBack: true },
    { value: 'passport', label: 'पासपोर्ट (Passport)', needsBack: false },
    { value: 'voter_id', label: 'मतदाता परिचय पत्र (Voter ID)', needsBack: false },
];

export default function CreateModal({ show, onClose, organizations }) {
    const [frontPreview, setFrontPreview] = useState(null);
    const [backPreview, setBackPreview] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors, setError, clearErrors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        organization_id: '',
        identity_type: '',
        identity_number: '',
        identity_document_front: null,
        identity_document_back: null,
        phone: '',
        address: '',
    });

    useEffect(() => {
        if (!show) {
            reset();
            setFrontPreview(null);
            setBackPreview(null);
        }
    }, [show]);

    const needsBack = identityTypes.find(t => t.value === data.identity_type)?.needsBack;

    function handleNameChange(value) {
        if (value.length > 0 && /^[0-9]/.test(value)) return;
        setData('name', value);
        if (!value || /^[a-zA-Z\u0900-\u097F]/.test(value)) clearErrors('name');
    }

    function handlePhoneChange(value) {
        const digits = value.replace(/\D/g, '');
        setData('phone', digits);
        clearErrors('phone');
    }

    function handleSubmit(e) {
        e.preventDefault();
        let hasError = false;
        if (data.name && !/^[a-zA-Z\u0900-\u097F]/.test(data.name)) {
            setError('name', 'Name must start with a letter');
            hasError = true;
        }
        if (data.phone && !/^\d*$/.test(data.phone)) {
            setError('phone', 'Phone must contain only digits');
            hasError = true;
        }
        if (hasError) return;
        post(route('admin.staff.store'), {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
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

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-xl z-10">
                    <h2 className="text-lg font-bold text-gray-900">Add Staff Member</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6" encType="multipart/form-data">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Basic Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" value={data.name} onChange={e => handleNameChange(e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Email <span className="text-red-500">*</span></label>
                                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                    </button>
                                </div>
                                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type={showConfirm ? 'text' : 'password'} value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 border px-3 py-2 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                        <i className={`fas ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                                    </button>
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Organization <span className="text-red-500">*</span></label>
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

                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Identity Document</h2>
                        <p className="text-xs text-gray-400 mb-3">Staff identity verification document (citizenship, passport, or voter ID). Upload a clear scan or photo.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Document Type <span className="text-red-500">*</span></label>
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
                                <label className="block text-xs font-medium text-gray-600 mb-1">Document Number <span className="text-red-500">*</span></label>
                                <input type="text" value={data.identity_number} onChange={e => setData('identity_number', e.target.value)}
                                    placeholder="e.g. 23-01-12345678"
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
                                {errors.identity_number && <p className="text-red-500 text-xs mt-1">{errors.identity_number}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                                <input type="text" value={data.phone} onChange={e => handlePhoneChange(e.target.value)}
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
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Document Front <span className="text-gray-400">(image or PDF)</span> <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                    onClick={() => document.getElementById('create-front-upload').click()}>
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
                                            <p className="text-xs text-gray-400 mt-1">Click to upload front side</p>
                                        </div>
                                    )}
                                </div>
                                <input id="create-front-upload" type="file" accept="image/*,.pdf" onChange={handleFrontFile} className="hidden" />
                                {errors.identity_document_front && <p className="text-red-500 text-xs mt-1">{errors.identity_document_front}</p>}
                            </div>
                            {needsBack && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Document Back <span className="text-gray-400">(image or PDF)</span>
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-indigo-400 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById('create-back-upload').click()}>
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
                                                <p className="text-xs text-gray-400 mt-1">Click to upload back side</p>
                                            </div>
                                        )}
                                    </div>
                                    <input id="create-back-upload" type="file" accept="image/*,.pdf" onChange={handleBackFile} className="hidden" />
                                    {errors.identity_document_back && <p className="text-red-500 text-xs mt-1">{errors.identity_document_back}</p>}
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" disabled={processing}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm shadow-sm">
                        {processing ? 'Saving...' : 'Create Staff Member'}
                    </button>
                </form>
            </div>
        </div>
    );
}
