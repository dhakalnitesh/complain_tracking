import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function useBroadcast(events) {
  const { auth } = usePage().props;
  const user = auth?.user;

  useEffect(() => {
    if (!user || !window.Echo) return;

    const channel = window.Echo.channel('admin');

    const cleanups = events.map(({ event, handler }) => {
      channel.listen(event, handler);
      return () => channel.stopListening(event, handler);
    });

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [user]);
}
