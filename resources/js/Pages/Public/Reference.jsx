import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useLanguage } from '../../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../../Components/UI/Badge';
import ProgressSteps from '../../Components/UI/ProgressSteps';
import ShareButton from '../../Components/Feed/ShareButton';
import CommentSection from '../../Components/Comments/CommentSection';

export default function Reference({ issue }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header bar */}
        <div className="flex items-center gap-3 mb-5">
          <Link href={route('dashboard')} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {isNp ? 'पछाडि' : 'Back'}
          </Link>
          <span className="text-gray-300">|</span>
          <span className="font-mono text-sm font-bold text-indigo-600">{issue.reference_code}</span>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Issue Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-1">{issue.title || issue.description?.substring(0, 50)}</h1>

              {/* Photo */}
              {issue.photo_path && (
                <div className="mt-4 -mx-5 sm:-mx-7">
                  <img src={issue.photo_path} alt="" className="w-full max-h-72 object-cover" />
                </div>
              )}

              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{isNp ? 'विवरण' : 'Description'}</p>
                  <p className="text-sm text-gray-800 mt-1 leading-relaxed whitespace-pre-wrap">{issue.description}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                  {[
                    { label: isNp ? 'संस्था' : 'Organization', value: issue.organization },
                    { label: isNp ? 'श्रेणी' : 'Category', value: issue.category_name || issue.category },
                    { label: isNp ? 'स्थान' : 'Location', value: issue.location },
                    { label: isNp ? 'मिति' : 'Date', value: issue.bs_created_at || '' },
                  ].filter(i => i.value).map((item, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl px-3 py-2.5">
                      <p className="text-[9px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-xs font-semibold text-gray-900 mt-0.5 truncate">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upvote + Comment counts */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">{issue.upvotes_count || 0}</span>
                  <span className="text-gray-400">{isNp ? 'प्रतिक्रिया' : 'reactions'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium">{issue.comments_count || 0}</span>
                  <span className="text-gray-400">{isNp ? 'टिप्पणी' : 'comments'}</span>
                </div>
              </div>
            </div>

            {/* Resolution Summary */}
            {issue.status === 'resolved' && issue.resolution_summary && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 sm:p-7">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="text-sm font-bold text-green-800">{isNp ? 'समाधान विवरण' : 'Resolution'}</h2>
                </div>
                <div className="bg-white rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{issue.resolution_summary}</p>
                </div>
                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <span>{isNp ? 'समाधानकर्ता' : 'Resolved by'}: {issue.resolved_by_name || 'Staff'}</span>
                  {issue.resolved_at && (
                    <span>{new Date(issue.resolved_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  )}
                </div>
              </div>
            )}

            {/* Daily Progress */}
            {issue.daily_progress && issue.daily_progress.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
                <h2 className="text-sm font-bold text-gray-900 mb-4">{isNp ? 'कार्य प्रगति' : 'Work Progress'}</h2>
                <div className="space-y-4">
                  {issue.daily_progress.map(p => (
                    <div key={p.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-xs font-medium text-indigo-600">{p.user_name}</p>
                        <p className="text-[10px] text-gray-400">{p.bs_created_at}</p>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.notes}</p>
                      {p.photos && p.photos.length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {p.photos.map((photo, i) => (
                            <img key={i} src={`/storage/${photo}`} alt="Progress photo"
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                              onClick={() => window.open(`/storage/${photo}`, '_blank')}
                              onError={e => { e.target.style.display = 'none'; }} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Timeline */}
            {issue.events && issue.events.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
                <h2 className="text-sm font-bold text-gray-900 mb-4">{isNp ? 'अद्यावधिकहरू' : 'Updates'}</h2>
                <ProgressSteps currentStatus={issue.status} events={issue.events} />
              </div>
            )}

            {/* Comments */}
            {issue.comments && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7">
                <h2 className="text-sm font-bold text-gray-900 mb-4">{isNp ? 'टिप्पणीहरू' : 'Comments'}</h2>
                <CommentSection issueId={issue.id} comments={issue.comments} />
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-4">
            {/* Quick actions card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-3">{isNp ? 'कार्यहरू' : 'Actions'}</h3>
              <div className="space-y-2">
                <Link href={route('feed')}
                  className="flex items-center gap-2 w-full px-3 py-2.5 bg-gray-50 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  {isNp ? 'सार्वजनिक फीड' : 'Browse Feed'}
                </Link>
                <Link href={route('issues.create')}
                  className="flex items-center gap-2 w-full px-3 py-2.5 bg-indigo-50 rounded-xl text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {isNp ? 'नयाँ उजुरी' : 'New Complaint'}
                </Link>
              </div>
            </div>

            {/* Share card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
              <h3 className="text-xs font-bold text-gray-900 mb-2">{isNp ? 'सेयर गर्नुहोस्' : 'Share'}</h3>
              <p className="text-[10px] text-gray-500 mb-3">{isNp ? 'यो उजुरी अरूलाई पनि देखाउनुहोस्' : 'Let others know about this complaint'}</p>
              <ShareButton referenceCode={issue.reference_code} />
            </div>

            {/* Feedback */}
            {issue.status === 'resolved' && !issue.rating && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5">
                <h3 className="text-xs font-bold text-gray-900 mb-3">{isNp ? 'प्रतिक्रिया' : 'Feedback'}</h3>
                <form onSubmit={handleFeedback} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-medium text-gray-500 mb-1.5">{isNp ? 'मूल्याङ्कन' : 'Rating'}</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} type="button" onClick={() => setData('rating', star)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-110 ${
                            data.rating >= star ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-amber-50'
                          }`}
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea value={data.feedback_comment} onChange={e => setData('feedback_comment', e.target.value)}
                    rows={2} className="w-full rounded-lg border-gray-200 border px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                    placeholder={isNp ? 'टिप्पणी (वैकल्पिक)' : 'Comment (optional)'} />
                  <button type="submit" disabled={processing || !data.rating}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2 rounded-lg text-xs font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all"
                  >
                    {processing ? t('submit.submitting') : (isNp ? 'पठाउनुहोस्' : 'Submit')}
                  </button>
                </form>
              </div>
            )}

            {issue.rating && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
                <p className="text-xs font-medium text-green-800">
                  {isNp ? 'धन्यवाद!' : t('reference.thanks', { rating: issue.rating })}
                  {issue.feedback_comment && <span className="block mt-1 text-green-600">&ldquo;{issue.feedback_comment}&rdquo;</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
