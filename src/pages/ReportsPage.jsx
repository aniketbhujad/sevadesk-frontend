import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  BarChart3,
  Download,
  Calendar,
  IndianRupee,
  CreditCard,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export default function ReportsPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const monthAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState('collections'); // 'collections' | 'services' | 'outstanding'
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);

  const [collectionData, setCollectionData] = useState(null);
  const [servicesData, setServicesData] = useState(null);
  const [outstandingData, setOutstandingData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    try {
      setLoading(true);
      if (activeTab === 'collections') {
        const res = await api.reports.getCollections({ from: fromDate, to: toDate });
        if (res.success) setCollectionData(res);
      } else if (activeTab === 'services') {
        const res = await api.reports.getServices({ from: fromDate, to: toDate });
        if (res.success) setServicesData(res);
      } else if (activeTab === 'outstanding') {
        const res = await api.reports.getOutstanding();
        if (res.success) setOutstandingData(res);
      }
    } catch (err) {
      console.error('Failed to load report:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab, fromDate, toDate]);

  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    const type = activeTab === 'outstanding' ? 'outstanding' : 'collections';
    const exportUrl = api.reports.getExportUrl(type, fromDate, toDate);
    const token = localStorage.getItem('sevadesk_token');

    try {
      setExporting(true);
      const res = await fetch(exportUrl, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      });

      if (!res.ok) {
        // Fallback to direct window open (which includes &token=... in URL)
        window.open(exportUrl, '_blank');
        return;
      }

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `sevadesk-${type}-${fromDate}-to-${toDate}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.warn('In-app export fetch failed, falling back to direct URL:', err.message);
      window.open(exportUrl, '_blank');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Business Insights</h1>
          <p className="page-subtitle">Real-time collections, payment method reconciliations, and service volumes</p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={handleExportCsv} disabled={exporting}>
          <Download size={16} />
          <span>{exporting ? 'Downloading...' : 'Export Excel CSV'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'collections' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('collections')}
        >
          <span>Collections & Payments</span>
        </button>
        <button
          className={`btn ${activeTab === 'services' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('services')}
        >
          <span>Services Breakdown</span>
        </button>
        <button
          className={`btn ${activeTab === 'outstanding' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('outstanding')}
        >
          <span>Outstanding Balances</span>
        </button>
      </div>

      {/* Date Filter Toolbar (for collections & services) */}
      {activeTab !== 'outstanding' && (
        <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} color="var(--text-muted)" />
              <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Date Range:</span>
            </div>
            <div>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <span>to</span>
            <div>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setFromDate(todayStr);
                  setToDate(todayStr);
                }}
              >
                Today
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setFromDate(monthAgoStr);
                  setToDate(todayStr);
                }}
              >
                Last 30 Days
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Collections Content */}
      {activeTab === 'collections' && (
        <div>
          {/* Summary Metric Cards */}
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="stat-card" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
              <span className="stat-label" style={{ color: '#166534' }}>Total Collections</span>
              <div className="stat-value" style={{ color: '#15803d' }}>
                ₹{collectionData?.summary?.totalCollected?.toFixed(2) || '0.00'}
              </div>
              <div className="stat-desc" style={{ color: '#166534' }}>
                {collectionData?.summary?.transactionCount || 0} payment transaction(s)
              </div>
            </div>

            {collectionData?.summary?.byMethod &&
              collectionData.summary.byMethod.map((m) => (
                <div key={m.method} className="stat-card">
                  <span className="stat-label">{m.method} Collections</span>
                  <div className="stat-value">₹{m.total.toFixed(2)}</div>
                  <div className="stat-desc">{m.count} payment(s)</div>
                </div>
              ))}
          </div>

          {/* Collection breakdown table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Payments Collected in Selected Period</h2>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Receipt #</th>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th>Service Snapshot</th>
                    <th>Amount (₹)</th>
                    <th>Payment Mode</th>
                    <th>Reference / UTR</th>
                    <th>Payment Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Loading collections data...
                      </td>
                    </tr>
                  ) : collectionData?.data && collectionData.data.length > 0 ? (
                    collectionData.data.map((p) => (
                      <tr key={p.payment_id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>#{p.payment_id}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <strong>{p.receipt_number}</strong>
                        </td>
                        <td>{p.customer_name}</td>
                        <td>{p.customer_mobile}</td>
                        <td>{p.service_name_snapshot}</td>
                        <td style={{ color: '#16a34a', fontWeight: '700' }}>₹{p.amount.toFixed(2)}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#0f172a' }}>
                            {p.payment_method}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                          {p.transaction_reference || '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {new Date(p.received_at).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        No payments recorded during the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Services Breakdown */}
      {activeTab === 'services' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Services Volume & Revenue Breakdown</h2>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Total Handled</th>
                  <th>Total Billed (₹)</th>
                  <th>Fully Paid</th>
                  <th>Pending Balances</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading services data...
                    </td>
                  </tr>
                ) : servicesData?.data && servicesData.data.length > 0 ? (
                  servicesData.data.map((s, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{s.service_name}</strong>
                      </td>
                      <td>{s.total_count}</td>
                      <td style={{ fontWeight: '700' }}>₹{s.total_revenue.toFixed(2)}</td>
                      <td style={{ color: '#16a34a' }}>{s.paid_count}</td>
                      <td style={{ color: s.pending_count > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                        {s.pending_count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No service records in this time range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Outstanding Balances */}
      {activeTab === 'outstanding' && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Outstanding Citizen Balances</h2>
            <div style={{ fontWeight: '700', color: '#dc2626' }}>
              Total Outstanding: ₹{outstandingData?.summary?.totalOutstanding?.toFixed(2) || '0.00'}
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt #</th>
                  <th>Customer Name</th>
                  <th>Mobile</th>
                  <th>Service</th>
                  <th>Total Charge</th>
                  <th>Paid</th>
                  <th>Balance Due</th>
                  <th>Days Pending</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Loading outstanding data...
                    </td>
                  </tr>
                ) : outstandingData?.data && outstandingData.data.length > 0 ? (
                  outstandingData.data.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{o.receipt_number}</td>
                      <td>{o.customer_name}</td>
                      <td>{o.customer_mobile}</td>
                      <td>{o.service_name_snapshot}</td>
                      <td>₹{o.total_charge.toFixed(2)}</td>
                      <td style={{ color: '#16a34a' }}>₹{o.paid_amount.toFixed(2)}</td>
                      <td style={{ color: '#dc2626', fontWeight: '700' }}>₹{o.balance.toFixed(2)}</td>
                      <td>{o.days_pending} day(s)</td>
                      <td>{new Date(o.service_date).toLocaleDateString('en-IN')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No outstanding balances found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
