import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  MessageSquare,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Send,
  Info,
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });

  const [retryingId, setRetryingId] = useState(null);
  const [bannerMessage, setBannerMessage] = useState(null);
  const [settings, setSettings] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notifRes, setRes] = useState ? await Promise.all([
        api.notifications.list({ status: statusFilter, page, limit: 15 }),
        api.settings.get(),
      ]) : [null, null];

      if (notifRes.success) {
        setNotifications(notifRes.data);
        setPagination(notifRes.pagination);
      }
      if (setRes.success) {
        setSettings(setRes);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [statusFilter, page]);

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      setBannerMessage(null);
      const res = await api.notifications.retry(id);
      if (res.success) {
        setBannerMessage({ type: 'success', text: 'SMS dispatched successfully!' });
        loadNotifications();
      } else {
        setBannerMessage({ type: 'error', text: 'SMS retry failed: ' + (res.message || 'Rejected by provider') });
      }
    } catch (err) {
      setBannerMessage({ type: 'error', text: err.message || 'Retry failed' });
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SENT':
        return <span className="badge badge-sent">SENT (PROVIDER ACCEPTED)</span>;
      case 'DELIVERED':
        return <span className="badge badge-delivered">DELIVERED</span>;
      case 'FAILED':
        return <span className="badge badge-failed">FAILED</span>;
      case 'PENDING':
      case 'SENDING':
        return <span className="badge badge-pending">{status}</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">SMS Outbox & Notifications</h1>
          <p className="page-subtitle">Inspect receipt SMS dispatches, provider statuses, and safe retry controls</p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadNotifications}>
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Mode Status Banner */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          backgroundColor: '#f8fafc',
          borderColor: '#cbd5e1',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Info size={20} color="#0f766e" />
        <div style={{ fontSize: '0.86rem', flex: 1 }}>
          <strong>SMS Provider Status: </strong>
          {settings?.smsInfo?.isEnabled ? (
            <span style={{ color: '#16a34a', fontWeight: '600' }}>
              AWS End User Messaging SMS Active ({settings.smsInfo.region})
            </span>
          ) : (
            <span style={{ color: '#0284c7', fontWeight: '600' }}>
              Mock Development Mode (Zero-cost local simulation active. Real SMS charges will NOT occur).
            </span>
          )}
        </div>
      </div>

      {bannerMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.85rem',
            backgroundColor: bannerMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: bannerMessage.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${bannerMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {bannerMessage.text}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0 }}>Filter by Status:</label>
          <select
            className="form-select"
            style={{ maxWidth: '240px' }}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Notifications</option>
            <option value="SENT">Sent</option>
            <option value="DELIVERED">Delivered</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING">Pending</option>
          </select>
        </div>
      </div>

      {/* Outbox Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Receipt #</th>
                <th>Customer Name</th>
                <th>Recipient Mobile</th>
                <th>Message Preview</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Provider ID / Error</th>
                <th>Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading notifications...
                  </td>
                </tr>
              ) : notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr key={n.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{n.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <strong>{n.receipt_number || '—'}</strong>
                    </td>
                    <td>{n.customer_name || '—'}</td>
                    <td>
                      <code style={{ fontSize: '0.8rem' }}>{n.masked_mobile}</code>
                    </td>
                    <td style={{ maxWidth: '280px', fontSize: '0.78rem', color: '#475569' }}>
                      {n.message_body}
                    </td>
                    <td>{getStatusBadge(n.status)}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                        {n.attempt_count} attempt(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {n.status === 'FAILED' ? (
                        <span style={{ color: '#dc2626' }}>{n.last_error_message || n.last_error_code}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {n.provider_message_id ? n.provider_message_id.slice(0, 16) + '...' : '—'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(n.created_at).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {n.status === 'FAILED' ? (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Retry SMS"
                          disabled={retryingId === n.id}
                          onClick={() => handleRetry(n.id)}
                        >
                          <Send size={12} />
                          <span>Retry</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#16a34a' }}>✓ Logged</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No SMS notifications recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing Page {page} of {pagination.totalPages} ({pagination.totalRecords} total notifications)
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
