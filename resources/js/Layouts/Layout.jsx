import { Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useLanguage } from '../Context/LanguageContext';
import LanguageToggle from '../Components/LanguageToggle';
import TrackModal from '../Components/TrackModal';
import Footer from '../Components/Footer';
import { useToast } from '../Components/UI/Toast';
import { useState, useEffect } from 'react';

export default function Layout({ children }) {
  const page = usePage();
  const { auth, flash } = page.props;
  const isDashboard = page.component === 'Dashboard';
  const { t, lang } = useLanguage();
  const { addToast } = useToast();
  const [trackOpen, setTrackOpen] = useState(false);

  useEffect(() => {
    if (flash?.success) addToast(flash.success, 'success');
    if (flash?.error) addToast(flash.error, 'error');
  }, [flash, addToast]);
  const user = auth?.user;
  const [mobileOpen, setMobileOpen] = useState(false);

  const homeHref = user?.organization?.slug ? route('org.dashboard', user.organization.slug) : route('dashboard');

  const navLinks = [
    { href: homeHref, label: t('nav.home'), icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: route('feed'), label: t('nav.feed'), icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z' },
    { href: route('issues.create'), label: t('nav.submit'), icon: 'M12 4v16m8-8H4' },
  ];

  if (user?.is_staff) {
    navLinks.push({ href: route('staff.issues.index'), label: 'My Issues', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50" dir={lang === 'np' ? 'auto' : 'ltr'}>
      {/* Top Navigation */}
      <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href={homeHref} className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="hidden xs:block">
                <span className="font-bold text-gray-900 text-sm sm:text-base tracking-tight">{t('app.name')}</span>
                <span className="hidden sm:inline text-[10px] sm:text-xs text-gray-400 ml-1.5 font-medium">{t('app.subtitle')}</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => setTrackOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('nav.track')}
              </button>

              {user?.is_admin && (
                <Link href={route('admin.dashboard')} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {t('nav.admin')}
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-1 sm:gap-2">
              <LanguageToggle compact />

              {/* Desktop Auth */}
              <div className="hidden md:flex items-center gap-2">
                {user ? (
                  <Link href={route('logout')} method="post" as="button" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('nav.logout')}
                  </Link>
                ) : (
                  <>
                    <Link href={route('login')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg transition-all">
                      {t('nav.login')}
                    </Link>
                    <Link href={route('register')} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg hover:from-indigo-700 hover:to-blue-700 shadow-sm transition-all">
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white animate-slide-down">
            <div className="px-3 py-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              ))}
              <button
                onClick={() => { setMobileOpen(false); setTrackOpen(true); }}
                className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('nav.track')}
              </button>

              <div className="border-t border-gray-100 pt-2 mt-2">
                {user ? (
                  <>
                    {user.is_admin && (
                      <Link href={route('admin.dashboard')} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {t('nav.admin')}
                      </Link>
                    )}
                    {user.is_staff && (
                      <Link href={route('staff.issues.index')} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        My Issues
                      </Link>
                    )}
                    <Link href={route('logout')} method="post" as="button" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      {t('nav.logout')}
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href={route('login')} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {t('nav.login')}
                    </Link>
                    <Link href={route('register')} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      {t('nav.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <TrackModal open={trackOpen} onClose={() => setTrackOpen(false)} />

      {/* Trust Bar — only on public dashboard */}
      {isDashboard && (
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-blue-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21', key: 'anonymous' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', key: 'encrypted' },
              { icon: 'M9 5l7 7-7 7', key: 'tracking' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', key: 'no_retaliation' },
            ].map(item => (
              <div key={item.key} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                </div>
                <p className="text-xs sm:text-sm font-medium text-white">{t(`trust.${item.key}`)}</p>
                <p className="text-[10px] sm:text-xs text-blue-200/70 mt-0.5">{t(`trust.${item.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      <Footer />
    </div>
  );
}
