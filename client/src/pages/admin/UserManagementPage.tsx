import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export const UserManagementPage: React.FC = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/v1/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: { role: roleFilter || undefined },
      });
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token, roleFilter]);

  const handleToggleUser = async (userId: string) => {
    try {
      await axios.patch(`/api/v1/admin/users/${userId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle user:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            User Governance & Security Directory
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            View, moderate, and manage authentication access for all user roles.
          </p>
        </div>

        {/* Role Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: '#1C2541', padding: '4px', borderRadius: '8px' }}>
          {['', 'PATIENT', 'DOCTOR', 'RECEPTIONIST', 'AMBULANCE_OPERATOR'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: roleFilter === r ? '#1A56DB' : 'transparent',
                color: roleFilter === r ? '#FFFFFF' : '#94A3B8',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {r === '' ? 'All Users' : r.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: '#1C2541', borderRadius: '12px', border: '1px solid #3A506B', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B132B', borderBottom: '1px solid #3A506B', color: '#94A3B8' }}>
                <th style={{ padding: '0.875rem 1rem' }}>User / Phone</th>
                <th style={{ padding: '0.875rem 1rem' }}>Role</th>
                <th style={{ padding: '0.875rem 1rem' }}>Profile Name</th>
                <th style={{ padding: '0.875rem 1rem' }}>Created</th>
                <th style={{ padding: '0.875rem 1rem' }}>Account Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(58, 80, 107, 0.4)' }}>
                    <td style={{ padding: '0.875rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>{u.phone}</td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#60A5FA', padding: '2px 8px', borderRadius: '4px', fontSize: '0.6875rem', fontWeight: 700 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#CBD5E1' }}>
                      {u.patient?.fullName || u.doctor?.fullName || '—'}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', color: '#94A3B8', fontSize: '0.75rem' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: u.isActive ? '#4ADE80' : '#F87171' }}>
                        {u.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        <span>{u.isActive ? 'Active' : 'Suspended'}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                      {u.role !== 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleToggleUser(u.id)}
                          style={{
                            padding: '0.375rem 0.625rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: u.isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: u.isActive ? '#F87171' : '#4ADE80',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {u.isActive ? 'Suspend' : 'Unban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
