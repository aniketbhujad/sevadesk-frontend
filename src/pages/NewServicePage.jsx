import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import {
  User,
  Phone,
  Search,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Pencil,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';

export default function NewServicePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Form input refs for auto-focusing on errors
  const nameRef = useRef(null);
  const phoneRef = useRef(null);
  const serviceRef = useRef(null);
  const chargeRef = useRef(null);
  const paidRef = useRef(null);
  const errorBannerRef = useRef(null);

  // Direct Customer Input State (Default flow)
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [existingCustomerId, setExistingCustomerId] = useState(null);

  // Side option: Search & pick existing customer
  const [showExistingSearch, setShowExistingSearch] = useState(false);
  const [existingSearchText, setExistingSearchText] = useState('');
  const [existingSearchResults, setExistingSearchResults] = useState([]);
  const [searchingExisting, setSearchingExisting] = useState(false);

  // Services catalogue & Quick Services (max 5)
  const [services, setServices] = useState([]);
  const [quickServices, setQuickServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [isCustomService, setIsCustomService] = useState(false);
  const [showCataloguePicker, setShowCataloguePicker] = useState(false);
  const [catalogueSearch, setCatalogueSearch] = useState('');

  // Financial fields
  const [totalCharge, setTotalCharge] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [sendSms, setSendSms] = useState(true);

  // Validation & Error state
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [quickServiceError, setQuickServiceError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successRedirecting, setSuccessRedirecting] = useState(false);

  // Load services catalogue on mount
  const loadServicesList = async () => {
    try {
      const res = await api.services.list();
      if (res.success) {
        setServices(res.data);
        // Extract up to 5 pinned services for the Quick Services bar
        const pinned = res.data.filter((s) => s.is_pinned).slice(0, 5);
        setQuickServices(pinned);
      }
    } catch (err) {
      console.error('Failed to load services:', err.message);
    }
  };

  useEffect(() => {
    loadServicesList();
  }, []);

  // Pre-select service if passed from dashboard
  useEffect(() => {
    if (location.state?.preselectedServiceName) {
      setServiceName(location.state.preselectedServiceName);
      if (location.state.preselectedServiceId) {
        setSelectedServiceId(String(location.state.preselectedServiceId));
      }
      if (location.state.preselectedCharge !== undefined) {
        setTotalCharge(String(location.state.preselectedCharge));
        setAmountPaid(String(location.state.preselectedCharge));
      }
    }
  }, [location.state]);

  // Search existing customers when search panel is open
  useEffect(() => {
    if (showExistingSearch && existingSearchText.trim().length >= 2) {
      setSearchingExisting(true);
      api.customers.list({ search: existingSearchText.trim(), limit: 6 })
        .then((res) => {
          if (res.success) {
            setExistingSearchResults(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setSearchingExisting(false));
    } else {
      setExistingSearchResults([]);
    }
  }, [existingSearchText, showExistingSearch]);

  // Handle service dropdown selection
  const handleSelectService = (serviceId) => {
    setErrors((prev) => ({ ...prev, serviceName: null }));
    if (serviceId === 'OTHER') {
      setIsCustomService(true);
      setSelectedServiceId('OTHER');
      setServiceName('');
      setTotalCharge('');
      setAmountPaid('');
      return;
    }

    setIsCustomService(false);
    setSelectedServiceId(String(serviceId));
    const found = services.find((s) => String(s.id) === String(serviceId));
    if (found) {
      setServiceName(found.name);
      setTotalCharge(String(found.default_charge));
      setAmountPaid(String(found.default_charge)); // Default to receiving full charge
    }
  };

  // Select a service from the Quick Services bar
  const handleQuickServiceClick = (svc) => {
    setIsCustomService(false);
    setSelectedServiceId(String(svc.id));
    setServiceName(svc.name);
    setTotalCharge(String(svc.default_charge));
    setAmountPaid(String(svc.default_charge));
    setErrors((prev) => ({ ...prev, serviceName: null }));
  };

  // Remove service from Quick Services (clicking pencil on chip)
  const handleRemoveFromQuick = async (e, svc) => {
    e.stopPropagation();
    setQuickServiceError(null);
    try {
      await api.services.update(svc.id, { isPinned: false });
      setQuickServices((prev) => prev.filter((s) => s.id !== svc.id));
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, is_pinned: false } : s))
      );
    } catch (err) {
      console.error('Failed to unpin service:', err.message);
    }
  };

  // Add a service to Quick Services (max 5 allowed)
  const handleAddToQuick = async (svc) => {
    setQuickServiceError(null);

    // Check if already in Quick Services
    if (quickServices.some((s) => s.id === svc.id)) {
      return;
    }

    // Check max 5 limit
    if (quickServices.length >= 5) {
      setQuickServiceError(
        'Quick Services is full (maximum 5 services allowed). Please click the pencil icon on one quick service to remove it before adding this.'
      );
      return;
    }

    try {
      await api.services.update(svc.id, { isPinned: true });
      const updatedSvc = { ...svc, is_pinned: true };
      setQuickServices((prev) => [...prev, updatedSvc]);
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, is_pinned: true } : s))
      );
    } catch (err) {
      setQuickServiceError('Failed to add to quick services: ' + err.message);
    }
  };

  // Add currently selected dropdown service to Quick Services
  const handleAddCurrentSelectedToQuick = () => {
    if (!selectedServiceId || selectedServiceId === 'OTHER') return;
    const found = services.find((s) => String(s.id) === selectedServiceId);
    if (found) {
      handleAddToQuick(found);
    }
  };

  // Pick existing customer from side drawer
  const handlePickExistingCustomer = (cust) => {
    setCustomerName(cust.name);
    setCustomerMobile(cust.mobile);
    setExistingCustomerId(cust.id);
    setShowExistingSearch(false);
    setExistingSearchText('');
    setErrors((prev) => ({ ...prev, customerName: null, customerMobile: null }));
  };

  // Remaining balance derivation
  const numCharge = parseFloat(totalCharge) || 0;
  const numPaid = parseFloat(amountPaid) || 0;
  const balancePreview = Math.max(0, numCharge - numPaid);

  // Validate form and focus on the exact line with the error
  const validateForm = () => {
    const errs = {};

    // 1. Customer Name validation
    if (!customerName.trim() || customerName.trim().length < 2) {
      errs.customerName = 'Please enter customer name (at least 2 letters).';
    }

    // 2. Mobile validation (must be exactly 10 digits starting with 6, 7, 8, or 9)
    const cleanMobile = customerMobile.replace(/\D/g, '');
    if (!cleanMobile) {
      errs.customerMobile = 'Mobile number is required.';
    } else if (cleanMobile.length !== 10) {
      errs.customerMobile = `Mobile number must be exactly 10 digits (currently ${cleanMobile.length} digits).`;
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      errs.customerMobile = 'Please enter a valid 10-digit Indian mobile number (starts with 6, 7, 8, or 9).';
    }

    // 3. Service selection validation
    if (!serviceName.trim()) {
      errs.serviceName = 'Please choose a service from the catalogue or enter a custom service.';
    }

    // 4. Charge validation
    if (isNaN(numCharge) || numCharge < 0) {
      errs.totalCharge = 'Please enter a valid non-negative charge.';
    }

    // 5. Amount received validation (cannot be more than total charge)
    if (isNaN(numPaid) || numPaid < 0) {
      errs.amountPaid = 'Amount received cannot be negative.';
    } else if (numPaid > numCharge) {
      errs.amountPaid = `Amount received (₹${numPaid}) cannot be more than total charge (₹${numCharge}).`;
    }

    setErrors(errs);

    // Scroll directly to the error line
    if (errs.customerName) {
      nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameRef.current?.focus();
      return false;
    }
    if (errs.customerMobile) {
      phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      phoneRef.current?.focus();
      return false;
    }
    if (errs.serviceName) {
      serviceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      serviceRef.current?.focus();
      return false;
    }
    if (errs.totalCharge) {
      chargeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      chargeRef.current?.focus();
      return false;
    }
    if (errs.amountPaid) {
      paidRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      paidRef.current?.focus();
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.serviceRecords.create({
        customerId: existingCustomerId ? parseInt(existingCustomerId, 10) : undefined,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        serviceId: selectedServiceId && selectedServiceId !== 'OTHER' ? parseInt(selectedServiceId, 10) : null,
        serviceName: serviceName.trim(),
        totalCharge: numCharge,
        amountPaid: numPaid,
        paymentMethod,
        transactionReference: reference.trim() || null,
        notes: notes.trim() || null,
        sendSms,
      });

      if (res.success) {
        setSuccessRedirecting(true);
        // Automatically redirect to Dashboard after successful save!
        setTimeout(() => {
          navigate('/', {
            state: {
              flashMessage: `Service record ${res.data.receiptNumber} saved successfully!`,
            },
          });
        }, 800);
      }
    } catch (err) {
      setGeneralError(err.message || 'Failed to save service record');
      if (err.data?.field === 'amountPaid') {
        setErrors((prev) => ({ ...prev, amountPaid: err.message }));
        paidRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        paidRef.current?.focus();
      } else if (err.data?.field === 'customerMobile') {
        setErrors((prev) => ({ ...prev, customerMobile: err.message }));
        phoneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        phoneRef.current?.focus();
      } else if (err.data?.field === 'customerName') {
        setErrors((prev) => ({ ...prev, customerName: err.message }));
        nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameRef.current?.focus();
      } else {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter catalogue when opening full list
  const filteredCatalogue = services.filter((s) =>
    s.name.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    s.category.toLowerCase().includes(catalogueSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Service Record</h1>
          <p className="page-subtitle">Direct citizen entry: record service, accept payment, and issue receipt</p>
        </div>
      </div>

      {/* Success Notification Banner before automatic redirect */}
      {successRedirecting && (
        <div
          className="card"
          style={{
            borderColor: '#86efac',
            backgroundColor: '#ecfdf5',
            marginBottom: '20px',
            padding: '20px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#065f46', fontSize: '1.1rem', fontWeight: '700' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <span>Record saved successfully! Redirecting to Dashboard...</span>
          </div>
        </div>
      )}

      {/* General error banner */}
      {generalError && (
        <div
          ref={errorBannerRef}
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg)',
            color: 'var(--danger-text)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--danger-border)',
            marginBottom: '20px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={20} />
          <span>{generalError}</span>
        </div>
      )}

      {/* Main Entry Card */}
      <div className="card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="card-body">

            {/* SECTION 1: CUSTOMER DETAILS (Direct input by default, with side option to search existing) */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  1. Citizen / Customer Information
                </div>

                {/* Option to search existing customer at side */}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                  onClick={() => setShowExistingSearch(!showExistingSearch)}
                >
                  <Search size={14} />
                  <span>{showExistingSearch ? 'Close Search' : 'Choose Existing Customer'}</span>
                </button>
              </div>

              {/* Side/Dropdown Search Panel for Existing Customer */}
              {showExistingSearch && (
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    marginBottom: '16px',
                  }}
                >
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>
                    Search Existing Citizen by Name, Mobile, or Customer ID:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Type name or phone number..."
                    value={existingSearchText}
                    onChange={(e) => setExistingSearchText(e.target.value)}
                    autoFocus
                  />

                  {searchingExisting && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      Searching records...
                    </div>
                  )}

                  {existingSearchResults.length > 0 && (
                    <div
                      style={{
                        marginTop: '8px',
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        maxHeight: '160px',
                        overflowY: 'auto',
                      }}
                    >
                      {existingSearchResults.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handlePickExistingCustomer(c)}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.85rem',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          <div>
                            <strong>{c.name}</strong> ({c.mobile})
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {c.customer_code}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Linked Customer Badge if picked from search */}
              {existingCustomerId && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.82rem',
                    color: '#065f46',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#059669" />
                    <span>
                      Existing profile linked: <strong>{customerName}</strong> ({customerMobile})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ padding: '2px 8px', fontSize: '0.72rem', backgroundColor: '#ffffff' }}
                    onClick={() => {
                      setExistingCustomerId(null);
                      setCustomerName('');
                      setCustomerMobile('');
                    }}
                  >
                    Clear (New Citizen)
                  </button>
                </div>
              )}

              {/* Direct Name and 10-Digit Mobile Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Customer Name *</label>
                  <input
                    ref={nameRef}
                    type="text"
                    className={`form-input ${errors.customerName ? 'is-invalid' : ''}`}
                    placeholder="e.g. Ramesh Kumar"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setExistingCustomerId(null); // Reset linked profile when user modifies name!
                      if (errors.customerName) setErrors((prev) => ({ ...prev, customerName: null }));
                    }}
                    required
                  />
                  {errors.customerName && <div className="form-error-text">{errors.customerName}</div>}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Mobile Number (10 Digits) *</label>
                  <input
                    ref={phoneRef}
                    type="tel"
                    maxLength={10}
                    className={`form-input ${errors.customerMobile ? 'is-invalid' : ''}`}
                    placeholder="e.g. 9876543210"
                    value={customerMobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setCustomerMobile(val);
                      setExistingCustomerId(null); // Reset linked profile when user modifies mobile!
                      if (errors.customerMobile) setErrors((prev) => ({ ...prev, customerMobile: null }));
                    }}
                    required
                  />
                  {errors.customerMobile ? (
                    <div className="form-error-text">{errors.customerMobile}</div>
                  ) : (
                    <div className="form-help">
                      {customerMobile.length === 10 ? (
                        <span style={{ color: '#16a34a', fontWeight: '600' }}>✓ 10 digits entered</span>
                      ) : (
                        <span>Must be exactly 10 digits ({customerMobile.length}/10)</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: SELECT SERVICE WITH 5 QUICK SERVICES & PENCIL CONTROLS */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  2. Select Service
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Quick Services ({quickServices.length}/5 max)
                </div>
              </div>

              {/* Quick Services Alert Error (when 5 limit exceeded) */}
              {quickServiceError && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--warning-bg)',
                    color: 'var(--warning-text)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--warning-border)',
                    marginBottom: '12px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{quickServiceError}</span>
                </div>
              )}

              {/* Quick Services Bar (Up to 5 Chips with pencil icon to remove) */}
              <div style={{ marginBottom: '14px' }}>
                <div className="quick-services-bar">
                  {quickServices.map((svc) => {
                    const isSelected = String(svc.id) === selectedServiceId;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => handleQuickServiceClick(svc)}
                        className={`quick-service-chip ${isSelected ? 'selected' : ''}`}
                        title={`Select ${svc.name} (₹${svc.default_charge})`}
                      >
                        <span>{svc.name}</span>
                        <span style={{ opacity: 0.85, fontSize: '0.78rem' }}>₹{svc.default_charge}</span>
                        {/* Pencil icon on the quick service to remove it */}
                        <span
                          className="chip-pencil"
                          onClick={(e) => handleRemoveFromQuick(e, svc)}
                          title="Click pencil to remove from Quick Services"
                        >
                          <Pencil size={12} />
                        </span>
                      </div>
                    );
                  })}
                  {quickServices.length === 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      No quick services pinned yet. Click ✏️ next to any service below to add it here (up to 5).
                    </span>
                  )}
                </div>
              </div>

              {/* Service Selection Dropdown + Pencil Add Button */}
              <div style={{ display: 'grid', gridTemplateColumns: isCustomService ? '1fr 1fr' : '1fr auto', gap: '10px', alignItems: 'flex-start' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <select
                    ref={serviceRef}
                    className={`form-select ${errors.serviceName ? 'is-invalid' : ''}`}
                    value={selectedServiceId}
                    onChange={(e) => handleSelectService(e.target.value)}
                  >
                    <option value="">-- Choose from Catalogue ({services.length} services) --</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {quickServices.some((q) => q.id === svc.id) ? '★ ' : ''}
                        {svc.name} ({svc.category}) — ₹{svc.default_charge}
                      </option>
                    ))}
                    <option value="OTHER">Other / Custom Service</option>
                  </select>
                  {errors.serviceName && <div className="form-error-text">{errors.serviceName}</div>}
                </div>

                {!isCustomService && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Pencil button: Adds currently selected service to Quick Services */}
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '9px 12px', fontSize: '0.85rem' }}
                      title="Add selected service to Quick Services (✏️)"
                      onClick={handleAddCurrentSelectedToQuick}
                      disabled={!selectedServiceId || selectedServiceId === 'OTHER'}
                    >
                      <Pencil size={15} color="#0f766e" />
                      <span className="desktop-only">Pin ✏️</span>
                    </button>

                    {/* Button to open catalogue with pencil on every service */}
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '9px 12px', fontSize: '0.85rem' }}
                      title="Browse all services and manage Quick Services"
                      onClick={() => setShowCataloguePicker(!showCataloguePicker)}
                    >
                      <span>{showCataloguePicker ? 'Close' : 'Browse All (✏️)'}</span>
                    </button>
                  </div>
                )}

                {isCustomService && (
                  <div className="form-group" style={{ margin: 0 }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type custom service name..."
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Expandable Catalogue Picker with Pencil on EVERY service */}
              {showCataloguePicker && (
                <div
                  style={{
                    marginTop: '12px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>
                      Click ✏️ next to any service to add to Quick Services (Max 5):
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '220px', padding: '6px 10px', fontSize: '0.82rem' }}
                      placeholder="Filter services..."
                      value={catalogueSearch}
                      onChange={(e) => setCatalogueSearch(e.target.value)}
                    />
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', backgroundColor: '#ffffff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                    {filteredCatalogue.map((svc) => {
                      const isQuick = quickServices.some((q) => q.id === svc.id);
                      return (
                        <div
                          key={svc.id}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--border-light)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.85rem',
                          }}
                        >
                          <div
                            onClick={() => {
                              handleSelectService(svc.id);
                              setShowCataloguePicker(false);
                            }}
                            style={{ cursor: 'pointer', flex: 1 }}
                          >
                            <strong>{svc.name}</strong>{' '}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>({svc.category})</span> —{' '}
                            <span style={{ color: '#0f766e', fontWeight: '700' }}>₹{svc.default_charge}</span>
                          </div>

                          {/* Pencil icon toggle on each service */}
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              backgroundColor: isQuick ? '#ecfdf5' : '#ffffff',
                              color: isQuick ? '#065f46' : 'var(--text-main)',
                              borderColor: isQuick ? '#a7f3d0' : 'var(--border-color)',
                            }}
                            title={isQuick ? 'Remove from Quick Services' : 'Add to Quick Services (Max 5)'}
                            onClick={(e) => (isQuick ? handleRemoveFromQuick(e, svc) : handleAddToQuick(svc))}
                          >
                            <Pencil size={12} />
                            <span>{isQuick ? 'Quick ✓' : '+ Quick'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: FINANCIALS & AMOUNT VALIDATION */}
            <div style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
                3. Charges & Payment Breakdown
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {/* Total Charge */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Total Charge (₹) *</label>
                  <input
                    ref={chargeRef}
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalCharge}
                    onChange={(e) => {
                      setTotalCharge(e.target.value);
                      if (errors.totalCharge) setErrors((prev) => ({ ...prev, totalCharge: null }));
                    }}
                    className={`form-input ${errors.totalCharge ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    required
                    style={{ fontSize: '1.1rem', fontWeight: '700' }}
                  />
                  {errors.totalCharge && <div className="form-error-text">{errors.totalCharge}</div>}
                </div>

                {/* Amount Received Now (validated to be <= Total Charge) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Amount Received Now (₹) *</label>
                  <input
                    ref={paidRef}
                    type="number"
                    step="0.01"
                    min="0"
                    max={numCharge > 0 ? numCharge : undefined}
                    value={amountPaid}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAmountPaid(val);
                      if (parseFloat(val) > numCharge) {
                        setErrors((prev) => ({
                          ...prev,
                          amountPaid: `Amount received (₹${val}) cannot be more than total charge (₹${numCharge}).`,
                        }));
                      } else {
                        setErrors((prev) => ({ ...prev, amountPaid: null }));
                      }
                    }}
                    className={`form-input ${errors.amountPaid ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    style={{ fontSize: '1.1rem', fontWeight: '700', color: '#16a34a' }}
                  />
                  {errors.amountPaid ? (
                    <div className="form-error-text">{errors.amountPaid}</div>
                  ) : (
                    <div className="form-help">Cannot exceed total charge (₹{numCharge.toFixed(2)})</div>
                  )}
                </div>

                {/* Automatic Remaining Balance Preview */}
                <div
                  style={{
                    backgroundColor: balancePreview > 0 ? '#fff1f2' : '#ecfdf5',
                    border: `1px solid ${balancePreview > 0 ? '#fecdd3' : '#a7f3d0'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: balancePreview > 0 ? '#9f1239' : '#065f46', textTransform: 'uppercase' }}>
                    Remaining Balance
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: balancePreview > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{balancePreview.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment Mode & Reference */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label className="form-label">Payment Mode</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI (GooglePay / PhonePe / Paytm / BHIM)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="NetBanking">Net Banking</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Reference / UTR (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. UPI Ref / Cheque No"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Optional service notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <input
                  type="checkbox"
                  id="sendSmsDirect"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                  style={{ width: '16px', height: '16px' }}
                />
                <label htmlFor="sendSmsDirect" style={{ fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600' }}>
                  Send SMS receipt confirmation to customer
                </label>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontWeight: '700',
                borderRadius: 'var(--radius-md)',
              }}
              disabled={submitting || successRedirecting}
            >
              {submitting ? 'Saving Transaction...' : successRedirecting ? 'Saved! Redirecting to Dashboard...' : 'Save Record & Issue Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
