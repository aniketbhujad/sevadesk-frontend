import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  FileText,
  IndianRupee,
  CalendarCheck,
  PlusCircle,
  Search,
  ArrowRight,
  Printer,
  CreditCard,
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);

  const navigate = useNavigate();

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.dashboard.getSummary();
      if (res.success) {
        setSummary(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-paid">PAID</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-partial">PARTIALLY PAID</span>;
      case 'UNPAID':
        return <span className="badge badge-unpaid">UNPAID</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        Loading SevaDesk Dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card" style={{ padding: '24px', color: 'var(--danger)', textAlign: 'center' }}>
        <h3>Error loading dashboard</h3>
        <p style={{ marginTop: '8px' }}>{error}</p>
        <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={loadDashboard}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header with balanced, clean "New Service Record" button */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Operator Dashboard</h1>
          <p className="page-subtitle">Real-time daily transactions and collections summary</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/customers')}>
            <Search size={16} />
            <span>Find Customer</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/new-service')}>
            <PlusCircle size={16} />
            <span>+ New Service Record</span>
          </button>
        </div>
      </div>

      {/* ONLY THE 3 REQUESTED KPI METRICS IN A CLEAN 3-CARD GRID */}
      <div
        className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {/* 1. Services Today */}
        <div
          className="stat-card"
          style={{
            backgroundColor: '#f0fdfa',
            borderColor: '#99f6e4',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ color: '#0f766e', fontWeight: '800' }}>
              SERVICES TODAY
            </span>
            <FileText size={22} color="#0d9488" />
          </div>
          <div className="stat-value" style={{ color: '#134e4a', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px' }}>
            {summary?.servicesToday || 0}
          </div>
          <div className="stat-desc" style={{ color: '#0f766e', marginTop: '4px' }}>
            Transactions generated
          </div>
        </div>

        {/* 2. Today's Collection */}
        <div
          className="stat-card"
          style={{
            backgroundColor: '#ecfdf5',
            borderColor: '#a7f3d0',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ color: '#047857', fontWeight: '800' }}>
              TODAY'S COLLECTION
            </span>
            <IndianRupee size={22} color="#059669" />
          </div>
          <div className="stat-value" style={{ color: '#065f46', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px' }}>
            ₹{summary?.todayCollection?.toFixed(2) || '0.00'}
          </div>
          <div className="stat-desc" style={{ color: '#047857', marginTop: '4px' }}>
            Received today in cash/UPI
          </div>
        </div>

        {/* 3. Monthly Collection */}
        <div
          className="stat-card"
          style={{
            backgroundColor: '#f0fdf4',
            borderColor: '#bbf7d0',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label" style={{ color: '#15803d', fontWeight: '800' }}>
              MONTHLY COLLECTION
            </span>
            <CalendarCheck size={22} color="#16a34a" />
          </div>
          <div className="stat-value" style={{ color: '#14532d', fontSize: '2.2rem', fontWeight: '800', marginTop: '8px' }}>
            ₹{summary?.monthlyCollection?.toFixed(2) || '0.00'}
          </div>
          <div className="stat-desc" style={{ color: '#15803d', marginTop: '4px' }}>
            Current month settlement
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Service Records</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/service-records')}
          >
            <span>View All Records</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>Service</th>
                <th>Total (₹)</th>
                <th>Paid (₹)</th>
                <th>Balance (₹)</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                summary.recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{tx.receipt_number}</strong>
                    </td>
                    <td>{tx.customer_name}</td>
                    <td>{tx.customer_mobile}</td>
                    <td>{tx.service_name_snapshot}</td>
                    <td>₹{tx.total_charge.toFixed(2)}</td>
                    <td style={{ color: '#16a34a', fontWeight: '700' }}>₹{tx.paid_amount.toFixed(2)}</td>
                    <td style={{ fontWeight: tx.balance > 0 ? '700' : '400', color: tx.balance > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                      ₹{tx.balance.toFixed(2)}
                    </td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.service_date).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Print / View Receipt"
                          onClick={() => setSelectedReceiptId(tx.id)}
                        >
                          <Printer size={14} />
                        </button>
                        {tx.balance > 0 && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Collect Remaining Payment"
                            onClick={() => setPaymentRecord(tx)}
                          >
                            <CreditCard size={14} />
                            <span>Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No service records found. Click <strong>"+ New Service Record"</strong> to add your first transaction!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptId && (
        <ReceiptModal
          serviceRecordId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}

      {/* Collect Payment Modal */}
      {paymentRecord && (
        <PaymentModal
          record={paymentRecord}
          onClose={() => setPaymentRecord(null)}
          onSuccess={() => {
            setPaymentRecord(null);
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}
