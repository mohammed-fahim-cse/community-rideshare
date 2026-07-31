import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { listRides } from '../api/admin';
import { ApiError } from '../api/client';
import type { AdminRide, RidePostStatus } from '../api/types';
import { StatusBadge } from '../components/StatusBadge';

const STATUSES: RidePostStatus[] = ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function RidesPage() {
  const { accessToken } = useAuth();
  const [status, setStatus] = useState<RidePostStatus | ''>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rides, setRides] = useState<AdminRide[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!accessToken) return;
    setRides(null);
    setError(null);
    listRides(accessToken, {
      status: status || undefined,
      from: from ? new Date(from).toISOString() : undefined,
      to: to ? new Date(to).toISOString() : undefined,
    })
      .then(setRides)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load rides.'));
  }, [accessToken, status, from, to]);

  useEffect(() => {
    // Fetching on mount and whenever a filter changes is the "synchronize with an external
    // system" case React's own docs describe — there's no async boundary to move the
    // initial state reset past.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Rides</h1>
          <p>Every ride post in your community, any status.</p>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 16, alignItems: 'flex-end' }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="status-filter">Status</label>
          <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value as RidePostStatus | '')}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="from-filter">From</label>
          <input id="from-filter" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="to-filter">To</label>
          <input id="to-filter" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}

      <div className="card table-scroll">
        {rides === null ? (
          <div className="empty-state">Loading…</div>
        ) : rides.length === 0 ? (
          <div className="empty-state">No rides match these filters.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Type</th>
                <th>Creator</th>
                <th>Accepted by</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 260 }}>
                    {r.pickupAddress} → {r.destinationAddress}
                  </td>
                  <td>{r.type === 'REQUEST' ? 'Request' : 'Offer'}</td>
                  <td>
                    {r.creator.name ?? 'Member'}
                    <br />
                    <span className="muted mono">{r.creator.phone}</span>
                  </td>
                  <td>
                    {r.match ? (
                      <>
                        {r.match.acceptedBy.name ?? 'Member'}
                        <br />
                        <span className="muted mono">{r.match.acceptedBy.phone}</span>
                      </>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="mono">{formatDateTime(r.createdAt)}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
