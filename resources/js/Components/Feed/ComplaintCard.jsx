import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useLanguage } from '../../Context/LanguageContext';
import { StatusBadge, PriorityBadge } from '../UI/Badge';
import { toBsString } from '../../utils/bsDate';
import UpvoteButton from './UpvoteButton';
import CommentSection from '../Comments/CommentSection';
import PhotoLightbox from './PhotoLightbox';

export default function ComplaintCard({ issue }) {
  const { t, lang } = useLanguage();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const bsDate = issue.bs_date_short || toBsString(issue.created_at, 'short');
  const fullBsDate = issue.bs_date || toBsString(issue.created_at, 'datetime');

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200/60 hover:shadow-md transition-all overflow-hidden group">
        {/* Photo */}
        {issue.has_photo && issue.photo_path && (
          <div
            className="relative aspect-[16/9] bg-gray-100 overflow-hidden cursor-pointer"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={issue.photo_path}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {lang === 'np' ? 'ठूलो हेर्नुहोस्' : 'View full size'}
              </div>
            </div>
          </div>
        )}

        {/* Video */}
        {issue.has_video && issue.video_path && (
          <div className="relative aspect-[16/9] bg-black overflow-hidden">
            <video
              src={issue.video_path}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
              playsInline
            />
          </div>
        )}

        {/* Content */}
        <div className="p-3 sm:p-4">
          {/* Header: ref + badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
            <Link
              href={route('issues.show-reference', issue.reference_code)}
              className="font-mono text-[10px] sm:text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {issue.reference_code}
            </Link>
            <StatusBadge status={issue.status} />
            <PriorityBadge priority={issue.priority} />
          </div>

          {/* Category tag */}
          {issue.category_name && (
            <span className="inline-block text-[10px] sm:text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mb-1.5">
              {issue.category_name}
            </span>
          )}

          {/* Title */}
          <Link
            href={route('issues.show-reference', issue.reference_code)}
            className="block"
          >
            <p className="text-sm font-semibold text-gray-900 mb-1 leading-snug">
              {issue.title || issue.description?.substring(0, 50)}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {issue.description}
            </p>
          </Link>

          {/* Meta: location + date */}
          <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 min-w-0">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{issue.location || issue.organization}</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 shrink-0" title={fullBsDate}>
              {bsDate}
            </span>
          </div>

          {issue.merged_count > 0 && (
            <div className="mt-1 text-[10px] text-gray-400">
              {issue.merged_count + 1} {(lang === 'np' ? 'जनाले रिपोर्ट गरे' : 'people reported this')}
            </div>
          )}

          {/* Actions: Like + Comment count + Track */}
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <UpvoteButton
                issueId={issue.id}
                initialCount={issue.upvotes_count || 0}
                initialUpvoted={issue.has_upvoted || false}
              />
              {issue.social_proof && (
                <span className="text-[10px] text-gray-400 ml-0.5">{issue.social_proof}</span>
              )}
            </div>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                showComments
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{issue.comments_count || 0}</span>
            </button>
          </div>

          {/* Inline Comment Section */}
          {showComments && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <CommentSection issueId={issue.id} comments={[]} />
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && issue.photo_path && (
        <PhotoLightbox
          src={issue.photo_path}
          alt={issue.description}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
