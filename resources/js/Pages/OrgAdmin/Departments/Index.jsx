import { Head, router } from '@inertiajs/react';
import { route } from '../../../ziggy';
import { useLanguage } from '../../../Context/LanguageContext';
import { useState } from 'react';

export default function OrgAdminDepartments({ organization, departments }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  function handleCreate(e) {
    e.preventDefault();
    router.post(route('org-admin.departments.store'), {
      name, description, parent_id: parentId || null, sort_order: parseInt(sortOrder) || 0,
    }, {
      preserveState: true,
      onSuccess: () => { setShowForm(false); setName(''); setDescription(''); setParentId(''); setSortOrder('0'); },
    });
  }

  return (
    <>
      <Head title={`${organization.name} - ${isNp ? 'विभागहरू' : 'Departments'}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{isNp ? 'विभागहरू' : 'Departments'}</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all">
            {isNp ? 'विभाग थप्नुहोस्' : 'Add Department'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200/60 p-4 mb-4 space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} required placeholder={isNp ? 'विभागको नाम' : 'Department name'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={isNp ? 'विवरण' : 'Description'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" rows={2} />
            <div className="flex gap-2">
              <select value={parentId} onChange={e => setParentId(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2">
                <option value="">{isNp ? 'मुख्य विभाग' : 'Main department'}</option>
                {departments.filter(d => !d.parent_id).map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="Sort" className="w-16 text-sm border border-gray-200 rounded-lg px-3 py-2" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">{isNp ? 'सिर्जना गर्नुहोस्' : 'Create'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700">{isNp ? 'रद्द गर्नुहोस्' : 'Cancel'}</button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          {departments.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">{isNp ? 'कुनै विभाग छैन' : 'No departments yet'}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {departments.map(dept => (
                <div key={dept.id} className="p-3 sm:p-4 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                    <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${dept.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {dept.is_active ? (isNp ? 'सक्रिय' : 'Active') : (isNp ? 'निष्क्रिय' : 'Inactive')}
                    </span>
                    {dept.description && <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>}
                    <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                      <span>{dept.users_count} {isNp ? 'कर्मचारी' : 'staff'}</span>
                      {dept.children_count > 0 && <span>{dept.children_count} {isNp ? 'उप-विभाग' : 'sub-departments'}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
