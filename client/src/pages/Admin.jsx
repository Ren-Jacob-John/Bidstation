import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { getAllUsers, banUser, unbanUser } from '../services/authService';
import { getAllAuctions, deleteAuction } from '../services/auctionService';
import { ref, get, update } from 'firebase/database';
import { database } from '../firebase/firebase.config';
import './Admin.css';

// ─── Role promotion helper ────────────────────────────────────────────────────
const promoteUser = async (userId, newRole) => {
  const userRef = ref(database, `users/${userId}`);
  await update(userRef, { role: newRole });
};

// ─── Confirm dialog helper ────────────────────────────────────────────────────
const confirmed = (msg) => window.confirm(msg);

const ROLE_META = {
  admin:     { label: 'Admin',     color: '#1e40af', bg: '#dbeafe' },
  auctioneer:{ label: 'Auctioneer',color: '#92400e', bg: '#fef3c7' },
  bidder:    { label: 'Bidder',    color: '#3730a3', bg: '#e0e7ff' },
};

const STATUS_META = {
  live:      { label: 'Live',      color: '#166534', bg: '#dcfce7' },
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef3c7' },
  completed: { label: 'Completed', color: '#374151', bg: '#e5e7eb' },
  cancelled: { label: 'Cancelled', color: '#991b1b', bg: '#fee2e2' },
};

const Badge = ({ text, meta }) => {
  const m = meta?.[text?.toLowerCase()] || { label: text, color: '#374151', bg: '#f3f4f6' };
  return (
    <span className="admin-badge-pill" style={{ color: m.color, background: m.bg }}>
      {m.label || text}
    </span>
  );
};

// ─── Role selector dropdown ───────────────────────────────────────────────────
const RoleSelector = ({ currentRole, userId, selfUid, onChanged }) => {
  const [busy, setBusy] = useState(false);

  if (userId === selfUid) {
    return <span className="admin-text-muted">You</span>;
  }

  const handleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole === currentRole) return;
    const label = ROLE_META[newRole]?.label || newRole;
    if (!confirmed(`Promote/demote this user to "${label}"?`)) return;
    setBusy(true);
    try {
      await promoteUser(userId, newRole);
      onChanged(userId, newRole);
    } catch (err) {
      alert('Failed to change role: ' + (err.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <select
      className="admin-role-select"
      value={currentRole || 'bidder'}
      onChange={handleChange}
      disabled={busy}
      title="Change user role"
    >
      <option value="bidder">Bidder</option>
      <option value="auctioneer">Auctioneer</option>
      <option value="admin">Admin</option>
    </select>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const Admin = () => {
  const { user } = useAuth();

  const [users,           setUsers]           = useState([]);
  const [auctions,        setAuctions]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [success,         setSuccess]         = useState(null);
  const [activeTab,       setActiveTab]       = useState('users');
  const [analytics,       setAnalytics]       = useState(null);
  const [analyticsLoading,setAnalyticsLoading]= useState(false);

  // filters
  const [userSearch,   setUserSearch]   = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');
  const [auctionSearch, setAuctionSearch] = useState('');
  const [auctionStatusFilter, setAuctionStatusFilter] = useState('all');

  // ── load ──────────────────────────────────────────────────────────────────
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersData, auctionsData] = await Promise.all([
        getAllUsers(),
        getAllAuctions(),
      ]);
      setUsers(usersData);
      setAuctions(auctionsData);
      if (user?.role === 'admin') await loadAnalytics(false);
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (showSpinner = true) => {
    if (showSpinner) setAnalyticsLoading(true);
    try {
      const [auctionsSnap, usersSnap, bidsSnap] = await Promise.all([
        get(ref(database, 'auctions')),
        get(ref(database, 'users')),
        get(ref(database, 'bids')),
      ]);

      let totalAuctions = 0, liveAuctions = 0, completedAuctions = 0, pendingAuctions = 0;
      if (auctionsSnap.exists()) {
        auctionsSnap.forEach((child) => {
          totalAuctions++;
          const s = child.val()?.status;
          if (s === 'live')      liveAuctions++;
          if (s === 'completed') completedAuctions++;
          if (s === 'pending')   pendingAuctions++;
        });
      }

      let totalUsers = 0, bannedUsers = 0, adminCount = 0, auctioneerCount = 0;
      if (usersSnap.exists()) {
        usersSnap.forEach((child) => {
          totalUsers++;
          const v = child.val();
          if (v?.banned)           bannedUsers++;
          if (v?.role === 'admin') adminCount++;
          if (v?.role === 'auctioneer') auctioneerCount++;
        });
      }

      let totalBids = 0;
      if (bidsSnap.exists()) {
        bidsSnap.forEach((auctionBids) => { auctionBids.forEach(() => totalBids++); });
      }

      setAnalytics({
        totalAuctions, liveAuctions, completedAuctions, pendingAuctions,
        totalUsers, bannedUsers, adminCount, auctioneerCount, totalBids,
      });
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // ── notifications ─────────────────────────────────────────────────────────
  const notify = (msg, type = 'success') => {
    if (type === 'success') { setSuccess(msg); setError(null); }
    else                    { setError(msg);   setSuccess(null); }
    setTimeout(() => { setSuccess(null); setError(null); }, 4000);
  };

  // ── user actions ──────────────────────────────────────────────────────────
  const handleBan = async (u) => {
    if (!confirmed(`Ban "${u.username || u.email}"? They won't be able to log in.`)) return;
    try {
      await banUser(u.uid);
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, banned: true } : x));
      notify(`"${u.username || u.email}" has been banned.`);
    } catch (err) { notify(err.message || 'Failed to ban user', 'error'); }
  };

  const handleUnban = async (u) => {
    if (!confirmed(`Unban "${u.username || u.email}"?`)) return;
    try {
      await unbanUser(u.uid);
      setUsers(prev => prev.map(x => x.uid === u.uid ? { ...x, banned: false } : x));
      notify(`"${u.username || u.email}" has been unbanned.`);
    } catch (err) { notify(err.message || 'Failed to unban user', 'error'); }
  };

  const handleRoleChanged = (uid, newRole) => {
    setUsers(prev => prev.map(x => x.uid === uid ? { ...x, role: newRole } : x));
    notify(`Role updated to "${ROLE_META[newRole]?.label || newRole}".`);
  };

  // ── auction actions ───────────────────────────────────────────────────────
  const handleDeleteAuction = async (auction) => {
    if (!confirmed(`Delete "${auction.title}"? This cannot be undone.`)) return;
    try {
      await deleteAuction(auction.id);
      setAuctions(prev => prev.filter(a => a.id !== auction.id));
      notify(`Auction "${auction.title}" deleted.`);
    } catch (err) { notify(err.message || 'Failed to delete auction', 'error'); }
  };

  // ── filtered lists ────────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase();
    return users.filter(u => {
      const matchSearch =
        !q ||
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.uid || '').toLowerCase().includes(q);
      const matchRole   = userRoleFilter   === 'all' || (u.role || 'bidder') === userRoleFilter;
      const matchStatus = userStatusFilter === 'all' ||
        (userStatusFilter === 'banned' ? u.banned : !u.banned);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const filteredAuctions = useMemo(() => {
    const q = auctionSearch.toLowerCase();
    return auctions.filter(a => {
      const matchSearch = !q || (a.title || '').toLowerCase().includes(q);
      const matchStatus = auctionStatusFilter === 'all' || a.status === auctionStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [auctions, auctionSearch, auctionStatusFilter]);

  // ── utils ─────────────────────────────────────────────────────────────────
  const fmt = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="admin-page">
      <div className="container">

        {/* ── Header ── */}
        <header className="admin-header">
          <div className="admin-header-left">
            <h1>Admin Dashboard</h1>
            <p className="admin-welcome">
              Signed in as <strong>{user?.username || user?.email}</strong>
            </p>
          </div>
          <button className="admin-refresh-btn" onClick={loadData} title="Refresh all data">
            🔄 Refresh
          </button>
        </header>

        {/* ── Alerts ── */}
        {error   && <div className="admin-alert admin-alert-error">⚠️ {error}</div>}
        {success && <div className="admin-alert admin-alert-success">✅ {success}</div>}

        {/* ── Tabs ── */}
        <div className="admin-tabs">
          {[
            { key: 'users',     icon: '👥', label: 'Users' },
            { key: 'auctions',  icon: '🏛️', label: 'Auctions' },
            { key: 'analytics', icon: '📈', label: 'Analytics' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`admin-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin-loading">
            <div className="spinner" />
            <p>Loading dashboard data…</p>
          </div>
        ) : (
          <>
            {/* ══════════════ USERS TAB ══════════════ */}
            {activeTab === 'users' && (
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2>User Management <span className="admin-count-badge">{filteredUsers.length} / {users.length}</span></h2>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                  <input
                    className="admin-search-input"
                    type="text"
                    placeholder="🔍  Search by name, email or UID…"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                  <select
                    className="admin-filter-select"
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="auctioneer">Auctioneer</option>
                    <option value="bidder">Bidder</option>
                  </select>
                  <select
                    className="admin-filter-select"
                    value={userStatusFilter}
                    onChange={e => setUserStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Change Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="admin-empty">No users match your filters.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.uid} className={u.banned ? 'admin-row-banned' : ''}>
                            <td>
                              <div className="admin-user-cell">
                                <div className="admin-avatar">
                                  {(u.username || u.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="admin-user-name">{u.username || '—'}</div>
                                  <div className="admin-user-email">{u.email}</div>
                                </div>
                              </div>
                            </td>
                            <td><Badge text={u.role || 'bidder'} meta={ROLE_META} /></td>
                            <td>
                              {u.banned
                                ? <span className="admin-badge-pill" style={{ color:'#991b1b', background:'#fee2e2' }}>Banned</span>
                                : <span className="admin-badge-pill" style={{ color:'#166534', background:'#dcfce7' }}>Active</span>
                              }
                            </td>
                            <td className="admin-date-cell">{fmt(u.createdAt)}</td>
                            <td>
                              <RoleSelector
                                currentRole={u.role || 'bidder'}
                                userId={u.uid}
                                selfUid={user?.uid}
                                onChanged={handleRoleChanged}
                              />
                            </td>
                            <td>
                              {u.uid !== user?.uid ? (
                                u.banned ? (
                                  <button className="admin-btn admin-btn-unban" onClick={() => handleUnban(u)}>
                                    ✅ Unban
                                  </button>
                                ) : (
                                  <button className="admin-btn admin-btn-ban" onClick={() => handleBan(u)}>
                                    🚫 Ban
                                  </button>
                                )
                              ) : (
                                <span className="admin-text-muted">You</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ══════════════ AUCTIONS TAB ══════════════ */}
            {activeTab === 'auctions' && (
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2>Auction Management <span className="admin-count-badge">{filteredAuctions.length} / {auctions.length}</span></h2>
                </div>

                {/* Filters */}
                <div className="admin-filters">
                  <input
                    className="admin-search-input"
                    type="text"
                    placeholder="🔍  Search by title…"
                    value={auctionSearch}
                    onChange={e => setAuctionSearch(e.target.value)}
                  />
                  <select
                    className="admin-filter-select"
                    value={auctionStatusFilter}
                    onChange={e => setAuctionStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuctions.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="admin-empty">No auctions match your filters.</td>
                        </tr>
                      ) : (
                        filteredAuctions.map((auction) => (
                          <tr key={auction.id}>
                            <td className="admin-auction-title">{auction.title || 'Untitled Auction'}</td>
                            <td>
                              <span className="admin-type-tag">
                                {auction.auctionType === 'sports_player' || auction.sport
                                  ? '⚽ Sports'
                                  : '🛍️ Item'}
                              </span>
                            </td>
                            <td><Badge text={auction.status || 'pending'} meta={STATUS_META} /></td>
                            <td className="admin-date-cell">{fmt(auction.createdAt)}</td>
                            <td>
                              <div className="admin-actions">
                                <Link
                                  to={`/auction/${auction.id}`}
                                  className="admin-btn admin-btn-view"
                                >
                                  👁 View
                                </Link>
                                <button
                                  className="admin-btn admin-btn-delete"
                                  onClick={() => handleDeleteAuction(auction)}
                                >
                                  🗑 Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* ══════════════ ANALYTICS TAB ══════════════ */}
            {activeTab === 'analytics' && (
              <section className="admin-section">
                <div className="admin-section-header">
                  <h2>Platform Analytics</h2>
                  <button
                    className="admin-refresh-btn"
                    onClick={() => loadAnalytics(true)}
                    disabled={analyticsLoading}
                  >
                    {analyticsLoading ? '⏳ Loading…' : '🔄 Refresh'}
                  </button>
                </div>

                {analyticsLoading ? (
                  <div className="admin-loading">
                    <div className="spinner" />
                    <p>Crunching numbers…</p>
                  </div>
                ) : (
                  <div className="analytics-grid">
                    {[
                      { icon: '📦', value: analytics?.totalAuctions,    label: 'Total Auctions'    },
                      { icon: '🔴', value: analytics?.liveAuctions,     label: 'Live Now'          },
                      { icon: '⏳', value: analytics?.pendingAuctions,  label: 'Pending'           },
                      { icon: '✅', value: analytics?.completedAuctions,label: 'Completed'         },
                      { icon: '👥', value: analytics?.totalUsers,       label: 'Total Users'       },
                      { icon: '🔨', value: analytics?.totalBids,        label: 'Total Bids'        },
                      { icon: '🏷️', value: analytics?.auctioneerCount,  label: 'Auctioneers'       },
                      { icon: '🚫', value: analytics?.bannedUsers,      label: 'Banned Users'      },
                    ].map(({ icon, value, label }) => (
                      <div key={label} className="stat-card card">
                        <div className="stat-icon">{icon}</div>
                        <div className="stat-content">
                          <h3>{value ?? '—'}</h3>
                          <p>{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ── Quick Links ── */}
        <section className="admin-section">
          <h2>Quick Links</h2>
          <div className="admin-cards">
            <Link to="/auctions" className="admin-card card">
              <span className="admin-card-icon">📋</span>
              <h3>All Auctions</h3>
              <p>Browse and manage auctions</p>
            </Link>
            <Link to="/dashboard" className="admin-card card">
              <span className="admin-card-icon">🏠</span>
              <h3>User Dashboard</h3>
              <p>Go to your user dashboard</p>
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Admin;