import { Head, Link } from '@inertiajs/react';
import { route } from '../../ziggy';
import { useLanguage } from '../../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../Components/Badge';

export default function OrgAdminDashboard({ organization, stats, recent_issues }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';

  return (
    <>
      <Head title={`${organization.name} - ${isNp ? 'व्यवस्थापन' : 'Management'}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
            {organization.name?.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500">{isNp ? 'संस्था व्यवस्थापन ड्यासबोर्ड' : 'Organization Management Dashboard'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {[
            { label: isNp ? 'कुल उजुरी' : 'Total Issues', value: stats.total_issues, color: 'indigo' },
            { label: isNp ? 'खुला उजुरी' : 'Open Issues', value: stats.open_issues, color: 'amber' },
            { label: isNp ? 'आज समाधान' : 'Resolved Today', value: stats.resolved_today, color: 'green' },
            { label: isNp ? 'कर्मचारी' : 'Staff', value: stats.staff_count, color: 'purple' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200/60 p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">{stat.label}</p>
              <p className={`text-xl sm:text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Link href={route('org-admin.departments')} className="px-4 py-2 bg-white text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            {isNp ? 'विभागहरू' : 'Departments'}
          </Link>
          <Link href={route('org-admin.staff')} className="px-4 py-2 bg-white text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
            {isNp ? 'कर्मचारी' : 'Staff'}
          </Link>
        </div>

        {recent_issues.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">{isNp ? 'हालैका उजुरीहरू' : 'Recent Complaints'}</h2>
            <div className="space-y-2">
              {recent_issues.map(issue => (
                <div key={issue.id} className="bg-white rounded-xl border border-gray-200/60 p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-bold text-gray-500">{issue.reference_code}</span>
                    <StatusBadge status={issue.status} />
                    <PriorityBadge priority={issue.priority} />
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{issue.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400">{issue.location}</span>
                    {issue.department && <span className="text-[10px] text-indigo-500">{issue.department}</span>}
                    <span className="text-[10px] text-gray-400 ml-auto">{isNp ? issue.bs_date : new Date(issue.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
