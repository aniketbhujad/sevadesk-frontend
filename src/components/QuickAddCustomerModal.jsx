import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

export default function QuickAddCustomerModal({ initialMobile = '', onClose, onCustomerCreated }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(initialMobile);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [allowDuplicate, setAllowDuplicate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Check duplicate phone as user types 10 digits
  useEffect(() => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length >= 10) {
      api.customers.checkMobile(cleanMobile)
        .then((res) => {
          if (res.exists) {
            setDuplicateWarning(res.customer);
          } else {
            setDuplicateWarning(null);
          }
        })
        .catch(() => {});
    } else {
      setDuplicateWarning(null);
    }
  }, [mobile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      setSubmitting(true);
      const res = await api.customers.create({
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        allowDuplicateMobile: allowDuplicate,
      });

      if (res.success) {
        onCustomerCreated(res.data);
      }
    } catch (err) {
      if (err.data?.isDuplicate) {
        setDuplicateWarning(err.data.existingCustomer);
      }
      setError(err.message || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectExisting = () => {
    if (duplicateWarning) {
      onCustomerCreated(duplicateWarning);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="card-title">Add New Customer</h3>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
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
                {error}
              </div>
            )}

            {duplicateWarning && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--warning-bg)',
                  color: 'var(--warning-text)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                  <AlertTriangle size={16} />
                  <span>Existing Customer Found</span>
                </div>
                <div style={{ marginTop: '4px' }}>
                  {duplicateWarning.name} ({duplicateWarning.customer_code}) is already registered with this mobile number.
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    onClick={handleSelectExisting}
                  >
                    Select Existing Customer
                  </button>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allowDuplicate}
                      onChange={(e) => setAllowDuplicate(e.target.checked)}
                    />
                    Create duplicate profile anyway
                  </label>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Customer Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="e.g. Ramesh Kumar"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="form-input"
                placeholder="e.g. 9876543210"
                required
              />
              <div className="form-help">Enter 10-digit Indian mobile number</div>
            </div>

            <div className="form-group">
              <label className="form-label">Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="e.g. ramesh@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Village / Town Address (Optional)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="form-input"
                placeholder="e.g. Ward 4, Rampur"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                placeholder="Non-sensitive notes"
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save & Select Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
