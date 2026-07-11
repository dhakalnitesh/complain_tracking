import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useToast } from '../Components/UI/Toast';

export default function useRealtime() {
  const { addToast } = useToast();
  const { auth, broadcasting } = usePage().props;
  const user = auth?.user;

  useEffect(() => {
    if (!user || !broadcasting?.enabled || !window.Echo) return;

    const orgId = user.organization_id;
    const isSuperAdmin = user.is_admin;

    if (!orgId && !isSuperAdmin) return;

    const channelName = isSuperAdmin ? 'admin.0' : `admin.${orgId}`;
    const channel = window.Echo.private(channelName);

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
