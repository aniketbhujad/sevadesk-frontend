import React, { useState } from 'react';
import { api } from '../services/api.js';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentModal({ record, onClose, onSuccess }) {
  const [amount, setAmount] = useState(record?.balance ? String(record.balance) : '');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [sendSms, setSendSms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!record) return null;

  const maxPayable = parseFloat(record.balance || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    if (numAmount > maxPayable) {
      setError(`Payment cannot exceed the remaining balance of ₹${maxPayable.toFixed(2)}.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.payments.add(record.id, {
        amount: numAmount,
        paymentMethod,
        transactionReference: reference || null,
        notes: notes || null,
        sendSms,
      });

      if (res.success) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3 className="card-title">Collect Payment</h3>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger-text)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <strong>{record.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Receipt #:</span>
                <strong>{record.receipt_number}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Service:</span>
                <span>{record.service_name_snapshot}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Charge:</span>
                <span>₹{parseFloat(record.total_charge).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '6px', marginTop: '6px' }}>
                <strong style={{ color: 'var(--danger)' }}>Remaining Balance:</strong>
                <strong style={{ color: 'var(--danger)', fontSize: '1rem' }}>₹{maxPayable.toFixed(2)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxPayable}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                required
                style={{ fontSize: '1.1rem', fontWeight: '700' }}
              />
              <div className="form-help">Max payable: ₹{maxPayable.toFixed(2)}</div>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Mode *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-select"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm / BHIM)</option>
                <option value="Card">Debit / Credit Card</option>
                <option value="NetBanking">Net Banking</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Reference / UTR Number (Optional)</label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="form-input"
                placeholder="e.g. UPI Ref / Cheque No"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                placeholder="e.g. Paid in full"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <input
                type="checkbox"
                id="sendSmsPayment"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="sendSmsPayment" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                Send SMS confirmation receipt to customer
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
