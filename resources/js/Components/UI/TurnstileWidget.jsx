import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function TurnstileWidget() {
  const { captcha_required, turnstile_site_key } = usePage().props;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!captcha_required || !turnstile_site_key || !containerRef.current) return;

    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const widgetId = window.turnstile?.render(containerRef.current, {
      sitekey: turnstile_site_key,
      theme: 'light',
    });

    return () => {
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [captcha_required, turnstile_site_key]);

  if (!captcha_required) return null;

  return (
    <div className="mt-4">
      <div ref={containerRef} />
      <p className="text-xs text-gray-400 mt-1">Security check required</p>
    </div>
  );
}
