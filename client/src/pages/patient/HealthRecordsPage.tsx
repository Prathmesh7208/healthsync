import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  Calendar,
  Tag,
  FileCheck,
  FileSpreadsheet,
  FileImage,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { generatePrescriptionPdf } from '../../services/prescriptionPdf';

export const HealthRecordsPage: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuthStore();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState('PRESCRIPTION');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const categories = [
    { key: 'ALL', label: t('records.all') },
    { key: 'PRESCRIPTION', label: t('records.prescriptions') },
    { key: 'LAB_REPORT', label: t('records.labReports') },
    { key: 'SCAN', label: t('records.scans') },
    { key: 'INSURANCE', label: t('records.insurance') },
  ];

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/patients/me/records', {
        params: { type: activeCategory },
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecords(res.data.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeCategory]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (category) formData.append('category', category);
    if (notes) formData.append('notes', notes);

    try {
      await axios.post('/api/v1/patients/me/records', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadModalOpen(false);
      setFile(null);
      setNotes('');
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await axios.delete(`/api/v1/patients/me/records/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Delete failed');
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'PRESCRIPTION':
        return <FileCheck size={20} color="var(--color-primary-600)" />;
      case 'LAB_REPORT':
        return <FileSpreadsheet size={20} color="var(--color-secondary-600)" />;
      case 'SCAN':
        return <FileImage size={20} color="var(--color-warning-600)" />;
      default:
        return <FileText size={20} color="var(--text-muted)" />;
    }
  };

  return (
    <div className="container" style={{ maxWidth: '720px', padding: '1.5rem 1rem' }}>
      {/* Header & Upload CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
          {t('records.title')}
        </h1>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} />}
          onClick={() => setUploadModalOpen(true)}
        >
          {t('records.uploadRecord')}
        </Button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
        {categories.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setActiveCategory(c.key)}
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              border: `1px solid ${activeCategory === c.key ? 'var(--color-primary-600)' : 'var(--border-subtle)'}`,
              backgroundColor: activeCategory === c.key ? 'var(--color-primary-50)' : 'var(--bg-surface)',
              color: activeCategory === c.key ? 'var(--color-primary-700)' : 'var(--text-secondary)',
              fontWeight: activeCategory === c.key ? 700 : 500,
              fontSize: '0.8125rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Records Timeline */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="hs-skeleton" style={{ height: '100px', width: '100%' }} />
          ))}
        </div>
      ) : records.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <FileText size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>{t('records.noRecords')}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '340px', margin: '0.5rem auto 1.5rem auto' }}>
              {t('records.uploadPrompt')}
            </p>
            <Button variant="primary" size="sm" onClick={() => setUploadModalOpen(true)}>
              Upload First Document
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {records.map((rec) => (
            <Card key={rec.id}>
              <Card.Body style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
                    <div
                      style={{
                        padding: '0.625rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface-subtle)',
                      }}
                    >
                      {getFileIcon(rec.type)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700 }}>{rec.fileName}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        <span>{rec.recordDate?.split('T')[0]}</span>
                        {rec.category && (
                          <>
                            <span>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Tag size={12} />
                              {rec.category}
                            </span>
                          </>
                        )}
                      </div>
                      {rec.notes && (
                        <p style={{ margin: '0.375rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {rec.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {rec.type === 'PRESCRIPTION' ? (
                      <button
                        type="button"
                        onClick={() =>
                          generatePrescriptionPdf({
                            appointmentId: rec.id,
                            date: rec.recordDate?.split('T')[0] || new Date().toLocaleDateString(),
                            doctor: {
                              fullName: rec.category || 'Specialist Doctor',
                            },
                            patient: {
                              fullName: 'Patient Record',
                              phone: '',
                            },
                            diagnosis: rec.notes || 'Routine Medical Follow-up',
                            medications: [],
                            advice: 'Follow prescription regimen strictly as advised.',
                          })
                        }
                        className="hs-btn hs-btn-ghost hs-btn-sm"
                        title="Download Digital Rx PDF"
                        style={{ color: 'var(--color-primary-600)' }}
                      >
                        <Download size={16} />
                      </button>
                    ) : (
                      <a
                        href={rec.fileUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hs-btn hs-btn-ghost hs-btn-sm"
                        title="Download / View"
                        style={{ color: 'var(--color-primary-600)' }}
                      >
                        <Download size={16} />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(rec.id)}
                      className="hs-btn hs-btn-ghost hs-btn-sm"
                      style={{ color: 'var(--color-danger-600)' }}
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Document Modal */}
      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Medical Document">
        <form onSubmit={handleUpload}>
          <div className="hs-input-group">
            <label className="hs-label">Document Type</label>
            <select className="hs-input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="PRESCRIPTION">Doctor Prescription</option>
              <option value="LAB_REPORT">Lab Test Report</option>
              <option value="SCAN">Diagnostic Scan / X-Ray</option>
              <option value="INSURANCE">Insurance Policy / Card</option>
              <option value="OTHER">Other Health Record</option>
            </select>
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Category / Test Name (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Complete Blood Count (CBC)"
              className="hs-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Select File (PDF, JPEG, PNG, max 10MB) *</label>
            <input
              type="file"
              required
              accept="image/*,.pdf"
              className="hs-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="hs-input-group">
            <label className="hs-label">Notes (Optional)</label>
            <textarea
              className="hs-input"
              rows={2}
              placeholder="Add doctor instructions or personal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setUploadModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={uploading} style={{ flex: 1 }}>
              Upload
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HealthRecordsPage;
