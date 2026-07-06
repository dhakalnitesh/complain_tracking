import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from '../ziggy';
import { useState } from 'react';

export default function Submit({ locations, organizations, selected_organization, categories, priorities }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const [photoPreview, setPhotoPreview] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        organization_id: selected_organization?.id || '',
        category: '',
        priority: 'medium',
        location_id: '',
        description: '',
        reporter_name: user?.name || '',
        reporter_phone: '',
        reporter_email: user?.email || '',
        is_anonymous: !user,
        photo: null,
    });

    function handleSubmit(e) {
        e.preventDefault();
        post('/issues', {
            forceFormData: true,
            onSuccess: () => {
                reset('category', 'location_id', 'description', 'photo');
                setPhotoPreview(null);
            },
        });
    }

    function handlePhotoChange(e) {
        const file = e.target.files[0];
        setData('photo', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview(ev.target.result);
            reader.readAsDataURL(file);
        } else {
            setPhotoPreview(null);
        }
    }

    function groupLocations(locs) {
        const parents = locs.filter(l => !l.parent_id);
        const children = locs.filter(l => l.parent_id);
        const result = [];
        const addedChildren = new Set();

        for (const parent of parents) {
            const kids = children.filter(c => c.parent_id === parent.id);
            if (kids.length > 0) {
                result.push({ ...parent, children: kids });
                kids.forEach(k => addedChildren.add(k.id));
            } else {
                result.push({ ...parent, children: [] });
            }
        }

        const ungrouped = children.filter(c => !addedChildren.has(c.id));
        for (const child of ungrouped) {
            result.push({ ...child, children: [] });
        }

        return result;
    }

    const groupedLocations = groupLocations(locations);

    return (
        <>
            <Head title="Submit an Issue" />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Submit an Issue</h1>
                    <p className="text-gray-500 mt-1">
                        Your report will be sent to the concerned organization. You can choose to stay anonymous.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 space-y-5">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Issue Details</h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                                <select
                                    value={data.organization_id}
                                    onChange={e => setData('organization_id', parseInt(e.target.value))}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                >
                                    <option value="">Select organization</option>
                                    {organizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                                {errors.organization_id && <p className="text-red-500 text-xs mt-1">{errors.organization_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                <select
                                    value={data.category}
                                    onChange={e => setData('category', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                                <select
                                    value={data.priority}
                                    onChange={e => setData('priority', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                >
                                    {Object.entries(priorities).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                {errors.priority && <p className="text-red-500 text-xs mt-1">{errors.priority}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                <select
                                    value={data.location_id}
                                    onChange={e => setData('location_id', parseInt(e.target.value))}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white"
                                >
                                    <option value="">Select location</option>
                                    {groupedLocations.map(loc => (
                                        <optgroup key={loc.id} label={loc.name}>
                                            {loc.children.length > 0 ? (
                                                loc.children.map(child => (
                                                    <option key={child.id} value={child.id}>{child.name}</option>
                                                ))
                                            ) : (
                                                <option value={loc.id}>{loc.name}</option>
                                            )}
                                        </optgroup>
                                    ))}
                                </select>
                                {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                            <textarea
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                rows={5}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                placeholder="Describe your issue in detail. Include relevant information like time, location, and people involved..."
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                />
                                {photoPreview && (
                                    <img src={photoPreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
                                )}
                            </div>
                            {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-6 space-y-5">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Your Information</h2>
                        <p className="text-xs text-gray-500">Providing contact details is optional but helps us follow up.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={data.reporter_name}
                                    onChange={e => setData('reporter_name', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={data.reporter_phone}
                                    onChange={e => setData('reporter_phone', e.target.value)}
                                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. 98XXXXXXXX"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={data.reporter_email}
                                onChange={e => setData('reporter_email', e.target.value)}
                                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                placeholder="Optional"
                            />
                        </div>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={data.is_anonymous}
                                onChange={e => setData('is_anonymous', e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <div>
                                <span className="text-sm font-medium text-gray-900">Submit Anonymously</span>
                                <p className="text-xs text-gray-500">Your identity will not be revealed to the organization</p>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                        {processing ? (
                            <span className="inline-flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Submitting...
                            </span>
                        ) : 'Submit Issue'}
                    </button>
                </form>
            </div>
        </>
    );
}
