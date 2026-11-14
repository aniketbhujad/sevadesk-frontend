import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Search,
  Filter,
  Printer,
  CreditCard,
  Send,
  Calendar,
  AlertCircle,
  FileText,
  Layers,
} from 'lucide-react';
import ReceiptModal from '../components/ReceiptModal.jsx';
import PaymentModal from '../components/PaymentModal.jsx';

export default function ServiceRecordsPage() {
  const [records, setRecords] = useState([]);
  const [servicesCatalogue, setServicesCatalogue] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });

  const [selectedReceiptId, setSelectedReceiptId] = useState(null);
  const [paymentRecord, setPaymentRecord] = useState(null);
  const [smsActionLoading, setSmsActionLoading] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // Load services list for the service filter dropdown
  useEffect(() => {
    async function loadServicesList() {
      try {
        const res = await api.services.list();
        if (res.success) {
          setServicesCatalogue(res.data);
        }
      } catch (err) {
        console.error('Failed to load services catalogue:', err.message);
      }
    }
    loadServicesList();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const res = await api.serviceRecords.list({
        search: search.trim(),
        status,
        service: selectedService,
        from: fromDate,
        to: toDate,
        page,
        limit: 15,
      });

      if (res.success) {
        setRecords(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load service records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [search, status, selectedService, fromDate, toDate, page]);

  const handleResendSms = async (recordId) => {
    try {
      setSmsActionLoading(recordId);
      setActionMessage(null);
      const res = await api.serviceRecords.sendReceipt(recordId);
      if (res.success) {
        setActionMessage({ type: 'success', text: 'SMS receipt dispatched successfully!' });
        loadRecords();
      } else {
        setActionMessage({ type: 'error', text: 'SMS send failed: ' + (res.error || 'Provider rejected') });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to dispatch SMS' });
    } finally {
      setSmsActionLoading(null);
    }
  };

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

  const getSmsBadge = (smsStatus) => {
    switch (smsStatus) {
      case 'SENT':
        return <span className="badge badge-sent">SMS SENT</span>;
      case 'DELIVERED':
        return <span className="badge badge-delivered">DELIVERED</span>;
      case 'FAILED':
        return <span className="badge badge-failed">SMS FAILED</span>;
      case 'PENDING':
      case 'SENDING':
        return <span className="badge badge-pending">{smsStatus}</span>;
      default:
        return <span style={{ color: 'var(--text-subtle)', fontSize: '0.78rem' }}>None</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Service Records & Transactions</h1>
          <p className="page-subtitle">Master ledger of all service requests, receipt numbers, and settlement statuses</p>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.85rem',
            backgroundColor: actionMessage.type === 'success' ? '#ecfdf5' : '#fff1f2',
            color: actionMessage.type === 'success' ? '#065f46' : '#9f1239',
            border: `1px solid ${actionMessage.type === 'success' ? '#a7f3d0' : '#fecdd3'}`,
          }}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Filter Toolbar with Service Filter Dropdown */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Search by receipt or customer */}
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search receipt #, customer, mobile..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Service filter: lists all ~80 services */}
          <div>
            <select
              className="form-select"
              value={selectedService}
              onChange={(e) => {
                setSelectedService(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Services ({servicesCatalogue.length})</option>
              {servicesCatalogue.map((svc) => (
                <option key={svc.id} value={svc.name}>
                  {svc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              className="form-select"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Payment Statuses</option>
              <option value="PAID">Paid Only</option>
              <option value="PARTIALLY_PAID">Partially Paid Only</option>
              <option value="UNPAID">Unpaid Only</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              placeholder="From Date"
              title="From Date"
            />
          </div>

          {/* Date to */}
          <div>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              placeholder="To Date"
              title="To Date"
            />
          </div>
        </div>

        {(search || status || selectedService || fromDate || toDate) && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Filtered by: {selectedService ? `Service: "${selectedService}"` : ''} {status ? `Status: "${status}"` : ''}
            </span>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setSearch('');
                setStatus('');
                setSelectedService('');
                setFromDate('');
                setToDate('');
                setPage(1);
              }}
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Service Records Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Service Name</th>
                <th>Total (₹)</th>
                <th>Paid (₹)</th>
                <th>Balance (₹)</th>
                <th>Status</th>
                <th>SMS Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading service records...
                  </td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => (
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
                    <td style={{ color: '#16a34a', fontWeight: '700' }}>₹{r.paid_amount.toFixed(2)}</td>
                    <td style={{ fontWeight: r.balance > 0 ? '700' : '400', color: r.balance > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                      ₹{r.balance.toFixed(2)}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td>{getSmsBadge(r.latest_sms_status)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(r.service_date).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Print Customer Receipt"
                          onClick={() => setSelectedReceiptId(r.id)}
                        >
                          <Printer size={14} />
                        </button>

                        {r.balance > 0 && (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            title="Record Additional Payment"
                            onClick={() => setPaymentRecord(r)}
                          >
                            <CreditCard size={14} />
                            <span>Pay</span>
                          </button>
                        )}

                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Resend SMS Receipt"
                          disabled={smsActionLoading === r.id}
                          onClick={() => handleResendSms(r.id)}
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No service records found matching your filters.
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
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Showing Page {page} of {pagination.totalPages} ({pagination.totalRecords} total records)
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

      {/* Printable Receipt Modal */}
      {selectedReceiptId && (
        <ReceiptModal
          serviceRecordId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}

      {/* Payment Collector Modal */}
      {paymentRecord && (
        <PaymentModal
          record={paymentRecord}
          onClose={() => setPaymentRecord(null)}
          onSuccess={() => {
            setPaymentRecord(null);
            loadRecords();
          }}
        />
      )}
    </div>
  );
}
