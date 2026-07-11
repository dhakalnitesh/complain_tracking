import { useState } from 'react';
import SearchSelect from '../UI/SearchSelect';
import { useForm } from '@inertiajs/react';

export default function AssignPopup({ issue, staffUsers, onAssign, onClose }) {
    const orgStaff = staffUsers.filter(
        s => s.organization_id === issue.organization_id || !s.organization_id
    );

    const staffOptions = [
        { value: '', label: '— Unassign —' },
        ...orgStaff.map(s => ({ value: String(s.id), label: `${s.name}${s.organization_name ? ` (${s.organization_name})` : ''}` })),
    ];

    const { data, setData, post, processing } = useForm({
        assigned_user_id: issue.assigned_user_id ? String(issue.assigned_user_id) : '',
        days: '',
    });

    function handleSubmit(e) {
        e.preventDefault();
        const staffId = data.assigned_user_id ? Number(data.assigned_user_id) : null;
        const staffName = staffId
            ? orgStaff.find(s => s.id === staffId)?.name || ''
            : '';
        post(route('admin.issues.assign', issue.id), {
            assigned_to: staffName,
            assigned_user_id: staffId,
            days: data.days || null,
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    }

    return (
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-50 p-4">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-700">Assign Staff</p>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
                <SearchSelect
                    options={staffOptions}
                    value={data.assigned_user_id}
                    onChange={v => setData('assigned_user_id', v)}
                    placeholder="Search staff..."
                />
                <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1">Deadline (days)</label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={data.days}
                        onChange={e => setData('days', e.target.value)}
                        placeholder="e.g. 7 for 7 days"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <button
                    type="submit"
                    disabled={processing}
                    className="w-full py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                    {processing ? 'Assigning...' : 'Assign'}
                </button>
            </form>
        </div>
    );
}
