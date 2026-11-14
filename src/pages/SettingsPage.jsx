import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import {
  Settings,
  Building,
  Bookmark,
  BookmarkCheck,
  MessageSquare,
  Save,
  PlusCircle,
  Edit2,
  CheckCircle,
  AlertCircle,
  Search,
  Sparkles,
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('centre'); // 'centre' | 'catalogue' | 'sms'

  // Centre Settings
  const [centreName, setCentreName] = useState('');
  const [centreCode, setCentreCode] = useState('');
  const [centrePhone, setCentrePhone] = useState('');
  const [centreAddress, setCentreAddress] = useState('');
  const [receiptFooter, setReceiptFooter] = useState('');
  const [smsEnabled, setSmsEnabled] = useState('false');
  const [smsTemplate, setSmsTemplate] = useState('');
  const [smsInfo, setSmsInfo] = useState(null);

  // Services Catalogue
  const [services, setServices] = useState([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  // Add Service Form
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('General');
  const [newServiceCharge, setNewServiceCharge] = useState('');
  const [newServicePinned, setNewServicePinned] = useState(false);

  // Status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadSettingsAndCatalogue = async () => {
    try {
      setLoading(true);
      const [settingsRes, servicesRes] = await Promise.all([
        api.settings.get(),
        api.services.list(),
      ]);

      if (settingsRes.success) {
        const d = settingsRes.data;
        setCentreName(d.centre_name || '');
        setCentreCode(d.centre_code || '');
        setCentrePhone(d.centre_phone || '');
        setCentreAddress(d.centre_address || '');
        setReceiptFooter(d.receipt_footer || '');
        setSmsEnabled(d.sms_enabled || 'false');
        setSmsTemplate(d.sms_template || '');
        setSmsInfo(settingsRes.smsInfo);
      }

      if (servicesRes.success) {
        setServices(servicesRes.data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettingsAndCatalogue();
  }, []);

  const handleSaveCentreSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await api.settings.update({
        centre_name: centreName.trim(),
        centre_code: centreCode.trim(),
        centre_phone: centrePhone.trim(),
        centre_address: centreAddress.trim(),
        receipt_footer: receiptFooter.trim(),
        sms_enabled: smsEnabled,
        sms_template: smsTemplate.trim(),
      });

      if (res.success) {
        setMessage({ type: 'success', text: 'Settings updated successfully!' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (service) => {
    try {
      const updatedPinned = !service.is_pinned;
      const res = await api.services.update(service.id, {
        isPinned: updatedPinned,
      });

      if (res.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, is_pinned: updatedPinned } : s))
        );
      }
    } catch (err) {
      alert('Failed to update service pinned status: ' + err.message);
    }
  };

  const handleSaveServicePrice = async (serviceId) => {
    try {
      const numPrice = parseFloat(editPrice);
      if (isNaN(numPrice) || numPrice < 0) {
        alert('Please enter a valid price.');
        return;
      }

      const res = await api.services.update(serviceId, {
        defaultCharge: numPrice,
      });

      if (res.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, default_charge: numPrice } : s))
        );
        setEditingService(null);
      }
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const numCharge = parseFloat(newServiceCharge) || 0;
      const res = await api.services.create({
        name: newServiceName.trim(),
        category: newServiceCategory.trim(),
        defaultCharge: numCharge,
        isPinned: newServicePinned,
      });

      if (res.success) {
        setShowAddService(false);
        setNewServiceName('');
        setNewServiceCharge('');
        loadSettingsAndCatalogue();
      }
    } catch (err) {
      alert('Failed to create service: ' + err.message);
    }
  };

  // Preview formatted SMS with sample variables
  const sampleSmsPreview = smsTemplate
    .replace('{CENTRE_NAME}', centreName || 'SevaDesk CSC')
    .replace('{RECEIPT_NO}', 'SD-2026-123456')
    .replace('{SERVICE_NAME}', 'PAN Card Application')
    .replace('{TOTAL}', '120.00')
    .replace('{PAID_TO_DATE}', '120.00')
    .replace('{BALANCE}', '0.00');

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
      s.category.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Centre Configuration & Settings</h1>
          <p className="page-subtitle">Configure CSC Kendra information, receipt footers, service catalog, and AWS SMS options</p>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            fontSize: '0.85rem',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#15803d' : '#b91c1c',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'centre' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('centre')}
        >
          <Building size={16} />
          <span>Kendra Details & Receipts</span>
        </button>
        <button
          className={`btn ${activeTab === 'catalogue' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('catalogue')}
        >
          <Sparkles size={16} />
          <span>Services & Pinned Quick-Pills ({services.length})</span>
        </button>
        <button
          className={`btn ${activeTab === 'sms' ? 'btn-primary' : 'btn-outline'} btn-sm`}
          onClick={() => setActiveTab('sms')}
        >
          <MessageSquare size={16} />
          <span>AWS SMS Notifications</span>
        </button>
      </div>

      {/* Tab 1: Kendra Details */}
      {activeTab === 'centre' && (
        <div className="card" style={{ maxWidth: '680px' }}>
          <div className="card-header">
            <h2 className="card-title">CSC Centre Profile & Print Footer</h2>
          </div>
          <form onSubmit={handleSaveCentreSettings}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Centre Display Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={centreName}
                  onChange={(e) => setCentreName(e.target.value)}
                  placeholder="e.g. SevaDesk CSC Kendra"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Centre Code / VLE ID</label>
                <input
                  type="text"
                  className="form-input"
                  value={centreCode}
                  onChange={(e) => setCentreCode(e.target.value)}
                  placeholder="e.g. CSC-2026-IND"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Centre Contact Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={centrePhone}
                  onChange={(e) => setCentrePhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Centre Address</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={centreAddress}
                  onChange={(e) => setCentreAddress(e.target.value)}
                  placeholder="Shop No. 4, Main Bazar, Opposite Tehsil Office"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Receipt Footer Message</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={receiptFooter}
                  onChange={(e) => setReceiptFooter(e.target.value)}
                  placeholder="Thank you for visiting! For queries please retain this receipt."
                />
                <div className="form-help">Printed at the bottom of all customer receipts.</div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Kendra Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Services Catalogue & Pinned Items */}
      {activeTab === 'catalogue' && (
        <div>
          <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  placeholder="Search service name or category..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                />
              </div>

              <button className="btn btn-primary btn-sm" onClick={() => setShowAddService(!showAddService)}>
                <PlusCircle size={16} />
                <span>{showAddService ? 'Close Add Form' : 'Add New Service'}</span>
              </button>
            </div>

            {/* Quick explanation about Pinned Services */}
            <div style={{ marginTop: '12px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              💡 <strong>Tip:</strong> Click the <strong>Bookmark / Pin icon</strong> next to any service to make it appear as a quick-select button on the Dashboard and New Service screen!
            </div>
          </div>

          {/* Add Service Collapsible Box */}
          {showAddService && (
            <div className="card" style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8fafc' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Add Custom Service</h3>
              <form onSubmit={handleCreateService}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label className="form-label">Service Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Police Clearance Form"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Certificates & Identity"
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Default Fee (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-input"
                      placeholder="50.00"
                      value={newServiceCharge}
                      onChange={(e) => setNewServiceCharge(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="checkbox"
                    id="newPin"
                    checked={newServicePinned}
                    onChange={(e) => setNewServicePinned(e.target.checked)}
                  />
                  <label htmlFor="newPin" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                    Pin to quick-select bar (Most used)
                  </label>
                </div>

                <button type="submit" className="btn btn-primary btn-sm">
                  Save New Service
                </button>
              </form>
            </div>
          )}

          {/* Service catalogue table */}
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Pin</th>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Default Charge (₹)</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((svc) => (
                    <tr key={svc.id}>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{
                            padding: '4px',
                            border: 'none',
                            color: svc.is_pinned ? '#0f766e' : '#94a3b8',
                          }}
                          title={svc.is_pinned ? 'Pinned to Quick Bar (Click to unpin)' : 'Click to pin to Quick Bar'}
                          onClick={() => handleTogglePin(svc)}
                        >
                          {svc.is_pinned ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
                        </button>
                      </td>
                      <td>
                        <strong>{svc.name}</strong>
                      </td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                          {svc.category}
                        </span>
                      </td>
                      <td>
                        {editingService === svc.id ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-input"
                              style={{ width: '90px', padding: '4px 8px', fontSize: '0.85rem' }}
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              autoFocus
                            />
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => handleSaveServicePrice(svc.id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => setEditingService(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontWeight: '600' }}>₹{svc.default_charge.toFixed(2)}</span>
                        )}
                      </td>
                      <td>
                        {svc.is_pinned ? (
                          <span className="badge" style={{ backgroundColor: '#ccfbf1', color: '#115e59' }}>
                            PINNED
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="Change fee"
                          onClick={() => {
                            setEditingService(svc.id);
                            setEditPrice(String(svc.default_charge));
                          }}
                        >
                          <Edit2 size={12} />
                          <span>Edit Fee</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: SMS Settings */}
      {activeTab === 'sms' && (
        <div className="card" style={{ maxWidth: '680px' }}>
          <div className="card-header">
            <h2 className="card-title">AWS End User Messaging SMS Options</h2>
          </div>
          <form onSubmit={handleSaveCentreSettings}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">SMS Delivery Status</label>
                <select
                  className="form-select"
                  value={smsEnabled}
                  onChange={(e) => setSmsEnabled(e.target.value)}
                >
                  <option value="false">Disabled / Mock Mode (Recommended for testing without charges)</option>
                  <option value="true">Live AWS End User Messaging SMS (Active)</option>
                </select>
                <div className="form-help">
                  In mock mode, SMS records are created and logged in the Outbox without sending real network SMS.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">SMS Receipt Template</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={smsTemplate}
                  onChange={(e) => setSmsTemplate(e.target.value)}
                />
                <div className="form-help">
                  Available tags: <code>{'{CENTRE_NAME}'}</code>, <code>{'{RECEIPT_NO}'}</code>,{' '}
                  <code>{'{SERVICE_NAME}'}</code>, <code>{'{TOTAL}'}</code>, <code>{'{PAID_TO_DATE}'}</code>,{' '}
                  <code>{'{BALANCE}'}</code>
                </div>
              </div>

              {/* Live Preview of formatted SMS */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Sample Formatted SMS Preview
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#1e293b' }}>
                  {sampleSmsPreview}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                  Length: {sampleSmsPreview.length} characters (~1 standard SMS segment)
                </div>
              </div>

              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.82rem',
                  marginBottom: '20px',
                }}
              >
                <strong>Security Notice:</strong> AWS credentials (Access Keys / IAM roles) are managed strictly on the backend and are never exposed to the browser.
              </div>

              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save SMS Configuration'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
