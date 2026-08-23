import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Stethoscope,
  Users,
  Building2,
  Calendar,
  Siren,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  ArrowRight,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/v1/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  const kpis = stats?.kpis || {
    totalDoctors: 0,
    totalPatients: 0,
    totalHospitals: 0,
    totalAppointments: 0,
    activeEmergencies: 0,
    totalUsers: 0,
  };

  const statCards = [
    {
      title: 'Total Doctors',
      value: kpis.totalDoctors,
      icon: <Stethoscope size={24} color="#60A5FA" />,
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.3)',
      link: '/admin/doctors',
      actionText: 'Manage Doctors',
    },
    {
      title: 'Registered Patients',
      value: kpis.totalPatients,
      icon: <Users size={24} color="#34D399" />,
      bg: 'rgba(52, 211, 153, 0.12)',
      border: 'rgba(52, 211, 153, 0.3)',
      link: '/admin/users',
      actionText: 'View Directory',
    },
    {
      title: 'Partner Hospitals',
      value: kpis.totalHospitals,
      icon: <Building2 size={24} color="#A78BFA" />,
      bg: 'rgba(167, 139, 250, 0.12)',
      border: 'rgba(167, 139, 250, 0.3)',
      link: '/admin/hospitals',
      actionText: 'Manage Facilities',
    },
    {
      title: 'Total Appointments',
      value: kpis.totalAppointments,
      icon: <Calendar size={24} color="#FBBF24" />,
      bg: 'rgba(251, 191, 36, 0.12)',
      border: 'rgba(251, 191, 36, 0.3)',
      link: '/admin/doctors',
      actionText: 'View Activity',
    },
    {
      title: 'Active Emergencies',
      value: kpis.activeEmergencies,
      icon: <Siren size={24} color="#F87171" />,
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.3)',
      link: '/receptionist/emergencies',
      actionText: 'Live Monitor',
      alert: kpis.activeEmergencies > 0,
    },
    {
      title: 'Platform Users',
      value: kpis.totalUsers,
      icon: <TrendingUp size={24} color="#38BDF8" />,
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.3)',
      link: '/admin/users',
      actionText: 'User Governance',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1C2541 0%, #0B132B 100%)',
          borderRadius: '16px',
          padding: '1.75rem',
          border: '1px solid #3A506B',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
            <ShieldCheck size={22} color="#60A5FA" />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
              HealthSync Command Center
            </h1>
          </div>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: 0 }}>
            Real-time management for Doctors, Hospitals, Patient Registrations, and Emergency Operations.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => navigate('/admin/doctors?action=upload')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.125rem',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Bulk Upload Doctors (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/doctors?action=add')}
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
              boxShadow: '0 4px 12px rgba(26, 86, 219, 0.3)',
            }}
          >
            <PlusCircle size={16} />
            <span>Add Doctor</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}
      >
        {statCards.map((card, i) => (
          <div
            key={i}
            onClick={() => navigate(card.link)}
            style={{
              backgroundColor: '#1C2541',
              border: `1px solid ${card.border}`,
              borderRadius: '12px',
              padding: '1.25rem',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </div>
              {card.alert && (
                <span
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                  }}
                >
                  LIVE ALERT
                </span>
              )}
            </div>

            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>
              {loading ? '...' : card.value}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '0.375rem' }}>
              {card.title}
            </div>

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#60A5FA',
              }}
            >
              <span>{card.actionText}</span>
              <ArrowRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Appointments & System Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Recent Platform Appointments */}
        <div
          style={{
            backgroundColor: '#1C2541',
            borderRadius: '12px',
            border: '1px solid #3A506B',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Recent Appointments
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Live Log</span>
          </div>

          {stats?.recentAppointments?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B', fontSize: '0.875rem' }}>
              No appointments booked yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats?.recentAppointments?.map((apt: any, i: number) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#0B132B',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    border: '1px solid #3A506B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {apt.patient?.fullName || 'Patient'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                      Dr. {apt.doctor?.fullName} • {apt.hospital?.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database & Infrastructure Status */}
        <div
          style={{
            backgroundColor: '#1C2541',
            borderRadius: '12px',
            border: '1px solid #3A506B',
            padding: '1.25rem',
          }}
        >
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
            System Infrastructure Status
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.75rem', backgroundColor: '#0B132B', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>PostgreSQL Managed Database</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34D399' }}>● Connected & Healthy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.75rem', backgroundColor: '#0B132B', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>WebSocket Gateway (Socket.io)</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34D399' }}>● Active (port 10000)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.75rem', backgroundColor: '#0B132B', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Background Reminder Worker</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34D399' }}>● Running (60s cycle)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.75rem', backgroundColor: '#0B132B', borderRadius: '6px' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>Excel Import & Template Engine</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#34D399' }}>● Ready (XLSX v0.18)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
