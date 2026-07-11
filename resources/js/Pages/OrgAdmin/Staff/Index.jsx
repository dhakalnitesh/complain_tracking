import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useLanguage } from '../../../Context/LanguageContext';
import { useState } from 'react';

export default function OrgAdminStaff({ organization, staff, departments }) {
  const { t, lang } = useLanguage();
  const isNp = lang === 'np';
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [departmentIds, setDepartmentIds] = useState([]);

  function handleCreate(e) {
    e.preventDefault();
    router.post(route('org-admin.staff.store'), {
      name, email, password, password_confirmation: passwordConfirmation, department_ids: departmentIds,
    }, {
      preserveState: true,
      onSuccess: () => {
        setShowForm(false);
        setName(''); setEmail(''); setPassword(''); setPasswordConfirmation(''); setDepartmentIds([]);
      },
    });
  }

  function toggleDept(id) {
    setDepartmentIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  }

  return (
    <>
      <Head title={`${organization.name} - ${isNp ? 'कर्मचारी' : 'Staff'}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{isNp ? 'कर्मचारी' : 'Staff'}</h1>
          <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all">
            {isNp ? 'कर्मचारी थप्नुहोस्' : 'Add Staff'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-200/60 p-4 mb-4 space-y-3">
            <input value={name} onChange={e => setName(e.target.value)} required placeholder={isNp ? 'नाम' : 'Name'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" placeholder="Email" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            <input value={password} onChange={e => setPassword(e.target.value)} required type="password" placeholder={isNp ? 'पासवर्ड' : 'Password'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            <input value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} required type="password" placeholder={isNp ? 'पासवर्ड पुष्टि' : 'Confirm Password'} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2" />
            {departments.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{isNp ? 'विभागहरू' : 'Departments'}</p>
                <div className="flex flex-wrap gap-2">
                  {departments.map(d => (
                    <button key={d.id} type="button" onClick={() => toggleDept(d.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${departmentIds.includes(d.id) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700">{isNp ? 'सिर्जना गर्नुहोस्' : 'Create'}</button>
          </form>
        )}

        <div className="bg-white rounded-xl border border-gray-200/60 overflow-hidden">
          {staff.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">{isNp ? 'कुनै कर्मचारी छैन' : 'No staff yet'}</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {staff.map(member => (
                <div key={member.id} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <span className="text-xs font-medium text-indigo-600">{member.issues_count} {isNp ? 'उजुरी' : 'issues'}</span>
                  </div>
                  {member.departments?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {member.departments.map((d, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{d}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
