import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import {
  Stethoscope,
  PlusCircle,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  CheckCircle,
  XCircle,
  Power,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';

export const DoctorManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { token } = useAuthStore();

  const [doctors, setDoctors] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Manual Add Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    registrationNumber: '',
    specializations: 'General Medicine',
    experienceYears: 5,
    consultationFee: 500,
    languages: 'English, Hindi',
    bio: '',
    hospitalId: '',
  });
  const [submittingDoctor, setSubmittingDoctor] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get('/api/v1/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: search || undefined },
      });
      setDoctors(res.data.data);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await axios.get('/api/v1/admin/hospitals', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHospitals(res.data.data);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDoctors();
      fetchHospitals();
    }
    if (searchParams.get('action') === 'add') setShowAddModal(true);
    if (searchParams.get('action') === 'upload') setShowUploadModal(true);
  }, [token, searchParams]);

  const handleToggleStatus = async (doctorId: string) => {
    try {
      await axios.patch(`/api/v1/admin/doctors/${doctorId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDoctors();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // 1. Download Sample Excel Template
  const handleDownloadSampleTemplate = () => {
    const sampleData = [
      {
        'Full Name': 'Dr. Rohan Deshmukh',
        'Phone (10 digits)': '9822100001',
        'Registration Number': 'MCI-2015-44912',
        'Specializations (comma separated)': 'Cardiology, Interventional Cardiology',
        'Experience (Years)': 14,
        'Consultation Fee (INR)': 800,
        'Languages (comma separated)': 'English, Hindi, Marathi',
        'Bio': 'Senior Cardiologist specializing in echocardiography and preventive care.',
        'Hospital Name (Optional)': hospitals[0]?.name || 'Ruby Hall Clinic',
      },
      {
        'Full Name': 'Dr. Ananya Sharma',
        'Phone (10 digits)': '9822100002',
        'Registration Number': 'MCI-2018-88219',
        'Specializations (comma separated)': 'Pediatrics, Neonatology',
        'Experience (Years)': 9,
        'Consultation Fee (INR)': 600,
        'Languages (comma separated)': 'English, Hindi',
        'Bio': 'Pediatrician dedicated to child health, immunizations, and wellness.',
        'Hospital Name (Optional)': hospitals[1]?.name || 'Sahyadri Super Speciality Hospital',
      },
      {
        'Full Name': 'Dr. Sameer Kulkarni',
        'Phone (10 digits)': '9822100003',
        'Registration Number': 'MCI-2012-10934',
        'Specializations (comma separated)': 'Orthopedics, Sports Medicine',
        'Experience (Years)': 16,
        'Consultation Fee (INR)': 900,
        'Languages (comma separated)': 'English, Marathi',
        'Bio': 'Orthopedic surgeon focusing on joint replacements and sports trauma.',
        'Hospital Name (Optional)': hospitals[2]?.name || 'Jupiter Hospital',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 24 },
      { wch: 18 },
      { wch: 22 },
      { wch: 38 },
      { wch: 18 },
      { wch: 22 },
      { wch: 28 },
      { wch: 45 },
      { wch: 32 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors_Template');
    XLSX.writeFile(wb, 'HealthSync_Doctor_Import_Template.xlsx');
  };

  // 2. Export Current Doctors
  const handleExportDoctors = () => {
    const rows = doctors.map((doc) => ({
      'Doctor Name': doc.fullName,
      'Phone': doc.user?.phone,
      'Registration Number': doc.registrationNumber,
      'Specializations': Array.isArray(doc.specializations) ? doc.specializations.join(', ') : doc.specializations,
      'Experience': doc.experienceYears,
      'Hospital': doc.affiliations?.map((a: any) => a.hospital.name).join(', ') || 'Independent',
      'Status': doc.user?.isActive ? 'Active' : 'Inactive',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doctors');
    XLSX.writeFile(wb, 'HealthSync_Doctors_Registry.xlsx');
  };

  // 3. Handle File Selection for Bulk Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);
        setPreviewRows(data.slice(0, 5)); // preview top 5 rows
      } catch (err) {
        console.error('Failed to parse Excel preview:', err);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 4. Submit Bulk Upload to Backend
  const handleBulkUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadResult(null);

    const data = new FormData();
    data.append('file', selectedFile);

    try {
      const res = await axios.post('/api/v1/admin/doctors/bulk-upload', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResult(res.data.data);
      fetchDoctors();
    } catch (err: any) {
      setUploadResult({
        total: 0,
        successCount: 0,
        failedCount: 1,
        errors: [{ row: 0, error: err.response?.data?.message || 'Upload failed' }],
      });
    } finally {
      setUploading(false);
    }
  };

  // 5. Submit Manual Doctor Creation Form
  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDoctor(true);
    setFormError(null);

    try {
      await axios.post(
        '/api/v1/admin/doctors',
        {
          ...formData,
          specializations: formData.specializations.split(',').map((s) => s.trim()),
          languages: formData.languages.split(',').map((l) => l.trim()),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowAddModal(false);
      setFormData({
        fullName: '',
        phone: '',
        password: '',
        registrationNumber: '',
        specializations: 'General Medicine',
        experienceYears: 5,
        consultationFee: 500,
        languages: 'English, Hindi',
        bio: '',
        hospitalId: '',
      });
      fetchDoctors();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to add doctor');
    } finally {
      setSubmittingDoctor(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Action Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
            Doctor Registry & Management
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Add, verify, import Excel spreadsheets, and manage medical practitioners.
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          {/* Download Sample Template */}
          <button
            type="button"
            onClick={handleDownloadSampleTemplate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              border: '1px solid #38BDF8',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
            title="Download formatted sample template (.xlsx)"
          >
            <Download size={15} />
            <span>Download Sample Template</span>
          </button>

          {/* Bulk Upload Button */}
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#0D9488',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
            }}
          >
            <FileSpreadsheet size={15} />
            <span>Bulk Upload Excel</span>
          </button>

          {/* Add Doctor Manually Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1rem',
              backgroundColor: '#1A56DB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(26, 86, 219, 0.3)',
            }}
          >
            <PlusCircle size={15} />
            <span>Add Doctor</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportDoctors}
            disabled={doctors.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 0.875rem',
              backgroundColor: '#334155',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          placeholder="Search by doctor name, phone, or reg number..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            fetchDoctors();
          }}
          style={{
            width: '100%',
            padding: '0.625rem 1rem 0.625rem 2.5rem',
            backgroundColor: '#1C2541',
            border: '1px solid #3A506B',
            borderRadius: '8px',
            color: '#FFFFFF',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Doctors Table */}
      <div
        style={{
          backgroundColor: '#1C2541',
          borderRadius: '12px',
          border: '1px solid #3A506B',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#0B132B', borderBottom: '1px solid #3A506B', color: '#94A3B8' }}>
                <th style={{ padding: '0.875rem 1rem' }}>Doctor</th>
                <th style={{ padding: '0.875rem 1rem' }}>Specialization</th>
                <th style={{ padding: '0.875rem 1rem' }}>Reg. Number</th>
                <th style={{ padding: '0.875rem 1rem' }}>Affiliated Hospital</th>
                <th style={{ padding: '0.875rem 1rem' }}>Experience</th>
                <th style={{ padding: '0.875rem 1rem' }}>Status</th>
                <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                    Loading doctors...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                    <Stethoscope size={36} color="#64748B" style={{ margin: '0 auto 0.75rem auto' }} />
                    <div>No doctors registered yet.</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      Click <b>"Bulk Upload Excel"</b> to import hundreds of doctors in seconds!
                    </div>
                  </td>
                </tr>
              ) : (
                doctors.map((doc) => {
                  const isActive = doc.user?.isActive;
                  return (
                    <tr
                      key={doc.id}
                      style={{
                        borderBottom: '1px solid rgba(58, 80, 107, 0.4)',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <div style={{ fontWeight: 700, color: '#FFFFFF' }}>{doc.fullName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{doc.user?.phone}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                            color: '#60A5FA',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {Array.isArray(doc.specializations) ? doc.specializations[0] : doc.specializations}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#CBD5E1', fontFamily: 'monospace' }}>
                        {doc.registrationNumber}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#CBD5E1' }}>
                        {doc.affiliations?.length > 0 ? (
                          doc.affiliations.map((a: any) => a.hospital?.name).join(', ')
                        ) : (
                          <span style={{ color: '#64748B' }}>Independent</span>
                        )}
                      </td>
                      <td style={{ padding: '0.875rem 1rem', color: '#CBD5E1' }}>
                        {doc.experienceYears} Years
                      </td>
                      <td style={{ padding: '0.875rem 1rem' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isActive ? '#4ADE80' : '#F87171',
                          }}
                        >
                          {isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span>{isActive ? 'Active' : 'Deactivated'}</span>
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(doc.id)}
                          style={{
                            padding: '0.375rem 0.625rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                            color: isActive ? '#F87171' : '#4ADE80',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title={isActive ? 'Deactivate Doctor' : 'Activate Doctor'}
                        >
                          <Power size={13} style={{ marginRight: '4px' }} />
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: BULK EXCEL UPLOADER & PREVIEW */}
      {/* ========================================================================= */}
      {showUploadModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#1C2541',
              borderRadius: '16px',
              border: '1px solid #3A506B',
              width: '100%',
              maxWidth: '650px',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileSpreadsheet size={22} color="#0D9488" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Bulk Import Doctors via Excel
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setPreviewRows([]);
                  setUploadResult(null);
                }}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Download Prompt */}
            <div
              style={{
                backgroundColor: '#0B132B',
                border: '1px solid #3A506B',
                borderRadius: '8px',
                padding: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#38BDF8" />
                <span style={{ fontSize: '0.8125rem', color: '#CBD5E1' }}>
                  Need the Excel format? Download our pre-filled template.
                </span>
              </div>
              <button
                type="button"
                onClick={handleDownloadSampleTemplate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#1E293B',
                  border: '1px solid #38BDF8',
                  color: '#38BDF8',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Download size={13} />
                <span>Template</span>
              </button>
            </div>

            {/* Dropzone File Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #3A506B',
                borderRadius: '12px',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                backgroundColor: 'rgba(11, 19, 43, 0.6)',
                cursor: 'pointer',
                marginBottom: '1.25rem',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <Upload size={32} color="#60A5FA" style={{ margin: '0 auto 0.75rem auto' }} />
              <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#FFFFFF' }}>
                {selectedFile ? selectedFile.name : 'Click or Drag & Drop Excel File here'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                Supports .xlsx, .xls, and .csv (Max 10MB)
              </div>
            </div>

            {/* Live Parsing Preview */}
            {previewRows.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94A3B8', marginBottom: '0.5rem' }}>
                  Preview (First {previewRows.length} Doctors detected):
                </div>
                <div
                  style={{
                    backgroundColor: '#0B132B',
                    borderRadius: '8px',
                    border: '1px solid #3A506B',
                    overflowX: 'auto',
                    maxHeight: '180px',
                  }}
                >
                  <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #3A506B', color: '#60A5FA' }}>
                        <th style={{ padding: '6px 10px' }}>Name</th>
                        <th style={{ padding: '6px 10px' }}>Phone</th>
                        <th style={{ padding: '6px 10px' }}>Reg No</th>
                        <th style={{ padding: '6px 10px' }}>Specialty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(58, 80, 107, 0.4)' }}>
                          <td style={{ padding: '6px 10px', color: '#FFFFFF' }}>{r['Full Name'] || r['fullName']}</td>
                          <td style={{ padding: '6px 10px', color: '#CBD5E1' }}>{r['Phone (10 digits)'] || r['phone']}</td>
                          <td style={{ padding: '6px 10px', color: '#CBD5E1' }}>{r['Registration Number'] || r['registrationNumber']}</td>
                          <td style={{ padding: '6px 10px', color: '#CBD5E1' }}>{r['Specializations (comma separated)'] || r['specializations']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Results Alert */}
            {uploadResult && (
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1.25rem',
                  backgroundColor: uploadResult.successCount > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: `1px solid ${uploadResult.successCount > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                }}
              >
                <div style={{ fontWeight: 700, color: uploadResult.successCount > 0 ? '#4ADE80' : '#F87171', fontSize: '0.875rem' }}>
                  {uploadResult.successCount > 0
                    ? `🎉 Success: ${uploadResult.successCount} doctors created/updated!`
                    : 'Import encountered errors:'}
                </div>
                {uploadResult.failedCount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#FCA5A5', marginTop: '0.375rem' }}>
                    {uploadResult.failedCount} rows failed. Errors:
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {uploadResult.errors?.map((err: any, idx: number) => (
                        <li key={idx}>
                          Row {err.row}: {err.doctorName} — {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Submit Import Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                style={{
                  padding: '0.625rem 1.25rem',
                  backgroundColor: 'transparent',
                  border: '1px solid #3A506B',
                  color: '#94A3B8',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkUploadSubmit}
                disabled={!selectedFile || uploading}
                style={{
                  padding: '0.625rem 1.5rem',
                  backgroundColor: '#0D9488',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  opacity: !selectedFile || uploading ? 0.6 : 1,
                }}
              >
                {uploading ? 'Parsing & Importing...' : 'Import Doctors to Database'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL ADD DOCTOR FORM */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#1C2541',
              borderRadius: '16px',
              border: '1px solid #3A506B',
              width: '100%',
              maxWidth: '580px',
              padding: '1.75rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={22} color="#1A56DB" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Add Doctor Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#F87171',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddDoctorSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Doctor Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="9822000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#0B132B',
                      border: '1px solid #3A506B',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                    Login Password
                  </label>
                  <input
                    type="password"
                    placeholder="Default: HealthSync@123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#0B132B',
                      border: '1px solid #3A506B',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                    Medical Reg. Number *
                  </label>
                  <input
                    type="text"
                    placeholder="MCI-2018-9901"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#0B132B',
                      border: '1px solid #3A506B',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#0B132B',
                      border: '1px solid #3A506B',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                    Specializations (comma-sep)
                  </label>
                  <input
                    type="text"
                    placeholder="Cardiology, General Physician"
                    value={formData.specializations}
                    onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#0B132B',
                      border: '1px solid #3A506B',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                    Consultation Fee (INR)
                  </label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      backgroundColor: '#0B132B',
                      border: '1px solid #3A506B',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                  Affiliated Hospital
                </label>
                <select
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    backgroundColor: '#0B132B',
                    border: '1px solid #3A506B',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                  }}
                >
                  <option value="">-- Independent Practice / None --</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.city})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '0.625rem 1.25rem',
                    backgroundColor: 'transparent',
                    border: '1px solid #3A506B',
                    color: '#94A3B8',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDoctor}
                  style={{
                    padding: '0.625rem 1.5rem',
                    backgroundColor: '#1A56DB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: submittingDoctor ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingDoctor ? 'Creating Doctor...' : 'Save & Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagementPage;
