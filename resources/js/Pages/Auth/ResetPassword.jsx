import { useForm, Head } from '@inertiajs/react';
import Layout from '../../Layouts/Layout';

export default function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors } = useForm({
    token, email: email || '', password: '', password_confirmation: '',
  });

  function handleSubmit(e) {
    e.preventDefault();
    post('/reset-password');
  }

  return (
    <Layout>
      <Head title="Reset Password" />
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Set New Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)}
              className="w-full border rounded px-3 py-2" required minLength={8} />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Confirm Password</label>
            <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)}
              className="w-full border rounded px-3 py-2" required />
          </div>
          <button type="submit" disabled={processing}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            Reset Password
          </button>
        </form>
      </div>
    </Layout>
  );
}
