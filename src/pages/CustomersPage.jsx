import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Users,
  Search,
  UserPlus,
  History,
  Edit2,
  X,
  AlertCircle,
  FileText,
  CreditCard,
  IndianRupee,
} from 'lucide-react';
import QuickAddCustomerModal from '../components/QuickAddCustomerModal.jsx';
import ReceiptModal from '../components/ReceiptModal.jsx';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalRecords: 0 });

  const [showAddModal, setShowAddModal] = useState(false);
  const [viewHistoryCustomer, setViewHistoryCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState(null);

  const [selectedReceiptId, setSelectedReceiptId] = useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.customers.list({ search: search.trim(), page, limit: 15 });
      if (res.success) {
        setCustomers(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Failed to load customers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, page]);

  // Load history when modal opens
  const openHistory = async (customer) => {
    setViewHistoryCustomer(customer);
    try {
      setHistoryLoading(true);
      const res = await api.customers.getHistory(customer.id);
      if (res.success) {
        setHistoryData(res);
      }
    } catch (err) {
      console.error('Failed to load customer history:', err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openEdit = (customer) => {
    setEditingCustomer(customer);
    setEditName(customer.name);
    setEditMobile(customer.mobile);
    setEditEmail(customer.email || '');
    setEditAddress(customer.address || '');
    setEditNotes(customer.notes || '');
    setEditError(null);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setEditError(null);
    try {
      setEditSubmitting(true);
      const res = await api.customers.update(editingCustomer.id, {
        name: editName.trim(),
        mobile: editMobile.trim(),
        email: editEmail.trim() || null,
        address: editAddress.trim() || null,
        notes: editNotes.trim() || null,
      });

      if (res.success) {
        setEditingCustomer(null);
        loadCustomers();
      }
    } catch (err) {
      setEditError(err.message || 'Failed to update customer');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Records</h1>
          <p className="page-subtitle">Directory of registered citizens, visit logs, and balance history</p>
        </div>

        <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search customers by name, 10-digit mobile number, or Customer ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Full Name</th>
                <th>Mobile Number</th>
                <th>Address</th>
                <th>Total Visits</th>
                <th>Total Billed</th>
                <th>Total Paid</th>
                <th>Outstanding Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.customer_code}</strong>
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.mobile}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{c.address || '—'}</td>
                    <td>{c.total_services} service(s)</td>
                    <td>₹{c.total_billed.toFixed(2)}</td>
                    <td style={{ color: '#16a34a' }}>₹{c.total_paid.toFixed(2)}</td>
                    <td style={{ fontWeight: c.total_balance > 0 ? '700' : '400', color: c.total_balance > 0 ? '#dc2626' : 'var(--text-muted)' }}>
                      ₹{c.total_balance.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="View Service & Payment History"
                          onClick={() => openHistory(c)}
                        >
                          <History size={14} />
                          <span>History</span>
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Edit Customer"
                          onClick={() => openEdit(c)}
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No customers found matching "{search}".
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
              Showing Page {page} of {pagination.totalPages} ({pagination.totalRecords} total customers)
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

      {/* Customer Service & Payment History Modal */}
      {viewHistoryCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h3 className="card-title">Customer History: {viewHistoryCustomer.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Mobile: {viewHistoryCustomer.mobile} | ID: {viewHistoryCustomer.customer_code}
                </div>
              </div>
              <button
                onClick={() => setViewHistoryCustomer(null)}
                className="btn btn-outline btn-sm"
                style={{ padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading history records...
                </div>
              ) : historyData ? (
                <div>
                  {/* Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL SERVICES</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>{historyData.summary.totalServices}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TOTAL CHARGES</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>₹{historyData.summary.totalBilled.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: '#166534' }}>TOTAL PAID</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#15803d' }}>₹{historyData.summary.totalPaid.toFixed(2)}</div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: historyData.summary.totalOutstanding > 0 ? '#fff5f5' : '#f0fdf4', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.72rem', color: historyData.summary.totalOutstanding > 0 ? '#991b1b' : '#166534' }}>OUTSTANDING</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: historyData.summary.totalOutstanding > 0 ? '#b91c1c' : '#15803d' }}>
                        ₹{historyData.summary.totalOutstanding.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Services table */}
                  <div className="table-container">
                    <table className="table" style={{ fontSize: '0.82rem' }}>
                      <thead>
                        <tr>
                          <th>Receipt #</th>
                          <th>Service</th>
                          <th>Total</th>
                          <th>Paid</th>
                          <th>Balance</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Receipt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.services.length > 0 ? (
                          historyData.services.map((s) => (
                            <tr key={s.id}>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{s.receipt_number}</td>
                              <td>{s.service_name_snapshot}</td>
                              <td>₹{s.total_charge.toFixed(2)}</td>
                              <td style={{ color: '#16a34a' }}>₹{s.paid_amount.toFixed(2)}</td>
                              <td style={{ color: s.balance > 0 ? '#dc2626' : 'var(--text-muted)', fontWeight: s.balance > 0 ? '700' : '400' }}>
                                ₹{s.balance.toFixed(2)}
                              </td>
                              <td>
                                <span className={`badge badge-${s.status === 'PAID' ? 'paid' : s.status === 'PARTIALLY_PAID' ? 'partial' : 'unpaid'}`}>
                                  {s.status}
                                </span>
                              </td>
                              <td>{new Date(s.service_date).toLocaleDateString('en-IN')}</td>
                              <td>
                                <button
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '2px 6px' }}
                                  onClick={() => setSelectedReceiptId(s.id)}
                                >
                                  Print
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                              No service transactions recorded for this customer yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setViewHistoryCustomer(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="card-title">Edit Customer Details</h3>
              <button onClick={() => setEditingCustomer(null)} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div className="modal-body">
                {editError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--danger-bg)',
                      color: 'var(--danger-text)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '14px',
                      fontSize: '0.85rem',
                    }}
                  >
                    {editError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mobile Number *</label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="form-input"
                    required
                  />
                  <div className="form-help">Audited: Changes to phone number are logged.</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email (Optional)</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Address (Optional)</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={editSubmitting}>
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {showAddModal && (
        <QuickAddCustomerModal
          onClose={() => setShowAddModal(false)}
          onCustomerCreated={() => {
            setShowAddModal(false);
            loadCustomers();
          }}
        />
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptId && (
        <ReceiptModal
          serviceRecordId={selectedReceiptId}
          onClose={() => setSelectedReceiptId(null)}
        />
      )}
    </div>
  );
}
