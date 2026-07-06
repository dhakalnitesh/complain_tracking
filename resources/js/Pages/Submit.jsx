import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from '../ziggy';
import { useLanguage } from '../Context/LanguageContext';
import VoiceInput from '../Components/VoiceInput';
import { useState } from 'react';

export default function Submit({ locations, organizations, selected_organization, categories, priorities }) {
  const { t } = useLanguage();
  const { auth } = usePage().props;
  const user = auth?.user;
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showVoice, setShowVoice] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    organization_id: selected_organization?.id || '',
    category: '',
    priority: 'medium',
    location_id: '',
    description: '',
    reporter_name: user?.name || '',
    reporter_phone: '',
    reporter_email: user?.email || '',
    is_anonymous: !user,
    photo: null,
  });

  function handleSubmit(e) {
    e.preventDefault();
    post('/issues', {
      forceFormData: true,
      onSuccess: () => {
        reset('category', 'location_id', 'description', 'photo');
        setPhotoPreview(null);
      },
    });
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    setData('photo', file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else setPhotoPreview(null);
  }

  function handleVoiceText(text) {
    setData('description', data.description + (data.description ? ' ' : '') + text);
  }

  const filteredLocations = data.organization_id
    ? locations.filter(l => l.organization_id === data.organization_id)
    : [];

  function groupLocations(locs) {
    const parents = locs.filter(l => !l.parent_id);
    const children = locs.filter(l => l.parent_id);
    const result = [];
    const added = new Set();
    for (const p of parents) {
      const kids = children.filter(c => c.parent_id === p.id);
      if (kids.length) { result.push({ ...p, children: kids }); kids.forEach(k => added.add(k.id)); }
      else result.push({ ...p, children: [] });
    }
    for (const c of children.filter(c => !added.has(c.id))) result.push({ ...c, children: [] });
    return result;
  }

  const groupedLocations = groupLocations(filteredLocations);

  function handleOrgChange(orgId) {
    setData('organization_id', orgId);
    setData('location_id', '');
  }

  return (
    <>
      <Head title={`${t('submit.title')} - ${t('app.name')}`} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Trust Banner */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-3 sm:p-4 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-indigo-900">{t('submit.desc')}</p>
            <p className="text-[10px] sm:text-xs text-indigo-600/70 mt-0.5">
              {data.is_anonymous ? '✓ ' + t('submit.anonymous_desc') : t('submit.optional')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" encType="multipart/form-data">
          {/* Issue Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 sm:p-6 space-y-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('submit.issue_details')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.org_label')} *</label>
                <select value={data.organization_id} onChange={e => handleOrgChange(parseInt(e.target.value))}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm">
                  <option value="">{t('submit.org_label')}</option>
                  {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
                {errors.organization_id && <p className="text-red-500 text-xs mt-1">{errors.organization_id}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.category_label')} *</label>
                <select value={data.category} onChange={e => setData('category', e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm">
                  <option value="">{t('submit.category_label')}</option>
                  {categories.map(cat => <option key={cat} value={cat}>{t(`categories.${cat}`)}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.priority_label')} *</label>
                <select value={data.priority} onChange={e => setData('priority', e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm">
                  {Object.entries(priorities).map(([key, label]) => (
                    <option key={key} value={key}>
                      {t(`priorities.${key}`)} {key === 'critical' ? '🚨' : key === 'high' ? '⚠️' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.location_label')} *</label>
                <select value={data.location_id} onChange={e => setData('location_id', parseInt(e.target.value))}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-sm">
                  <option value="">{t('submit.location_label')}</option>
                  {groupedLocations.map(loc => (
                    <optgroup key={loc.id} label={loc.name}>
                      {loc.children.length > 0
                        ? loc.children.map(child => <option key={child.id} value={child.id}>{child.name}</option>)
                        : <option value={loc.id}>{loc.name}</option>}
                    </optgroup>
                  ))}
                </select>
                {errors.location_id && <p className="text-red-500 text-xs mt-1">{errors.location_id}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">{t('submit.desc_label')} *</label>
                <VoiceInput onText={handleVoiceText} disabled={processing} />
              </div>
              <textarea value={data.description} onChange={e => setData('description', e.target.value)}
                rows={4} className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                placeholder={t('submit.desc_placeholder')} />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.photo_label')}</label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={handlePhotoChange}
                  className="w-full text-xs sm:text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                {photoPreview && <img src={photoPreview} alt="Preview" className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-gray-200 shrink-0" />}
              </div>
              {errors.photo && <p className="text-red-500 text-xs mt-1">{errors.photo}</p>}
            </div>
          </div>

          {/* Your Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/60 p-4 sm:p-6 space-y-4">
            <h2 className="text-xs sm:text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('submit.your_info')}
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-400 -mt-2">{t('submit.optional')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.name_label')}</label>
                <input type="text" value={data.reporter_name} onChange={e => setData('reporter_name', e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder={t('submit.optional')} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.phone_label')}</label>
                <input type="tel" value={data.reporter_phone} onChange={e => setData('reporter_phone', e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="98XXXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{t('submit.email_label')}</label>
              <input type="email" value={data.reporter_email} onChange={e => setData('reporter_email', e.target.value)}
                className="w-full rounded-lg border-gray-300 border px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder={t('submit.optional')} />
            </div>

            <label className="flex items-start sm:items-center gap-3 cursor-pointer p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <input type="checkbox" checked={data.is_anonymous} onChange={e => setData('is_anonymous', e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5 sm:mt-0" />
              <div>
                <span className="text-xs sm:text-sm font-medium text-gray-900">{t('submit.anonymous_label')}</span>
                <p className="text-[10px] sm:text-xs text-gray-500">{t('submit.anonymous_desc')}</p>
              </div>
            </label>
          </div>

          <button type="submit" disabled={processing}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 sm:py-3.5 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-sm sm:text-base active:scale-[0.99]">
            {processing ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('submit.submitting')}
              </span>
            ) : t('submit.submit_btn')}
          </button>
        </form>
      </div>
    </>
  );
}
