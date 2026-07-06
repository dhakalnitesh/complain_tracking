import { Head, Link, useForm } from '@inertiajs/react';
import { route } from '../../ziggy';
import { useLanguage } from '../../Context/LanguageContext';

export default function AdminLogin() {
  const { t } = useLanguage();
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    post(route('admin.login'));
  }

  return (
    <>
      <Head title={`${t('nav.admin')} ${t('auth.login_title')}`} />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{t('nav.admin')} {t('auth.login_title')}</h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{t('trust.encrypted_desc')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('auth.email_label')}</label>
                <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="admin@nagariksarokar.com" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('auth.password_label')}</label>
                <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 sm:py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
              </div>
              <button type="submit" disabled={processing}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 transition-all text-sm">
                {processing ? t('submit.submitting') : t('auth.login_btn')}
              </button>
            </form>

            <p className="text-center mt-4">
              <Link href={route('dashboard')} className="text-xs sm:text-sm text-indigo-600 hover:text-indigo-800">
                &larr; {t('nav.home')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
