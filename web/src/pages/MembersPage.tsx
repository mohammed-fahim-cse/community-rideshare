import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { approveMember, listMembers } from '../api/admin';
import { ApiError } from '../api/client';
import type { AdminMember, UserStatus } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

const TABS: UserStatus[] = ['PENDING', 'ACTIVE', 'SUSPENDED'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MembersPage() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<UserStatus>('PENDING');
  const [members, setMembers] = useState<AdminMember[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = useCallback(
    (s: UserStatus) => {
      if (!accessToken) return;
      setError(null);
      listMembers(accessToken, s)
        .then(setMembers)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load members.'));
    },
    [accessToken],
  );

  useEffect(() => {
    setMembers(null);
    load(status);
  }, [status, load]);

  const handleApprove = async (memberId: string) => {
    if (!accessToken) return;
    setApprovingId(memberId);
    setError(null);
    try {
      await approveMember(accessToken, memberId);
      load(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to approve member.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Members</h1>
          <p>Approve new members and review your community's roster.</p>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={`tab ${status === t ? 'active' : ''}`} onClick={() => setStatus(t)}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="card table-scroll">
        {members === null ? (
          <div className="empty-state">Loading…</div>
        ) : members.length === 0 ? (
          <div className="empty-state">No {status.toLowerCase()} members.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Rating</th>
                <th>Joined</th>
                <th>Status</th>
                {status === 'PENDING' ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name ?? <span className="muted">Not set</span>}</td>
                  <td className="mono">{m.phone}</td>
                  <td className="mono">
                    {m.ratingCount > 0 ? `★ ${m.ratingAvg.toFixed(1)} (${m.ratingCount})` : <span className="muted">—</span>}
                  </td>
                  <td className="mono">{formatDate(m.createdAt)}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  {status === 'PENDING' ? (
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApprove(m.id)}
                        disabled={approvingId === m.id}
                      >
                        {approvingId === m.id ? 'Approving…' : 'Approve'}
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
