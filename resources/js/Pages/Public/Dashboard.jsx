import { Head, Link } from '@inertiajs/react';
import { route } from '../../ziggy';
import { useLanguage } from '../../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../Components/UI/Badge';
import TrackModal from '../../Components/TrackModal';

const ORG_ICONS = {
  municipality: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  government: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
  hospital: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  educational: 'M12 14l9-5-9-5-9 5 9 5zm0 7l-9-5 9-5 9 5-9 5z',
};

const ORG_COLORS = {
  municipality: 'from-purple-500 to-indigo-600',
  government: 'from-blue-500 to-cyan-600',
  hospital: 'from-rose-500 to-pink-600',
  educational: 'from-emerald-500 to-teal-600',
};

export default function Dashboard({ organizations, stats, recent_issues, category_stats, issues_over_time }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';
  const [trackOpen, setTrackOpen] = useState(false);

  const catTotal = category_stats.reduce((s, c) => s + c.total, 0);
  const maxTrend = Math.max(...issues_over_time.map(d => d.count), 1);

  const trendH = 130;
  const trendW = Math.max(issues_over_time.length - 1, 1);

  return (
    <>
      <Head title={`${t('app.name')} - ${t('app.subtitle')}`} />

      {/* Mobile SOS */}
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <Link
          href={route('issues.create') + '?priority=critical'}
          className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {isNp ? 'नागरिक सरोकारमा स्वागत छ' : t('home.hero_title')}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-1 max-w-lg">
                {isNp ? 'आफ्नो उजुरी दर्ता गर्नुहोस्, ट्र्याक गर्नुहोस् र समाधान हेर्नुहोस्' : t('home.hero_desc')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={route('issues.create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-900 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isNp ? 'उजुरी दिनुहोस्' : t('home.submit_btn')}
              </Link>
              <button
                onClick={() => setTrackOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-all border border-white/20 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isNp ? 'ट्र्याक गर्नुहोस्' : t('home.track_btn')}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-5">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg sm:text-xl font-bold text-white">{stats.total_issues}</p>
              <p className="text-[10px] text-blue-200/70 mt-0.5">{isNp ? 'जम्मा' : 'Total'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg sm:text-xl font-bold text-amber-300">{stats.open_issues}</p>
              <p className="text-[10px] text-amber-200/70 mt-0.5">{isNp ? 'खुल्ला' : 'Open'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg sm:text-xl font-bold text-emerald-300">{stats.resolved_today}</p>
              <p className="text-[10px] text-emerald-200/70 mt-0.5">{isNp ? 'आज' : 'Today'}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
              <p className="text-lg sm:text-xl font-bold text-white">{stats.avg_resolution_time || '—'}</p>
              <p className="text-[10px] text-blue-200/70 mt-0.5">{isNp ? 'औसत' : 'Avg time'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Action buttons */}
        <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
          <Link href={route('feed')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-sm text-xs font-medium text-gray-700 hover:text-indigo-600 shrink-0 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            {isNp ? 'फीड' : 'Feed'}
          </Link>
          <Link href={route('issues.create') + '?priority=critical'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 text-xs font-medium text-red-700 shrink-0 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            SOS
          </Link>
        </div>

        {/* ROW 1: Orgs + Category Chart side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 mb-5">
          {/* Organizations (2 cols) */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-gray-900 mb-2">{isNp ? 'संस्थाहरू' : 'Organizations'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {organizations.map(org => (
                <Link key={org.id} href={route('org.dashboard', org.slug)}
                  className="bg-white rounded-xl border border-gray-200/60 p-3 hover:shadow-md hover:border-gray-300 transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${ORG_COLORS[org.type] || 'from-gray-500 to-gray-600'} flex items-center justify-center shrink-0`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={ORG_ICONS[org.type] || ORG_ICONS.municipality} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{org.name}</p>
                      <p className="text-[10px] text-gray-400 capitalize">{org.type} &bull; {org.issues_count || 0} {isNp ? 'उजुरी' : 'issues'}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Category pie/donut summary (1 col) - right next to orgs */}
          <div className="bg-white rounded-xl border border-gray-200/60 p-4">
            <h3 className="text-xs font-bold text-gray-900 mb-3">{isNp ? 'श्रेणीगत विवरण' : 'By Category'}</h3>
            {category_stats.length > 0 ? (
              <div className="space-y-2.5">
                {category_stats.slice(0, 6).map((cat, i) => {
                  const pct = catTotal > 0 ? Math.round((cat.total / catTotal) * 100) : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-[10px] mb-0.5">
                        <span className="text-gray-600 truncate pr-1">{cat.name}</span>
                        <span className="text-gray-400 shrink-0">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400">{isNp ? 'कुनै डाटा छैन' : 'No data'}</p>
            )}
          </div>
        </div>

        {/* ROW 2: Trend Chart + Recent Issues */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* Trend line chart (2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200/60 p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-900">{isNp ? 'पछिल्लो ७ दिन' : '7-Day Trend'}</h3>
                <span className="text-[10px] text-gray-400">{isNp ? 'उजुरी संख्या' : 'complaints'}</span>
              </div>
              {issues_over_time && issues_over_time.length > 0 ? (
                <div className="relative" style={{ height: '180px' }}>
                  <svg viewBox="0 0 600 200" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Grid */}
                    {[0, 1, 2, 3].map(i => (
                      <line key={i} x1="50" y1={30 + i * 42} x2="580" y2={30 + i * 42} stroke="#f3f4f6" strokeWidth="1" />
                    ))}
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
                      </linearGradient>
                    </defs>
                    {(() => {
                      const pts = issues_over_time.map((d, i) => {
                        const x = 50 + (i / Math.max(issues_over_time.length - 1, 1)) * 530;
                        const y = 30 + (1 - d.count / maxTrend) * 130;
                        return { x, y, val: d.count, label: d.date ? d.date.slice(5) : '' };
                      });
                      const areaD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ` L${pts[pts.length - 1].x.toFixed(1)},200 L${pts[0].x.toFixed(1)},200 Z`;
                      const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                      return (
                        <>
                          <path d={areaD} fill="url(#trendGrad)" />
                          <path d={lineD} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((p, i) => (
                            <g key={i}>
                              <circle cx={p.x} cy={p.y} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
                              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#6b7280" fontSize="10">{p.val}</text>
                            </g>
                          ))}
                          {pts.map((p, i) => (
                            <text key={`x-${i}`} x={p.x} y="194" textAnchor="middle" fill="#9ca3af" fontSize="9">{p.label}</text>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-xs text-gray-400">{isNp ? 'कुनै डाटा छैन' : 'No data'}</div>
              )}
            </div>
          </div>

          {/* Recent Issues (1 col) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-gray-900">{isNp ? 'पछिल्लो' : 'Recent'}</h2>
              <Link href={route('feed')} className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium">{isNp ? 'सबै →' : 'All →'}</Link>
            </div>
            {recent_issues.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200/60 p-5 text-center">
                <p className="text-xs text-gray-500">{isNp ? 'कुनै उजुरी छैन' : 'No issues yet'}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recent_issues.map(issue => (
                  <Link key={issue.id} href={route('issues.show-reference', issue.reference_code)}
                    className="bg-white rounded-xl border border-gray-200/60 p-2.5 hover:shadow-sm hover:border-gray-300 transition-all block"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full mt-1.5 shrink-0 bg-gray-300" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-mono text-[9px] font-bold text-gray-400">{issue.reference_code}</span>
                          {issue.category_name && (
                            <span className="text-[8px] font-medium text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">{issue.category_name}</span>
                          )}
                          <StatusBadge status={issue.status} />
                        </div>
                        <p className="text-[10px] text-gray-600 line-clamp-1 mt-0.5">{issue.description}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-gray-400">
                          <span>{issue.organization || issue.location}</span>
                          <span>{issue.bs_date_short}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TrackModal open={trackOpen} onClose={() => setTrackOpen(false)} />
    </>
  );
}

const BAR_COLORS = ['#4f46e5', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#6366f1'];
