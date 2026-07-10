import { Link } from '@inertiajs/react';
import { route } from '../ziggy';
import { useLanguage } from '../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from './Badge';
import { toBsString } from '../utils/bsDate';
import UpvoteButton from './UpvoteButton';

export default function ComplaintCard({ issue }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';

  return (
    <div className="bg-white rounded-xl border border-gray-200/60 hover:shadow-md hover:border-gray-300 transition-all overflow-hidden group">
      <Link
        href={route('issues.show-reference', issue.reference_code)}
        className="block"
      >
      {issue.has_photo && issue.photo_path && (
        <div className="relative aspect-[16/9] sm:aspect-[16/10] bg-gray-100 overflow-hidden">
          <img
            src={issue.photo_path}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
          <span className="font-mono text-[10px] sm:text-xs font-bold text-gray-500">
            {issue.reference_code}
          </span>
          <StatusBadge status={issue.status} />
          <PriorityBadge priority={issue.priority} />
        </div>

        {issue.category_name && (
          <span className="inline-block text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1.5">
            {issue.category_name}
          </span>
        )}

        <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 leading-relaxed">
          {issue.description}
        </p>

        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 min-w-0">
            <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">{issue.location || issue.organization}</span>
          </div>

          <span className="text-[10px] sm:text-xs text-gray-400 shrink-0" title={isNp ? issue.bs_date : issue.created_at}>
            {isNp ? issue.bs_date_short : new Date(issue.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <UpvoteButton
            issueId={issue.id}
            initialCount={issue.upvotes_count || 0}
            initialUpvoted={issue.has_upvoted || false}
          />
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{issue.comments_count || 0}</span>
          </span>
        </div>
      </div>
      </Link>
    </div>
  );
}
