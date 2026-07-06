import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './Context/LanguageContext';
import { ToastProvider } from './Components/Toast';
import Layout from './Components/Layout';

createInertiaApp({
    resolve: name => {
        const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
        const page = pages[`./Pages/${name}.jsx`];
        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }
        page.default.layout = page.default.layout || (page => <Layout children={page} />);
        return page;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <LanguageProvider>
                <ToastProvider>
                    <App {...props} />
                </ToastProvider>
            </LanguageProvider>
        );
    },
    progress: {
        color: '#2563eb',
    },
});
