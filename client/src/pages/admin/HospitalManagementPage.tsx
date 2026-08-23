import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Building2, PlusCircle, Phone, MapPin, X, AlertCircle } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export const HospitalManagementPage: React.FC = () => {
  const { token } = useAuthStore();
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001',
    phone: '',
    hasEmergency: true,
    departments: 'Cardiology, Neurology, General Medicine',
    facilities: '24x7 ER, ICU, Pharmacy, Ambulance Hub',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHospitals = async () => {
    try {
      const res = await axios.get('/api/v1/admin/hospitals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHospitals(res.data.data);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchHospitals();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.post(
        '/api/v1/admin/hospitals',
        {
          ...formData,
          departments: formData.departments.split(',').map((d) => d.trim()),
          facilities: formData.facilities.split(',').map((f) => f.trim()),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setFormData({
        name: '',
        address: '',
        city: 'Pune',
        state: 'Maharashtra',
        pinCode: '411001',
        phone: '',
        hasEmergency: true,
        departments: 'Cardiology, Neurology, General Medicine',
        facilities: '24x7 ER, ICU, Pharmacy, Ambulance Hub',
      });
      fetchHospitals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create hospital');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Hospital Facilities & Network
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Manage affiliated medical institutions, trauma centers, and facilities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1.125rem',
            backgroundColor: '#1A56DB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(26, 86, 219, 0.25)',
          }}
        >
          <PlusCircle size={16} />
          <span>Add Hospital</span>
        </button>
      </div>

      {/* Hospital Cards Grid - Light Mode */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ color: '#64748B', padding: '2rem' }}>Loading hospital facilities...</div>
        ) : hospitals.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '3rem', textAlign: 'center', color: '#64748B', gridColumn: '1 / -1' }}>
            <Building2 size={40} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 700, color: '#0F172A' }}>No hospitals added yet.</div>
          </div>
        ) : (
          hospitals.map((h) => (
            <div
              key={h.id}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0F172A' }}>{h.name}</h3>
                  {h.hasEmergency && (
                    <span style={{ backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800, padding: '2px 8px' }}>
                      24x7 ER
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8125rem', marginBottom: '0.375rem' }}>
                  <MapPin size={14} color="#1A56DB" />
                  <span>{h.address}, {h.city}, {h.state} - {h.pinCode}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                  <Phone size={14} color="#16A34A" />
                  <span>{h.phone}</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
                  {Array.isArray(h.departments) && h.departments.slice(0, 4).map((d: string, i: number) => (
                    <span key={i} style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '2px 6px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 600 }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Doctors: <b style={{ color: '#0F172A' }}>{h._count?.affiliations || 0}</b></span>
                <span>Appointments: <b style={{ color: '#0F172A' }}>{h._count?.appointments || 0}</b></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Hospital Modal - Light Mode */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', width: '100%', maxWidth: '540px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Add New Hospital</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FEE2E2', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} /><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Hospital Name *</label>
                <input type="text" placeholder="e.g. Apollo Hospital" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required style={{ width: '100%', padding: '0.625rem 0.875rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', outline: 'none' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Address *</label>
                <input type="text" placeholder="Street, Area" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required style={{ width: '100%', padding: '0.625rem 0.875rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', outline: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>City *</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required style={{ width: '100%', padding: '0.625rem 0.875rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Phone Number *</label>
                  <input type="tel" placeholder="+912066000000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required style={{ width: '100%', padding: '0.625rem 0.875rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', outline: 'none' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Departments (comma-sep)</label>
                <input type="text" value={formData.departments} onChange={(e) => setFormData({ ...formData, departments: e.target.value })} style={{ width: '100%', padding: '0.625rem 0.875rem', backgroundColor: '#FFFFFF', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#0F172A', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.625rem 1.25rem', backgroundColor: 'transparent', border: '1px solid #CBD5E1', color: '#64748B', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '0.625rem 1.5rem', backgroundColor: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>{submitting ? 'Creating...' : 'Save Hospital'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagementPage;
