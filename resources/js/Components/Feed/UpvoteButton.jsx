import { useState } from 'react';
import { router } from '@inertiajs/react';

export default function UpvoteButton({ issueId, initialCount = 0, initialUpvoted = false }) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialUpvoted);
  const [animating, setAnimating] = useState(false);

  function handleToggle() {
    setAnimating(true);
    const wasUpvoted = upvoted;
    setUpvoted(!upvoted);
    setCount(c => wasUpvoted ? c - 1 : c + 1);

    router.post(route('upvote.toggle', issueId), {}, {
      preserveState: true,
      preserveScroll: true,
      onError: () => {
        setUpvoted(wasUpvoted);
        setCount(c => wasUpvoted ? c + 1 : c - 1);
      },
      onFinish: () => setAnimating(false),
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={animating}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
        upvoted
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700'
      }`}
    >
      <svg
        className={`w-3.5 h-3.5 transition-transform ${animating ? 'scale-125' : ''} ${upvoted ? 'fill-current' : ''}`}
        fill={upvoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      <span>{count}</span>
    </button>
  );
}
