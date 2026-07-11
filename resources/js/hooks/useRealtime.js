import { useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { useToast } from '../Components/UI/Toast';

export default function useRealtime(only = ['stats', 'recent_issues']) {
  const { addToast } = useToast();
  const { auth, broadcasting } = usePage().props;
  const user = auth?.user;

  useEffect(() => {
    // 60s polling fallback — never miss updates even if Reverb goes down
    const pollTimer = setInterval(() => {
      router.reload({ only, preserveState: true, preserveScroll: true });
    }, 60000);

    if (!user || !broadcasting?.enabled || !window.Echo) {
      return () => clearInterval(pollTimer);
    }

    const orgId = user.organization_id;
    const isSuperAdmin = user.is_admin;

    if (!orgId && !isSuperAdmin) {
      return () => clearInterval(pollTimer);
    }

    const channels = [];
    if (isSuperAdmin) {
      channels.push(window.Echo.private('admin.global'));
    }
    if (orgId) {
      channels.push(window.Echo.private(`admin.${orgId}`));
    }

    function onIssueCreated(e) {
      addToast(`New issue: ${e.reference_code}`, e.priority === 'critical' ? 'error' : 'success');
      router.reload({ only });
    }

    function onStatusChanged(e) {
      addToast(`${e.reference_code} status changed to ${e.status}`);
      router.reload({ only });
    }

    function onCommentAdded(e) {
      addToast(`New update on issue #${e.issue_id}: ${e.description}`, 'info');
    }

    channels.forEach(ch => {
      ch.listen('.IssueCreated', onIssueCreated);
      ch.listen('.IssueStatusChanged', onStatusChanged);
      ch.listen('.IssueCommentAdded', onCommentAdded);
    });

    return () => {
      clearInterval(pollTimer);
      channels.forEach(ch => {
        ch.stopListening('.IssueCreated');
        ch.stopListening('.IssueStatusChanged');
        ch.stopListening('.IssueCommentAdded');
      });
    };
  }, [user, broadcasting?.enabled]);
}
