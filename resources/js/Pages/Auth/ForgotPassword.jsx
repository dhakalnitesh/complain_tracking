import { useForm, Head } from '@inertiajs/react';
import Layout from '../../Layouts/Layout';

export default function ForgotPassword() {
  const { data, setData, post, processing, errors } = useForm({ email: '' });

  function handleSubmit(e) {
    e.preventDefault();
    post('/forgot-password');
  }

  return (
    <Layout>
      <Head title="Forgot Password" />
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)}
              className="w-full border rounded px-3 py-2" required />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <button type="submit" disabled={processing}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            Send Reset Link
          </button>
        </form>
      </div>
    </Layout>
  );
}
