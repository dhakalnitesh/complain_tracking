import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../ziggy';
import { useLanguage } from '../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../Components/Badge';
import ProgressSteps from '../Components/ProgressSteps';
import ShareButton from '../Components/ShareButton';

export default function Reference({ issue }) {
  const { t } = useLanguage();
  const { data, setData, post, processing, errors } = useForm({
    rating: 0,
    feedback_comment: '',
  });

  function handleFeedback(e) {
    e.preventDefault();
    post(route('issues.feedback', issue.id), { preserveScroll: true });
  }

  return (
    <>
      <Head title={`${t('app.name')} - ${issue.reference_code}`} />

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-5 sm:p-8 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t('reference.success_title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-5">{t('reference.success_desc')}</p>

          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5 sm:p-6 mb-5 border border-indigo-100">
            <p className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1">{t('status.reference')}</p>
            <p className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-widest font-mono">{issue.reference_code}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-left text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{t('status.organization')}</span>
              <span className="font-medium text-gray-900">{issue.organization}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{t('status.category')}</span>
              <span className="font-medium text-gray-900">{issue.category}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{t('status.location')}</span>
              <span className="font-medium text-gray-900">{issue.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{t('status.priority')}</span>
              <PriorityBadge priority={issue.priority} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">{t('status.status')}</span>
              <StatusBadge status={issue.status} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5">
            <Link href={route('dashboard')}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-xs sm:text-sm active:scale-[0.98]">
              {t('reference.dashboard')}
            </Link>
            <Link href={route('status.check') + '?code=' + issue.reference_code}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 transition-all text-xs sm:text-sm active:scale-[0.98]">
              {t('reference.track')}
            </Link>
          </div>

          {/* Share */}
          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">{t('reference.share_title')}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 mb-3">{t('reference.share_desc')}</p>
            <ShareButton referenceCode={issue.reference_code} />
          </div>
        </div>

        {/* Progress Timeline */}
        {issue.events && issue.events.length > 0 && (
          <div className="mt-5 bg-white rounded-xl border border-gray-200/60 p-4 sm:p-5">
            <ProgressSteps currentStatus={issue.status} events={issue.events} />
          </div>
        )}

        {/* Feedback Form */}
        {issue.status === 'resolved' && !issue.rating && (
          <div className="mt-5 bg-white rounded-xl border border-gray-200/60 p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4">{t('reference.feedback_title')}</h3>
            <form onSubmit={handleFeedback} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">{t('reference.rating_label')}</label>
                <div className="flex gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setData('rating', star)}
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all active:scale-110 ${
                        data.rating >= star
                          ? 'bg-amber-100 text-amber-600 scale-110'
                          : 'bg-gray-100 text-gray-400 hover:bg-amber-50'
                      }`}>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
                {errors.rating && <p className="text-red-500 text-xs mt-1">{errors.rating}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('reference.comment_label')}</label>
                <textarea value={data.feedback_comment} onChange={e => setData('feedback_comment', e.target.value)}
                  rows={3} className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  placeholder={t('reference.comment_placeholder')} />
              </div>
              <button type="submit" disabled={processing || !data.rating}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm active:scale-[0.99]">
                {processing ? t('submit.submitting') : t('reference.submit_feedback')}
              </button>
            </form>
          </div>
        )}

        {issue.rating && (
          <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-xs sm:text-sm font-medium text-green-800">
              {t('reference.thanks', { rating: issue.rating })}
              {issue.feedback_comment && <> &mdash; "{issue.feedback_comment}"</>}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
