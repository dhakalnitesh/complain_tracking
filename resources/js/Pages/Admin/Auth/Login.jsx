import { Head, Link, useForm } from '@inertiajs/react';
// import { route } from '../../../ziggy';
import { route } from 'ziggy-js';
import { useLanguage } from '../../../Context/LanguageContext';
import { useState } from 'react';

export default function AdminLogin() {
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
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
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={data.password} onChange={e => setData('password', e.target.value)}
                    className="w-full rounded-lg border-gray-300 border px-3 py-2.5 sm:py-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPassword ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
