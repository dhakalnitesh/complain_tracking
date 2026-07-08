import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useToast } from '../Components/Toast';

export default function useRealtime() {
  const { addToast } = useToast();
  const { auth, broadcasting } = usePage().props;
  const user = auth?.user;

  useEffect(() => {
    if (!user || !broadcasting?.enabled || !window.Echo) return;

    const channel = window.Echo.channel('admin');

    channel.listen('.IssueCreated', (e) => {
      addToast(`New issue: ${e.reference_code}`, e.priority === 'critical' ? 'error' : 'success');
    });

    channel.listen('.IssueStatusChanged', (e) => {
      addToast(`${e.reference_code} status changed to ${e.status}`);
    });

    channel.listen('.IssueCommentAdded', (e) => {
      addToast(`New update on issue #${e.issue_id}: ${e.description}`, 'info');
    });

    return () => {
      channel.stopListening('.IssueCreated');
      channel.stopListening('.IssueStatusChanged');
      channel.stopListening('.IssueCommentAdded');
    };
  }, [user, broadcasting?.enabled]);
}
