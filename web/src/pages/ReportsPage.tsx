import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { actionReport, listReports } from '../api/admin';
import { ApiError } from '../api/client';
import type { AdminReport, ReportAction, ReportStatus } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

const TABS: ReportStatus[] = ['OPEN', 'REVIEWED', 'ACTIONED'];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ReportsPage() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<ReportStatus>('OPEN');
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(
    (s: ReportStatus) => {
      if (!accessToken) return;
      setReports(null);
      setError(null);
      listReports(accessToken, s)
        .then(setReports)
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load reports.'));
    },
    [accessToken],
  );

  useEffect(() => {
    // Fetching on mount and whenever the status tab changes is the "synchronize with an
    // external system" case React's own docs describe — there's no async boundary to move
    // the initial state reset past.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(status);
  }, [status, load]);

  const handleAction = async (reportId: string, action: ReportAction) => {
    if (!accessToken) return;
    if (action === 'SUSPEND' || action === 'REMOVE') {
      const verb = action === 'SUSPEND' ? 'suspend' : 'remove';
      if (!window.confirm(`This will ${verb} the reported member's account. Continue?`)) return;
    }
    setActingId(reportId);
    setError(null);
    try {
      await actionReport(accessToken, reportId, action);
      load(status);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to action report.');
    } finally {
      setActingId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p>Member reports against other members, with an audit trail of what was done.</p>
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
        {reports === null ? (
          <div className="empty-state">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">No {status.toLowerCase()} reports.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Reported member</th>
                <th>Reported by</th>
                <th>Reason</th>
                <th>Filed</th>
                <th>Status</th>
                {status === 'OPEN' ? <th /> : null}
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.reportedUser.name ?? 'Member'}
                    <br />
                    <span className="muted mono">{r.reportedUser.phone}</span>
                    <br />
                    <StatusBadge status={r.reportedUser.status} />
                  </td>
                  <td>
                    {r.reporter.name ?? 'Member'}
                    <br />
                    <span className="muted mono">{r.reporter.phone}</span>
                  </td>
                  <td style={{ maxWidth: 240 }}>{r.reason}</td>
                  <td className="mono">{formatDate(r.createdAt)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  {status === 'OPEN' ? (
                    <td>
                      <div className="btn-row">
                        <button
                          className="btn"
                          disabled={actingId === r.id}
                          onClick={() => handleAction(r.id, 'WARN')}
                        >
                          Warn
                        </button>
                        <button
                          className="btn"
                          disabled={actingId === r.id}
                          onClick={() => handleAction(r.id, 'SUSPEND')}
                        >
                          Suspend
                        </button>
                        <button
                          className="btn btn-danger"
                          disabled={actingId === r.id}
                          onClick={() => handleAction(r.id, 'REMOVE')}
                        >
                          Remove
                        </button>
                        <button
                          className="btn"
                          disabled={actingId === r.id}
                          onClick={() => handleAction(r.id, 'DISMISS')}
                        >
                          Dismiss
                        </button>
                      </div>
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
