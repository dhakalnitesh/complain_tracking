import { useLanguage } from '../Context/LanguageContext';

export default function LanguageToggle({ compact = false }) {
  const { lang, toggleLang } = useLanguage();

  if (compact) {
    return (
      <button
        onClick={toggleLang}
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all hover:bg-gray-100"
        title={lang === 'en' ? 'Switch to Nepali' : 'Switch to English'}
      >
        <span className={`${lang === 'en' ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>EN</span>
        <span className="text-gray-300">|</span>
        <span className={`${lang === 'np' ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>ने</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-gray-100 border border-gray-200"
    >
      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
        {lang === 'en' ? 'ने' : 'EN'}
      </span>
      <span>{lang === 'en' ? 'नेपाली' : 'English'}</span>
    </button>
  );
}
