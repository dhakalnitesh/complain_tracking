import { Head, Link } from '@inertiajs/react';
import { route } from '../../../ziggy';
import { StatusBadge, PriorityBadge } from '../../../Components/Badge';

export default function StaffIssues({ staff, issues }) {
    return (
        <>
            <Head title={`${staff.name} - Issues`} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{staff.name}</h1>
                        <p className="text-sm text-gray-500">{issues.length} assigned issues</p>
                    </div>
                    <Link href={route('admin.staff')}
                        className="text-sm text-indigo-600 hover:text-indigo-800">
                        &larr; Back to Staff
                    </Link>
                </div>

                <div className="space-y-3">
                    {issues.map(issue => (
                        <div key={issue.id} className="bg-white rounded-xl border border-gray-200/60 p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="font-mono text-sm font-bold text-gray-900">{issue.reference_code}</span>
                                        <StatusBadge status={issue.status} />
                                        <PriorityBadge priority={issue.priority} />
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">{issue.category} &middot; {issue.location}</p>
                                    <p className="text-sm text-gray-700 line-clamp-2">{issue.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">{issue.bs_created_at}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {issues.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            No issues assigned to this staff member.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
