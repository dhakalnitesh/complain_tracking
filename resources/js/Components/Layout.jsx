import { Link, usePage } from '@inertiajs/react';
import { route } from '../ziggy';

export default function Layout({ children }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href={route('dashboard')} className="flex items-center gap-3 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-blue-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-gray-900 text-lg tracking-tight">Nagarik Sarokar</span>
                                <span className="hidden sm:inline text-xs text-gray-500 ml-2 font-medium">नागरिक सरोकार</span>
                            </div>
                        </Link>

                        <nav className="flex items-center gap-1 sm:gap-2">
                            <Link href={route('dashboard')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                Home
                            </Link>
                            <Link href={route('issues.create')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                Submit
                            </Link>
                            <Link href={route('status.check')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                Track
                            </Link>
                            {user ? (
                                <>
                                    {user.is_admin && (
                                        <Link href={route('admin.dashboard')} className="px-3 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-all">
                                            Admin
                                        </Link>
                                    )}
                                    <Link href={route('logout')} method="post" as="button" className="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all">
                                        Logout
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link href={route('login')} className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                        Login
                                    </Link>
                                    <Link href={route('register')} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-lg shadow-sm hover:shadow transition-all">
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            <main>
                {children}
            </main>

            <footer className="bg-white/50 border-t border-gray-200/60 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="font-semibold text-gray-700">Nagarik Sarokar</span>
                            <span className="text-gray-300">|</span>
                            <span>Nepal's Complaint Management System</span>
                        </div>
                        <p className="text-xs text-gray-400">
                            &copy; {new Date().getFullYear()} Nagarik Sarokar. Built with &hearts; for Nepal.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
