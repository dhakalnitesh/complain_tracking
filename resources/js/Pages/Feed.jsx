import { Head, Link } from '@inertiajs/react';
import { route } from '../ziggy';
import { useLanguage } from '../Context/LanguageContext';
import ComplaintCard from '../Components/ComplaintCard';
import FeedFilters from '../Components/FeedFilters';
import { useState, useEffect, useCallback, useRef } from 'react';

export default function Feed({ issues, filters, categories, locations }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';

  return (
    <>
      <Head title={`${t('app.name')} - ${isNp ? 'सार्वजनिक फीड' : 'Public Feed'}`} />

      {/* Mobile SOS */}
      <div className="fixed bottom-4 right-4 z-40 md:hidden">
        <Link
          href={route('issues.create') + '?priority=critical'}
          className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700 transition-all hover:scale-110 active:scale-95"
          title={t('sos.button')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                {isNp ? 'सार्वजनिक उजुरी फीड' : 'Public Complaints Feed'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200/80 mt-0.5">
                {isNp ? 'नागरिकहरूले रिपोर्ट गरेका उजुरीहरू हेर्नुहोस्' : 'Browse complaints reported by citizens'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={route('issues.create')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-900 text-sm font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('submit.submit_btn')}
              </Link>
              <Link
                href={route('status.check')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('nav.track')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-3 relative z-10 mb-4 sm:mb-6">
        <div className="bg-white rounded-xl border border-gray-200/60 p-3 sm:p-4 shadow-sm">
          <FeedFilters
            categories={categories}
            locations={locations}
            currentFilters={filters}
          />
        </div>
      </div>

      {/* SOS Desktop */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <Link
          href={route('issues.create') + '?priority=critical'}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-full hover:bg-red-100 border border-red-200 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {t('sos.title')}
        </Link>
      </div>

      {/* Feed Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        {issues.data.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200/60 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-gray-700 mb-1">
              {isNp ? 'कुनै उजुरी भेटिएन' : 'No complaints found'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mb-4">
              {isNp ? 'कृपया फिल्टर परिवर्तन गर्नुहोस् वा नयाँ उजुरी दिनुहोस्।' : 'Try changing filters or submit a new complaint.'}
            </p>
            <Link
              href={route('issues.create')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {isNp ? 'उजुरी दिनुहोस्' : 'Submit Complaint'}
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {issues.data.map(issue => (
                <ComplaintCard key={issue.id} issue={issue} />
              ))}
            </div>

            {/* Pagination */}
            {issues.links && issues.links.length > 3 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                {issues.links.map((link, i) => {
                  if (!link.url) {
                    return (
                      <span key={i} className="px-3 py-1.5 text-xs text-gray-400 rounded-lg">
                        {link.label}
                      </span>
                    );
                  }
                  const urlObj = new URL(link.url);
                  const params = new URLSearchParams(urlObj.search);
                  const labelText = link.label.replace(/&laquo;|&raquo;/g, '').trim();
                  return (
                    <Link
                      key={i}
                      href={route('feed', Object.fromEntries(params))}
                      preserveState
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        link.active
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      dangerouslySetInnerHTML={undefined}
                    >
                      {labelText || link.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
