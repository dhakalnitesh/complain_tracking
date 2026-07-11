import { Head, Link } from '@inertiajs/react';
import { route } from '../ziggy';

export default function Error({ status }) {
  const title = {
    403: 'Forbidden',
    404: 'Page Not Found',
    419: 'Session Expired',
    429: 'Too Many Requests',
    500: 'Server Error',
    503: 'Service Unavailable',
  }[status] || 'Error';

  const description = {
    403: 'You do not have permission to access this page.',
    404: 'The page you are looking for does not exist.',
    419: 'Your session has expired. Please refresh and try again.',
    429: 'Too many requests. Please wait and try again.',
    500: 'Something went wrong on our end. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again later.',
  }[status] || 'An unexpected error occurred.';

  return (
    <>
      <Head title={`${status} - ${title}`} />
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-7xl font-extrabold text-indigo-600">{status}</h1>
          <h2 className="text-xl font-semibold text-gray-800 mt-2">{title}</h2>
          <p className="text-gray-500 mt-2">{description}</p>
          <Link href={route('dashboard')} className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    </>
  );
}
