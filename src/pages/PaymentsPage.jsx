import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  CreditCard,
  AlertCircle,
  IndianRupee,
  Clock,
  Printer,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import PaymentModal from '../components/PaymentModal.jsx';
import ReceiptModal from '../components/ReceiptModal.jsx';

export default function PaymentsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentRecord, setPaymentRecord] = useState(null);
  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  const loadOutstanding = async () => {
    try {
      setLoading(true);
      const res = await api.reports.getOutstanding();
      if (res.success) {
        setReport(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load outstanding payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments & Outstanding Balances</h1>
          <p className="page-subtitle">Track pending customer dues, collect settlements, and maintain balanced ledgers</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="stat-card" style={{ borderColor: '#fecaca', backgroundColor: '#fff5f5' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ color: '#991b1b' }}>Total Pending Balance</span>
            <AlertCircle size={20} color="#dc2626" />
          </div>
          <div className="stat-value" style={{ color: '#b91c1c' }}>
            ₹{report?.summary?.totalOutstanding?.toFixed(2) || '0.00'}
          </div>
          <div className="stat-desc" style={{ color: '#991b1b' }}>
            To be collected from customers
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Unsettled Records</span>
            <Clock size={20} color="#d97706" />
          </div>
          <div className="stat-value">{report?.summary?.recordCount || 0}</div>
          <div className="stat-desc">Partially paid or unpaid services</div>
        </div>
      </div>

      {/* Outstanding Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Customers With Pending Balances</h2>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Service Name</th>
                <th>Total (₹)</th>
                <th>Paid So Far (₹)</th>
                <th>Remaining Due (₹)</th>
                <th>Days Pending</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading pending balances...
                  </td>
                </tr>
              ) : report?.data && report.data.length > 0 ? (
                report.data.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{r.receipt_number}</strong>
                    </td>
                    <td>
                      <strong>{r.customer_name}</strong>
                    </td>
                    <td>{r.customer_mobile}</td>
                    <td>{r.service_name_snapshot}</td>
                    <td>₹{r.total_charge.toFixed(2)}</td>
                    <td style={{ color: '#16a34a' }}>₹{r.paid_amount.toFixed(2)}</td>
                    <td style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.95rem' }}>
                      ₹{r.balance.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: r.days_pending > 15 ? '#fee2e2' : '#fef3c7',
                          color: r.days_pending > 15 ? '#b91c1c' : '#b45309',
                        }}
                      >
                        {r.days_pending} day(s)
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(r.service_date).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '5px 12px', fontSize: '0.8rem' }}
                          onClick={() => setPaymentRecord(r)}
                        >
                          <CreditCard size={14} />
                          <span>Collect Payment</span>
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="Print Receipt"
                          onClick={() => setSelectedReceiptId(r.id)}
                        >
                          <Printer size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle size={32} color="#16a34a" />
                      <span style={{ fontWeight: '600', color: '#15803d' }}>
                        All caught up! Zero outstanding balances.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collect Payment Modal */}
      {paymentRecord && (
        <PaymentModal
          record={paymentRecord}
          onClose={() => setPaymentRecord(null)}
          onSuccess={() => {
            setPaymentRecord(null);
            loadOutstanding();
          }}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceiptId && (
        <ReceiptModal
          serviceRecordId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
