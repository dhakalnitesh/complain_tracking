import { Head, Link } from '@inertiajs/react';
import { route } from '../ziggy';
import { useLanguage } from '../Context/LanguageContext';
import StatsCard from '../Components/StatsCard';
import { StatusBadge, PriorityBadge } from '../Components/Badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';

const COLORS = ['#2563eb', '#dc2626', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Dashboard({ organizations, stats, recent_issues, category_stats, issues_over_time }) {
  const { t, lang } = useLanguage();

  return (
    <>
      <Head title={`${t('app.name')} - ${t('app.subtitle')}`} />

      {/* Mobile SOS + Quick Actions */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 md:hidden">
        <Link
          href={route('issues.create') + '?priority=critical'}
          className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all hover:scale-110 active:scale-95"
          title={t('sos.button')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </Link>
        <Link
          href={route('issues.create')}
          className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-all hover:scale-110 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDYiLz48L3N2Zz4=')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 relative">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 mb-4 sm:mb-6">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-[10px] sm:text-xs font-medium text-blue-200">{t('app.subtitle')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-3">
              {t('home.hero_title')}
            </h1>
            <p className="text-sm sm:text-base text-blue-200/80 max-w-xl mx-auto mb-6 sm:mb-8">
              {t('home.hero_desc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={route('issues.create')}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('home.submit_btn')}
              </Link>
              <Link
                href={route('status.check')}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('home.track_btn')}
              </Link>
            </div>
            {/* Emergency SOS for desktop */}
            <Link
              href={route('issues.create') + '?priority=critical'}
              className="hidden sm:inline-flex items-center gap-2 mt-4 px-4 py-2 bg-red-600/20 text-red-300 text-xs font-medium rounded-full hover:bg-red-600/30 border border-red-500/30 transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t('sos.title')}
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-5 sm:-mt-8 relative z-10 mb-6 sm:mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatsCard label={t('home.total_issues')} value={stats.total_issues} color="indigo"
            icon="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          <StatsCard label={t('home.open_issues')} value={stats.open_issues} color="amber"
            icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <StatsCard label={t('home.resolved_today')} value={stats.resolved_today} color="green"
            icon="M5 13l4 4L19 7" />
          <StatsCard label={t('home.avg_resolution')} value={stats.avg_resolution_time || 'N/A'} color="purple"
            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">{t('home.orgs_title')}</h2>
          <Link href={route('register')} className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            {lang === 'np' ? 'संस्था दर्ता गर्नुहोस् →' : 'Register your org →'}
          </Link>
        </div>
        {organizations.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200/60 p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">{t('home.no_orgs')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {organizations.map(org => {
              const count = org.issues_count || 0;
              const color = count === 0 ? 'emerald' : count > 5 ? 'red' : 'amber';
              const badges = {
                educational: 'bg-blue-50 text-blue-700 border-blue-200',
                municipality: 'bg-purple-50 text-purple-700 border-purple-200',
                government: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                hospital: 'bg-rose-50 text-rose-700 border-rose-200',
              };
              return (
                <Link key={org.id} href={route('org.dashboard', org.slug)}
                  className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-5 hover:shadow-md hover:border-gray-300 transition-all group active:scale-[0.98]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate group-hover:text-indigo-600 transition-colors">{org.name}</h3>
                        <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${badges[org.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {org.type}
                        </span>
                      </div>
                      {org.address && <p className="text-xs text-gray-400 truncate">{org.address}</p>}
                    </div>
                    <div className={`shrink-0 text-center min-w-[2.5rem] sm:min-w-[3rem] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-sm sm:text-base font-bold ${
                      color === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                      color === 'red' ? 'bg-red-50 border-red-200 text-red-700' :
                      'bg-amber-50 border-amber-200 text-amber-700'
                    }`}>
                      {count}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6 sm:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">{t('home.categories_title')}</h3>
            {category_stats.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={category_stats} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {category_stats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-xs sm:text-sm">{t('home.no_data')}</div>
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">{t('home.trends_title')}</h3>
            {issues_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={issues_over_time}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                    labelFormatter={v => new Date(v).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} />
                  <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400 text-xs sm:text-sm">{t('home.no_data')}</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      {recent_issues.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t('home.recent_title')}</h2>
          <div className="space-y-2 sm:space-y-3">
            {recent_issues.map(issue => (
              <Link key={issue.id} href={route('issues.show-reference', issue.reference_code)}
                className="bg-white rounded-xl border border-gray-200/60 p-3 sm:p-4 hover:shadow-sm transition-all block active:scale-[0.99]">
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-[10px] sm:text-xs font-bold text-gray-900">{issue.reference_code}</span>
                      <StatusBadge status={issue.status} />
                      <PriorityBadge priority={issue.priority} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">{issue.description}</p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      {issue.organization || issue.location} &middot; {issue.bs_date_short || new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
