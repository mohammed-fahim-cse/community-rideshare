import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getCommunity, updateCommunity } from '../api/admin';
import { ApiError } from '../api/client';
import type { Community } from '../api/types';

export function SettingsPage() {
  const { accessToken } = useAuth();
  const [community, setCommunity] = useState<Community | null>(null);
  const [name, setName] = useState('');
  const [autoApprove, setAutoApprove] = useState(false);
  const [radiusKm, setRadiusKm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getCommunity(accessToken)
      .then((c) => {
        setCommunity(c);
        setName(c.name);
        setAutoApprove(c.autoApprove);
        setRadiusKm(String(c.matchingRadiusKm));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load community settings.'));
  }, [accessToken]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const updated = await updateCommunity(accessToken, {
        name: name.trim(),
        autoApprove,
        matchingRadiusKm: Number(radiusKm),
      });
      setCommunity(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Community settings</h1>
          <p>Controls that apply to every member of this community.</p>
        </div>
      </div>

      {error ? <div className="error-banner">{error}</div> : null}
      {saved ? <div className="success-banner">Settings saved.</div> : null}

      {community === null ? (
        <div className="card">
          <div className="empty-state">Loading…</div>
        </div>
      ) : (
        <div className="card" style={{ padding: 24, maxWidth: 440 }}>
          <div className="field">
            <label>Invite code</label>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700 }}>
              {community.inviteCode}
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              Share this with new members joining the community. It can't be changed here.
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Community name</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="field">
              <label htmlFor="radius">Matching radius (km)</label>
              <input
                id="radius"
                type="number"
                min="0.1"
                step="0.1"
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
              />
              <span className="muted" style={{ fontSize: 12 }}>
                Default distance used to match nearby ride posts when a member doesn't override it.
              </span>
            </div>

            <div className="field">
              <label htmlFor="auto-approve" style={{ marginBottom: 0 }}>
                <div className="field-toggle">
                  <input
                    id="auto-approve"
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                  />
                  Auto-approve new members
                </div>
              </label>
              <span className="muted" style={{ fontSize: 12 }}>
                When off, new signups land in the Members → Pending queue for manual approval.
              </span>
            </div>

            <button className="btn btn-primary" type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
