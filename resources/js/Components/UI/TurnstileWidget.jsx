import { useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';

export default function TurnstileWidget() {
  const { captcha_required, turnstile_site_key } = usePage().props;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!captcha_required || !turnstile_site_key || !containerRef.current) return;

    const renderWidget = () => {
      if (window.turnstile && containerRef.current) {
        window.turnstile.render(containerRef.current, {
          sitekey: turnstile_site_key,
          theme: 'light',
        });
      }
    };

    if (!window.turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      renderWidget();
    }

    return () => {
      if (window.turnstile && containerRef.current) {
        try {
          window.turnstile.remove(containerRef.current);
        } catch (e) {
          // Widget may not have been rendered yet
        }
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
