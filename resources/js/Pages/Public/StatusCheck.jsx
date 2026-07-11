import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useLanguage } from '../../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../Components/UI/Badge';
import ProgressSteps from '../../Components/UI/ProgressSteps';
import ShareButton from '../../Components/Feed/ShareButton';

export default function StatusCheck({ issue, error }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';
  const { data, setData, get, processing } = useForm({ code: '' });

  function handleSubmit(e) {
    e.preventDefault();
    get(route('status.check'), { preserveState: true });
  }

  return (
    <>
      <Head title={`${t('status.title')} - ${t('app.name')}`} />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Quick Track Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
          <div className="text-center mb-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('status.title')}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('status.desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('status.code_label')}</label>
              <input type="text" value={data.code} onChange={e => setData('code', e.target.value.toUpperCase())}
                placeholder={t('status.code_placeholder')}
                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none uppercase tracking-wider font-mono" />
            </div>
            <button type="submit" disabled={processing || !data.code}
              className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm active:scale-[0.99]">
              {processing ? t('status.searching') : t('status.lookup_btn')}
            </button>
          </form>

          {error && (
            <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-xs sm:text-sm">{error}</p>
            </div>
          )}

          {issue && (
            <div className="mt-6 space-y-5">
              {/* Progress Steps */}
              <div className="bg-gray-50 rounded-xl p-4">
                <ProgressSteps currentStatus={issue.status} events={issue.events || []} />
              </div>

              {/* Issue Details */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-xs sm:text-sm">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{t('status.details_title')}</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('status.reference')}</span><span className="font-mono font-bold text-gray-900 text-xs sm:text-sm">{issue.reference_code}</span></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('status.organization')}</span><span className="font-medium text-gray-900 text-xs sm:text-sm">{issue.organization}</span></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('status.category')}</span><span className="font-medium text-gray-900 text-xs sm:text-sm">{issue.category}</span></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('submit.title_label')}</span><span className="font-medium text-gray-900 text-xs sm:text-sm">{issue.title}</span></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('status.location')}</span><span className="font-medium text-gray-900 text-xs sm:text-sm">{issue.location}</span></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{isNp ? 'पेश गरिएको' : 'Submitted'}</span><span className="font-medium text-gray-900 text-xs sm:text-sm">{issue.bs_created_at}</span></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('status.priority')}</span><PriorityBadge priority={issue.priority} /></div>
                  <div><span className="text-gray-500 block text-[10px] sm:text-xs">{t('status.status')}</span><StatusBadge status={issue.status} /></div>
                </div>
                {issue.assigned_to && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-gray-500 text-[10px] sm:text-xs">{t('status.assigned_to')}:</span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">{issue.assigned_to}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-gray-500 text-[10px] sm:text-xs mb-1">{t('status.description')}:</p>
                  <p className="text-gray-900 text-xs sm:text-sm">{issue.description}</p>
                </div>
                {issue.photo_path && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-[10px] sm:text-xs mb-1">{t('status.attachment')}:</p>
                    <img src={issue.photo_path} alt="" className="rounded-lg max-h-32 sm:max-h-40 object-cover" />
                  </div>
                )}
                {issue.status === 'resolved' && issue.resolved_at && (
                  <div className="pt-2 border-t border-gray-200 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-500 text-[10px] sm:text-xs">{t('status.resolved_on')}:</span>
                    <span className="font-medium text-gray-900 text-xs sm:text-sm">
                      {issue.bs_resolved_at || new Date(issue.resolved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>

              {/* Resolution Summary */}
              {issue.status === 'resolved' && issue.resolution_summary && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-green-800 mb-2">Resolution</h3>
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">{issue.resolution_summary}</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Resolved by: {issue.resolved_by_name || 'Staff'}</p>
                </div>
              )}

              {/* Daily Progress */}
              {issue.daily_progress && issue.daily_progress.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-gray-700 mb-2">Work Progress</h3>
                  <div className="space-y-2">
                    {issue.daily_progress.map(p => (
                      <div key={p.id} className="text-xs text-gray-600 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between">
                          <span className="font-medium text-indigo-600">{p.user_name}</span>
                          <span className="text-gray-400">{p.bs_created_at}</span>
                        </div>
                        <p className="mt-0.5">{p.notes.substring(0, 150)}{p.notes.length > 150 ? '...' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs sm:text-sm font-medium text-indigo-900 mb-3">{t('status.share')}</p>
                <div className="flex flex-wrap gap-2">
                  <ShareButton referenceCode={issue.reference_code} compact />
                  <Link href={route('issues.show-reference', issue.reference_code)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('status.timeline')}
                  </Link>
                </div>
              </div>

              {/* Feedback prompt */}
              {issue.status === 'resolved' && !issue.rating && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="text-xs sm:text-sm font-medium text-green-900 mb-2">{t('status.feedback_prompt')}</p>
                  <Link href={route('issues.show-reference', issue.reference_code)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {t('status.feedback_btn')}
                  </Link>
                </div>
              )}

              {issue.rating && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-center">
                  <p className="text-xs sm:text-sm font-medium text-amber-800">
                    ⭐ {t('reference.thanks', { rating: issue.rating })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
