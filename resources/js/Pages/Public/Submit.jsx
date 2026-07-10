import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from '../../ziggy';
import { useLanguage } from '../../Context/LanguageContext';
import VoiceInput from '../../Components/UI/VoiceInput';
import SearchSelect from '../../Components/UI/SearchSelect';
import { useState } from 'react';

const STEPS = ['issue_details', 'description', 'review'];

export default function Submit({ locations, organizations, selected_organization, categories, priorities }) {
  const { t, lang } = useLanguage();
  const { auth } = usePage().props;
  const user = auth?.user;
  const [step, setStep] = useState(0);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    organization_id: selected_organization?.id || '',
    category_id: '',
    priority: 'medium',
    location_id: '',
    description: '',
    reporter_name: user?.name || '',
    reporter_phone: '',
    reporter_email: user?.email || '',
    is_anonymous: !user,
    sms_opt_in: false,
    photo: null,
    video: null,
    website: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    post('/issues', {
      forceFormData: true,
      onSuccess: () => {
        reset('category_id', 'location_id', 'description', 'photo', 'video');
        setPhotoPreview(null);
        setVideoPreview(null);
        setStep(0);
      },
    });
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    setData('photo', file);
    setData('video', null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else setPhotoPreview(null);
    setVideoPreview(null);
  }

  function handleVideoChange(e) {
    const file = e.target.files[0];
    setData('video', file);
    setData('photo', null);
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
    } else setVideoPreview(null);
    setPhotoPreview(null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setData('photo', file);
      setData('video', null);
      setPhotoPreview(URL.createObjectURL(file));
      setVideoPreview(null);
    } else if (file && file.type.startsWith('video/')) {
      setData('video', file);
      setData('photo', null);
      setVideoPreview(URL.createObjectURL(file));
      setPhotoPreview(null);
    }
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

  function canProceed() {
    if (step === 0) return data.organization_id && data.category_id && data.priority && data.location_id;
    if (step === 1) return data.description && data.description.length >= 10;
    return true;
  }

  function stepError() {
    if (step === 0) {
      if (!data.organization_id) return lang === 'np' ? 'कृपया संस्था चयन गर्नुहोस्' : 'Please select an organization';
      if (!data.category_id) return lang === 'np' ? 'कृपया श्रेणी चयन गर्नुहोस्' : 'Please select a category';
      if (!data.location_id) return lang === 'np' ? 'कृपया स्थान चयन गर्नुहोस्' : 'Please select a location';
    }
    if (step === 1) {
      if (!data.description) return lang === 'np' ? 'कृपया विवरण लेख्नुहोस्' : 'Please describe your issue';
      if (data.description.length < 10) return lang === 'np' ? 'कम्तिमा १० अक्षर लेख्नुहोस्' : 'At least 10 characters';
    }
    return null;
  }

  const showError = stepError();

  return (
    <>
      <Head title={`${t('submit.title')} - ${t('app.name')}`} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex items-center gap-2 transition-all ${
                    i <= step ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md'
                      : i === step
                      ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md ring-4 ring-indigo-100 scale-110'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {i < step ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    i <= step ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {i === 0 ? t('submit.issue_details') : i === 1 ? t('submit.desc_label') : t('submit.your_info')}
                  </span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3 relative">
                    <div className="absolute inset-0 bg-gray-200 rounded" />
                    <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-600 rounded transition-all duration-500 ${
                      i < step ? 'w-full' : 'w-0'
                    }`} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="transition-all duration-300">
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            {/* Honeypot - invisible to humans, bots fill it */}
            <div className="absolute opacity-0 pointer-events-none" tabIndex={-1} aria-hidden="true">
              <input type="text" name="website" autoComplete="off" value={data.website} onChange={e => setData('website', e.target.value)} tabIndex={-1} />
            </div>
            {/* Step 1: Issue Details */}
            {step === 0 && (
              <div className="animate-fade-in">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{t('submit.issue_details')}</h2>
                      <p className="text-xs text-gray-400">{lang === 'np' ? 'संस्था, श्रेणी र स्थान चयन गर्नुहोस्' : 'Select organization, category, and location'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.org_label')} *</label>
                      <SearchSelect
                        options={organizations.map(o => ({ value: o.id, label: o.name }))}
                        value={data.organization_id}
                        onChange={v => handleOrgChange(v)}
                        placeholder={lang === 'np' ? 'संस्था खोज्नुहोस्...' : 'Search organization...'}
                        error={errors.organization_id}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.category_label')} *</label>
                      <SearchSelect
                        options={categories.map(c => ({ value: c.id, label: c.name }))}
                        value={data.category_id}
                        onChange={v => setData('category_id', v)}
                        placeholder={lang === 'np' ? 'श्रेणी खोज्नुहोस्...' : 'Search category...'}
                        error={errors.category_id}
                      />
                    </div>
                  </div>

                  {/* Priority Visual Cards */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">{t('submit.priority_label')} *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(priorities).map(([key, label]) => {
                        const isActive = data.priority === key;
                        const colors = {
                          low: isActive ? 'ring-green-500 bg-green-50 border-green-300' : 'border-gray-200 hover:border-green-200 hover:bg-green-50/30',
                          medium: isActive ? 'ring-blue-500 bg-blue-50 border-blue-300' : 'border-gray-200 hover:border-blue-200 hover:bg-blue-50/30',
                          high: isActive ? 'ring-orange-500 bg-orange-50 border-orange-300' : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30',
                          critical: isActive ? 'ring-red-500 bg-red-50 border-red-300' : 'border-gray-200 hover:border-red-200 hover:bg-red-50/30',
                        };
                        return (
                          <button key={key} type="button" onClick={() => setData('priority', key)}
                            className={`relative rounded-xl border-2 px-3 py-3 text-center transition-all active:scale-[0.97] ${colors[key]} ${isActive ? 'ring-2 shadow-sm' : 'shadow-none'}`}>
                            <div className={`text-base mb-0.5 ${isActive ? 'scale-105' : ''}`}>
                              {key === 'critical' ? '🔴' : key === 'high' ? '🟠' : key === 'medium' ? '🔵' : '🟢'}
                            </div>
                            <div className={`text-xs font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                              {t(`priorities.${key}`)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.location_label')} *</label>
                    <SearchSelect
                      options={groupedLocations.map(loc => ({
                        label: loc.name,
                        options: loc.children.length > 0
                          ? loc.children.map(c => ({ value: c.id, label: c.name }))
                          : [{ value: loc.id, label: loc.name }],
                      }))}
                      value={data.location_id}
                      onChange={v => setData('location_id', v)}
                      placeholder={!data.organization_id
                        ? (lang === 'np' ? 'पहिला संस्था चयन गर्नुहोस्' : 'Select organization first')
                        : (lang === 'np' ? 'स्थान खोज्नुहोस्...' : 'Search location...')}
                      disabled={!data.organization_id}
                      error={errors.location_id}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Description & Photo */}
            {step === 1 && (
              <div className="animate-fade-in">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 space-y-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{t('submit.desc_label')}</h2>
                      <p className="text-xs text-gray-400">{lang === 'np' ? 'आफ्नो समस्या विस्तृत रूपमा लेख्नुहोस्' : 'Describe your issue in detail'}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-gray-700">{t('submit.desc_label')} *</label>
                      <div className="flex items-center gap-2">
                        <VoiceInput onText={handleVoiceText} disabled={processing} />
                        <span className={`text-xs font-medium ${data.description.length < 10 ? 'text-red-400' : 'text-gray-400'}`}>
                          {data.description.length}/10
                        </span>
                      </div>
                    </div>
                    <textarea value={data.description} onChange={e => setData('description', e.target.value)}
                      rows={5} className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-shadow hover:shadow-sm"
                      placeholder={t('submit.desc_placeholder')} />
                    {errors.description && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>{errors.description}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.photo_label')}</label>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                        dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <input type="file" accept="image/*" onChange={handlePhotoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                      {photoPreview ? (
                        <div className="flex items-center justify-center gap-4">
                          <img src={photoPreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-gray-200 shadow-sm" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-700">{lang === 'np' ? 'फोटो तयार छ' : 'Photo ready'}</p>
                            <p className="text-xs text-gray-400">{lang === 'np' ? 'पुन: चयन गर्न क्लिक गर्नुहोस्' : 'Click to change'}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">{lang === 'np' ? 'फोटो राख्न यहाँ क्लिक वा ड्र्याग गर्नुहोस्' : 'Click or drag photo here'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{lang === 'np' ? 'अधिकतम ५ MB' : 'Max 5 MB'}</p>
                        </div>
                      )}
                    </div>
                    {errors.photo && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>{errors.photo}</p>}
                  </div>

                  {/* Video Upload */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{lang === 'np' ? 'भिडियो (वैकल्पिक)' : 'Video (optional)'}</label>
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                        dragOver ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <input type="file" accept="video/*" onChange={handleVideoChange}
                        className="absolute inset-0 opacity-0 cursor-pointer" />
                      {videoPreview ? (
                        <div className="flex items-center justify-center gap-4">
                          <video src={videoPreview} className="h-20 w-20 rounded-xl object-cover border border-gray-200 shadow-sm" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-700">{lang === 'np' ? 'भिडियो तयार छ' : 'Video ready'}</p>
                            <p className="text-xs text-gray-400">{lang === 'np' ? 'पुन: चयन गर्न क्लिक गर्नुहोस्' : 'Click to change'}</p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm text-gray-500">{lang === 'np' ? 'भिडियो राख्न यहाँ क्लिक वा ड्र्याग गर्नुहोस्' : 'Click or drag video here'}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{lang === 'np' ? 'अधिकतम ५० MB' : 'Max 50 MB'}</p>
                        </div>
                      )}
                    </div>
                    {errors.video && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>{errors.video}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Your Info & Review */}
            {step === 2 && (
              <div className="animate-fade-in space-y-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sm:p-7 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-gray-900">{t('submit.your_info')}</h2>
                      <p className="text-xs text-gray-400">{t('submit.optional')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.name_label')}</label>
                      <input type="text" value={data.reporter_name} onChange={e => setData('reporter_name', e.target.value)}
                        className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow hover:shadow-sm"
                        placeholder={t('submit.optional')} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.phone_label')}</label>
                      <input type="tel" value={data.reporter_phone} onChange={e => setData('reporter_phone', e.target.value)}
                        className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow hover:shadow-sm"
                        placeholder="98XXXXXXXX" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('submit.email_label')}</label>
                    <input type="email" value={data.reporter_email} onChange={e => setData('reporter_email', e.target.value)}
                      className="w-full rounded-xl border-gray-200 border px-3.5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow hover:shadow-sm"
                      placeholder={t('submit.optional')} />
                  </div>

                  <label className="flex items-start sm:items-center gap-3 cursor-pointer p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors">
                    <input type="checkbox" checked={data.is_anonymous} onChange={e => setData('is_anonymous', e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{t('submit.anonymous_label')}</span>
                      <p className="text-xs text-gray-500">{t('submit.anonymous_desc')}</p>
                    </div>
                  </label>

                  <label className="flex items-start sm:items-center gap-3 cursor-pointer p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors">
                    <input type="checkbox" checked={data.sms_opt_in} onChange={e => setData('sms_opt_in', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 sm:mt-0" />
                    <div>
                      <span className="text-sm font-medium text-gray-900">{t('submit.sms_opt_in')}</span>
                      <p className="text-xs text-gray-500">{t('submit.sms_opt_in_desc')}</p>
                    </div>
                  </label>
                </div>

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl border border-gray-200/60 p-5 sm:p-7">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {lang === 'np' ? 'समीक्षा' : 'Review Summary'}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      { label: t('submit.org_label'), value: organizations.find(o => o.id === data.organization_id)?.name },
                      { label: t('submit.category_label'), value: data.category_id ? categories.find(c => String(c.id) === String(data.category_id))?.name || '' : '' },
                      { label: t('submit.priority_label'), value: data.priority ? t(`priorities.${data.priority}`) : '' },
                      { label: t('submit.location_label'), value: groupedLocations.flatMap(g => g.children.length ? g.children : [g]).find(l => l.id === data.location_id)?.name },
                    ].filter(i => i.value).map((item, i) => (
                      <div key={i} className="bg-white/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{item.label}</p>
                        <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                  {data.description && (
                    <div className="mt-3 bg-white/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">{t('submit.desc_label')}</p>
                      <p className="text-sm text-gray-700 mt-0.5 line-clamp-2">{data.description}</p>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button type="submit" disabled={processing}
                  className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 text-sm active:scale-[0.99]">
                  {processing ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('submit.submitting')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('submit.submit_btn')}
                    </span>
                  )}
                </button>
              </div>
            )}

            {/* Navigation */}
            {step < 2 && (
              <div className="flex items-center gap-3 mt-5">
                {step > 0 && (
                  <button type="button" onClick={() => setStep(s => s - 1)}
                    className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition-all text-sm active:scale-[0.99]">
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      {lang === 'np' ? 'पछाडि' : 'Back'}
                    </span>
                  </button>
                )}
                <button type="button" onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all text-sm active:scale-[0.99] ${
                    canProceed()
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md shadow-indigo-200 hover:from-indigo-700 hover:to-blue-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                  <span className="inline-flex items-center gap-1.5 justify-center">
                    {lang === 'np' ? 'अर्को' : 'Next'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
            )}

            {/* Step error hint */}
            {showError && step < 2 && (
              <p className="text-xs text-red-500 mt-2 text-center flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                {showError}
              </p>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
