import { useLanguage } from '../Context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-white/50 border-t border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{t('app.name')}</span>
            <span className="text-gray-300">|</span>
            <span>{t('footer.tagline') || "Nepal's Complaint Management System"}</span>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400">
            &copy; {new Date().getFullYear()} {t('app.name')}. Built with &hearts; {t('app.subtitle')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
