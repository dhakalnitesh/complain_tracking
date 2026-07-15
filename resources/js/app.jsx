import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { LanguageProvider } from './Context/LanguageContext';
import { ToastProvider } from './Components/UI/Toast';
import Layout from './Layouts/Layout';
import Pusher from 'pusher-js';
import Echo from 'laravel-echo';

window.Pusher = Pusher;

const broadcastEl = document.getElementById('broadcast-data');
if (broadcastEl) {
  try {
    const config = JSON.parse(broadcastEl.textContent);
    if (config.enabled) {
      window.Echo = new Echo({
        broadcaster: 'reverb',
        key: config.key,
        wsHost: config.host,
        wsPort: config.port,
        wssPort: config.port,
        forceTLS: config.scheme === 'https',
        enabledTransports: ['ws', 'wss'],
      });
    }
  } catch (e) {
    console.warn('Failed to parse broadcast config:', e);
  }
}

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
