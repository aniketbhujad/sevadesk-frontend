import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { Printer, X, Download } from 'lucide-react';

export default function ReceiptModal({ serviceRecordId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setLoading(true);
        const res = await api.serviceRecords.getReceipt(serviceRecordId);
        if (res.success) {
          setData(res.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load receipt');
      } finally {
        setLoading(false);
      }
    }
    if (serviceRecordId) {
      loadReceipt();
    }
  }, [serviceRecordId]);

  const handlePrint = () => {
    window.print();
  };

  if (!serviceRecordId) return null;

  return (
    <div className="modal-overlay no-print-backdrop">
      <div className="modal-content" style={{ maxWidth: '480px' }}>
        <div className="modal-header no-print">
          <h3 className="card-title">Customer Receipt</h3>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
              Loading receipt details...
            </div>
          ) : error ? (
            <div style={{ color: 'var(--danger)', padding: '16px', textAlign: 'center' }}>{error}</div>
          ) : data ? (
            <div className="receipt-container" id="printable-receipt">
              <div className="receipt-header">
                <h2>{data.centre.name}</h2>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '4px' }}>
                  {data.centre.address}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569' }}>
                  Tel: {data.centre.phone} | Centre ID: {data.centre.code}
                </div>
              </div>

              <div className="receipt-row" style={{ fontSize: '0.8rem', color: '#475569' }}>
                <span>Receipt No:</span>
                <strong>{data.receipt.receiptNumber}</strong>
              </div>
              <div className="receipt-row" style={{ fontSize: '0.8rem', color: '#475569' }}>
                <span>Date & Time:</span>
                <span>{new Date(data.receipt.date).toLocaleString('en-IN')}</span>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-row">
                <span>Customer:</span>
                <strong>{data.receipt.customerName}</strong>
              </div>
              <div className="receipt-row">
                <span>Mobile:</span>
                <span>{data.receipt.customerMobile}</span>
              </div>
              {data.receipt.customerCode && (
                <div className="receipt-row" style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  <span>Customer ID:</span>
                  <span>{data.receipt.customerCode}</span>
                </div>
              )}

              <div className="receipt-divider"></div>

              <div className="receipt-row">
                <span>Service Provided:</span>
                <strong style={{ textAlign: 'right', maxWidth: '60%' }}>{data.receipt.serviceName}</strong>
              </div>

              <div className="receipt-divider"></div>

              <div className="receipt-row">
                <span>Total Service Charge:</span>
                <strong>₹{data.receipt.totalCharge.toFixed(2)}</strong>
              </div>
              <div className="receipt-row" style={{ color: '#16a34a' }}>
                <span>Amount Paid To Date:</span>
                <strong>₹{data.receipt.totalPaid.toFixed(2)}</strong>
              </div>
              <div className="receipt-row receipt-total" style={{ color: data.receipt.balance > 0 ? '#dc2626' : '#16a34a', marginTop: '6px' }}>
                <span>Remaining Balance:</span>
                <span>₹{data.receipt.balance.toFixed(2)}</span>
              </div>
              <div className="receipt-row" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                <span>Payment Status:</span>
                <strong>{data.receipt.status}</strong>
              </div>

              {data.receipt.payments && data.receipt.payments.length > 0 && (
                <>
                  <div className="receipt-divider"></div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '6px', color: '#475569' }}>
                    Payment Breakdown:
                  </div>
                  {data.receipt.payments.map((p, idx) => (
                    <div key={idx} className="receipt-row" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      <span>
                        #{idx + 1} {p.payment_method} ({new Date(p.received_at).toLocaleDateString('en-IN')}):
                      </span>
                      <span>₹{p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}

              <div className="receipt-divider"></div>
              <div className="receipt-footer">
                <div>{data.centre.receiptFooter}</div>
                <div style={{ marginTop: '4px', fontSize: '0.7rem' }}>Powered by SevaDesk CSC CRM</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer no-print">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
