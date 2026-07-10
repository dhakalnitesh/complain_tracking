import { useState } from 'react';
import { router } from '@inertiajs/react';
import { useLanguage } from '../../Context/LanguageContext';
import SearchSelect from '../UI/SearchSelect';

export default function FeedFilters({ categories, locations, currentFilters }) {
  const { t, lang } = useLanguage();
  const [filters, setFilters] = useState({
    category_id: currentFilters?.category_id || '',
    status: currentFilters?.status || '',
    location_id: currentFilters?.location_id || '',
    sort: currentFilters?.sort || 'latest',
  });

  function applyFilters() {
    const params = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== '') params[key] = val;
    });
    router.get(route('feed'), params, { preserveState: true, replace: true });
  }

  function clearFilters() {
    setFilters({ category_id: '', status: '', location_id: '', sort: 'latest' });
    router.get(route('feed'), {}, { preserveState: true, replace: true });
  }

  function updateFilter(key, value) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    const params = {};
    Object.entries(next).forEach(([k, v]) => {
      if (v && v !== '') params[k] = v;
    });
    router.get(route('feed'), params, { preserveState: true, replace: true });
  }

  const hasFilters = filters.category_id || filters.status || filters.location_id;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <select
          value={filters.status}
          onChange={e => updateFilter('status', e.target.value)}
          className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">{lang === 'np' ? 'सबै स्थिति' : 'All Status'}</option>
          <option value="received">{lang === 'np' ? 'प्राप्त' : 'Received'}</option>
          <option value="in_progress">{lang === 'np' ? 'प्रक्रियामा' : 'In Progress'}</option>
          <option value="resolved">{lang === 'np' ? 'समाधान' : 'Resolved'}</option>
        </select>

        <select
          value={filters.sort}
          onChange={e => updateFilter('sort', e.target.value)}
          className="text-xs sm:text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="latest">{lang === 'np' ? 'नयाँ' : 'Latest'}</option>
          <option value="oldest">{lang === 'np' ? 'पुरानो' : 'Oldest'}</option>
        </select>

        <SearchSelect
          options={categories?.map(c => ({ value: String(c.id), label: c.name })) || []}
          value={filters.category_id}
          onChange={val => updateFilter('category_id', val)}
          placeholder={lang === 'np' ? 'श्रेणी' : 'Category'}
          className="min-w-[130px]"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <SearchSelect
          options={locations?.map(l => ({ value: String(l.id), label: l.name })) || []}
          value={filters.location_id}
          onChange={val => updateFilter('location_id', val)}
          placeholder={lang === 'np' ? 'स्थान' : 'Location'}
          className="min-w-[130px]"
        />

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors shrink-0"
          >
            {lang === 'np' ? 'सफा गर्नुहोस्' : 'Clear'}
          </button>
        )}
      </div>
    </div>
  );
}
