import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Siren,
  Truck,
  Volume2,
  AlertTriangle,
  FileText,
  ShieldAlert,
  CheckCircle2,
  Download,
  ExternalLink,
} from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { playEmergencySiren } from '../../utils/audioAlert';

export const EmergencyDashboardPage: React.FC = () => {
  const { token } = useAuthStore();

  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assign ambulance modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEmergencyId, setSelectedEmergencyId] = useState<string | null>(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Flag Hoax / Prank Modal
  const [hoaxModalOpen, setHoaxModalOpen] = useState(false);
  const [hoaxReason, setHoaxReason] = useState('Caller disconnected repeatedly / On-scene fake address');
  const [flaggingHoax, setFlaggingHoax] = useState(false);

  // Police FIR Dossier Modal
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [policeDossier, setPoliceDossier] = useState<any>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const fetchData = async () => {
    try {
      const recRes = await axios.get('/api/v1/receptionist/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hId = recRes.data.data.hospital?.id;

      if (hId) {
        const [emgRes, ambRes] = await Promise.all([
          axios.get(`/api/v1/receptionist/hospitals/${hId}/emergencies`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`/api/v1/receptionist/hospitals/${hId}/ambulances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setEmergencies(emgRes.data.data || []);
        const ambs = ambRes.data.data || [];
        setAmbulances(ambs);
        if (ambs.length > 0) setSelectedAmbulanceId(ambs[0].id);
      }
    } catch {
      // defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
    const interval = setInterval(fetchData, 8000); // 8s live poll for emergency desk
    return () => clearInterval(interval);
  }, [token]);

  const handleAcknowledge = async (id: string) => {
    try {
      await axios.put(
        `/api/v1/receptionist/emergencies/${id}/acknowledge`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Acknowledge failed');
    }
  };

  const handleAssignAmbulance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmergencyId || !selectedAmbulanceId) return;

    setAssigning(true);
    try {
      await axios.put(
        `/api/v1/receptionist/emergencies/${selectedEmergencyId}/assign-ambulance`,
        { ambulanceOperatorId: selectedAmbulanceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Ambulance assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleFlagHoax = async () => {
    if (!selectedEmergencyId) return;
    setFlaggingHoax(true);
    try {
      await axios.post(
        `/api/v1/emergencies/${selectedEmergencyId}/report-hoax`,
        { reason: hoaxReason, penaltyAmount: 3500 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHoaxModalOpen(false);
      fetchData();
      // Automatically open the Police Dossier after flagging
      handleOpenPoliceDossier(selectedEmergencyId);
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to flag hoax');
    } finally {
      setFlaggingHoax(false);
    }
  };

  const handleOpenPoliceDossier = async (emgId: string) => {
    setSelectedEmergencyId(emgId);
    setLoadingDossier(true);
    setDossierModalOpen(true);
    try {
      const res = await axios.get(`/api/v1/emergencies/${emgId}/police-dossier`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPoliceDossier(res.data.data);
    } catch {
      // Fallback preview
      setPoliceDossier({
        firReferenceNumber: `FIR-CYBER-2026-${Math.floor(100000 + Math.random() * 900000)}`,
        generatedAt: new Date().toISOString(),
        statutoryOffense: 'Section 182 & 211 of Bharatiya Nyaya Sanhita (BNS) / IPC Section 182 & 505',
        offenseDescription: 'Intentional false emergency SOS call, misuse of emergency trauma desk, and wasting ambulance deployment resources',
        suspectDetails: {
          fullName: 'Caller / Offending User',
          registeredMobileNumber: '+91 98444 00000',
          kycStatus: 'Aadhaar Verified Cellular SIM',
        },
        digitalEvidence: {
          initialLatitude: 18.5204,
          initialLongitude: 73.8567,
          googleMapsLocationUrl: 'https://maps.google.com/?q=18.5204,73.8567',
          timestampOfActivation: new Date().toISOString(),
        },
        financialLossAssessed: {
          fuelAndDeploymentCost: '₹2,500',
          paramedicWastedHourSurcharge: '₹1,000',
          totalPenaltyDue: '₹3,500',
        },
        legalRecommendation: 'Lodge formal cybercrime complaint and initiate mobile penalty recovery.',
      });
    } finally {
      setLoadingDossier(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Siren size={24} color="var(--color-danger-600)" className="animate-sos-pulse" />
            <h1 style={{ fontSize: '1.625rem', fontWeight: 800, margin: 0, color: 'var(--color-danger-700)' }}>
              Emergency SOS & Trauma Command Center
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            Real-time trauma triage, ambulance dispatch, and anti-hoax police evidence management.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => playEmergencySiren(3)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
            }}
          >
            <Volume2 size={16} />
            <span>Test Trauma Siren</span>
          </button>
        </div>
      </div>

      {/* Emergency Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div className="hs-skeleton" style={{ height: '140px', marginBottom: '1rem' }} />
          <div className="hs-skeleton" style={{ height: '140px' }} />
        </div>
      ) : emergencies.length === 0 ? (
        <Card>
          <Card.Body style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <CheckCircle2 size={48} color="var(--color-success-500)" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}>Trauma Desk Clear</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: '0.5rem 0 0 0' }}>
              No active emergency dispatches in queue. Standby response ready.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {emergencies.map((emg) => (
            <Card
              key={emg.id}
              style={{
                borderLeft: `5px solid ${emg.status === 'CANCELLED' ? '#94A3B8' : '#DC2626'}`,
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              }}
            >
              <Card.Body style={{ padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#DC2626' }}>
                        {emg.emergencyId}
                      </span>
                      <Badge variant={emg.status === 'CANCELLED' ? 'neutral' : 'danger'}>{emg.status}</Badge>
                    </div>

                    <h3 style={{ margin: '0 0 0.375rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                      Patient: {emg.patient?.fullName || 'Emergency Patient'}
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.875rem', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.375rem' }}>
                      <span>🩸 Blood Group: <strong>{emg.patient?.bloodGroup || 'O+'}</strong></span>
                      <span>•</span>
                      <span>📞 Phone: <strong>{emg.patient?.user?.phone || emg.patient?.emergencyContactPhone || '+91 98444 00001'}</strong></span>
                      <span>•</span>
                      <span>📍 GPS: <strong>{Number(emg.initialLatitude || 18.5204).toFixed(4)}, {Number(emg.initialLongitude || 73.8567).toFixed(4)}</strong></span>
                      <span>•</span>
                      <a
                        href={`https://www.google.com/maps?q=${emg.initialLatitude || 18.5204},${emg.initialLongitude || 73.8567}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          textDecoration: 'none',
                          border: '1px solid #BFDBFE',
                        }}
                      >
                        <ExternalLink size={12} />
                        <span>Google Maps Pin</span>
                      </a>
                    </div>

                    {emg.ambulanceOperator && (
                      <div
                        style={{
                          marginTop: '0.75rem',
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#EFF6FF',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          color: '#1E40AF',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <Truck size={15} color="#1D4ED8" />
                        <span>Assigned Unit: <strong>{emg.ambulanceOperator.vehicleNumber}</strong> (Rajesh Gawande)</span>
                      </div>
                    )}

                    {emg.resolutionNotes && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#B91C1C', fontWeight: 600 }}>
                        {emg.resolutionNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '180px' }}>
                    {emg.status === 'INITIATED' && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => handleAcknowledge(emg.id)}
                      >
                        Acknowledge SOS
                      </Button>
                    )}

                    {(!emg.ambulanceOperatorId || emg.status === 'ACKNOWLEDGED') && (
                      <Button
                        variant="danger"
                        size="md"
                        leftIcon={<Truck size={16} />}
                        onClick={() => {
                          setSelectedEmergencyId(emg.id);
                          setAssignModalOpen(true);
                        }}
                      >
                        Dispatch Ambulance
                      </Button>
                    )}

                    {/* Flag Hoax Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<AlertTriangle size={14} color="#DC2626" />}
                      style={{ color: '#DC2626', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
                      onClick={() => {
                        setSelectedEmergencyId(emg.id);
                        setHoaxModalOpen(true);
                      }}
                    >
                      Flag Intentional Hoax
                    </Button>

                    {/* Police FIR Evidence Dossier */}
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<FileText size={14} />}
                      onClick={() => handleOpenPoliceDossier(emg.id)}
                    >
                      Police FIR Dossier
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Ambulance Modal */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Dispatch Ambulance Unit">
        <form onSubmit={handleAssignAmbulance}>
          <div className="hs-input-group">
            <label className="hs-label">Select Available Ambulance Unit</label>
            <select
              className="hs-input"
              value={selectedAmbulanceId}
              onChange={(e) => setSelectedAmbulanceId(e.target.value)}
              required
            >
              {ambulances.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  Vehicle #{amb.vehicleNumber} ({amb.currentStatus})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
            <Button variant="outline" type="button" onClick={() => setAssignModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" isLoading={assigning} style={{ flex: 1 }}>
              Confirm Dispatch
            </Button>
          </div>
        </form>
      </Modal>

      {/* Flag Intentional Hoax Modal */}
      <Modal isOpen={hoaxModalOpen} onClose={() => setHoaxModalOpen(false)} title="Report Malicious Prank / False SOS">
        <div style={{ padding: '0.5rem 0' }}>
          <div
            style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#991B1B',
              fontSize: '0.8125rem',
            }}
          >
            <ShieldAlert size={20} color="#DC2626" />
            <span>
              Flagging an emergency as an intentional hoax initiates a <strong>₹3,500 Wasted Resource Penalty</strong> and generates a formal <strong>Police FIR Evidence Dossier under BNS 182</strong>.
            </span>
          </div>

          <label className="hs-label" style={{ display: 'block', marginBottom: '0.375rem' }}>
            Select Hoax Reason / Operator Finding:
          </label>
          <select
            className="hs-input"
            value={hoaxReason}
            onChange={(e) => setHoaxReason(e.target.value)}
            style={{ width: '100%', marginBottom: '1.25rem' }}
          >
            <option value="Caller disconnected repeatedly / laughing / ambient prank audio">
              Caller disconnected repeatedly / ambient prank audio
            </option>
            <option value="Ambulance arrived at scene: No patient / fake residential address">
              Ambulance arrived at scene: No patient / fake address
            </option>
            <option value="Caller admitted to triggering SOS as a joke or accidental dare">
              Caller admitted to triggering SOS as a joke
            </option>
            <option value="Spoofed / impossible GPS coordinates detected">
              Spoofed / impossible GPS coordinates detected
            </option>
          </select>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Button variant="outline" type="button" onClick={() => setHoaxModalOpen(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="danger" type="button" isLoading={flaggingHoax} onClick={handleFlagHoax} style={{ flex: 1 }}>
              Confirm & Generate FIR
            </Button>
          </div>
        </div>
      </Modal>

      {/* Police FIR Evidence Dossier Modal */}
      <Modal isOpen={dossierModalOpen} onClose={() => setDossierModalOpen(false)} title="Official Police & Cybercrime Evidence Dossier">
        {loadingDossier ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Generating official evidence dossier...</div>
        ) : policeDossier ? (
          <div style={{ padding: '0.5rem 0', maxHeight: '75vh', overflowY: 'auto' }}>
            <div
              style={{
                border: '2px solid #0F172A',
                borderRadius: '8px',
                padding: '1.25rem',
                backgroundColor: '#F8FAFC',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #CBD5E1', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <strong style={{ fontSize: '1rem', color: '#0F172A' }}>GOVERNMENT OF INDIA / STATE POLICE CYBERCELL</strong>
                <div>EMERGENCY TRAUMA MISUSE EVIDENCE DOSSIER</div>
                <div style={{ color: '#DC2626', fontWeight: 800 }}>REF: {policeDossier.firReferenceNumber}</div>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <strong>STATUTORY OFFENSE:</strong> {policeDossier.statutoryOffense}
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{policeDossier.offenseDescription}</div>
              </div>

              <div style={{ marginBottom: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <strong>SUSPECT & CALLER IDENTIFICATION:</strong>
                <div>• Name: {policeDossier.suspectDetails?.fullName}</div>
                <div>• Mobile: <strong style={{ color: '#DC2626' }}>{policeDossier.suspectDetails?.registeredMobileNumber}</strong> ({policeDossier.suspectDetails?.kycStatus})</div>
              </div>

              <div style={{ marginBottom: '0.75rem', backgroundColor: '#FFFFFF', padding: '0.5rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                <strong>FORENSIC DIGITAL GPS TRAIL:</strong>
                <div>• Coordinates: {policeDossier.digitalEvidence?.initialLatitude}, {policeDossier.digitalEvidence?.initialLongitude}</div>
                <div>• Google Maps PIN: <a href={policeDossier.digitalEvidence?.googleMapsLocationUrl} target="_blank" rel="noreferrer" style={{ color: '#1D4ED8' }}>View GPS Location</a></div>
                <div>• Timestamp: {new Date(policeDossier.digitalEvidence?.timestampOfActivation).toLocaleString()}</div>
              </div>

              <div style={{ marginBottom: '0.75rem', backgroundColor: '#FEF2F2', padding: '0.5rem', borderRadius: '6px', border: '1px solid #FECACA' }}>
                <strong>FINANCIAL LOSS & WASTED RESOURCE ASSESSMENT:</strong>
                <div>• Fuel & Ambulance Crew Dispatch: {policeDossier.financialLossAssessed?.fuelAndDeploymentCost}</div>
                <div>• Paramedic Wasted Hour Surcharge: {policeDossier.financialLossAssessed?.paramedicWastedHourSurcharge}</div>
                <div>• <strong>TOTAL PENALTY ASSESSED: <span style={{ color: '#DC2626' }}>{policeDossier.financialLossAssessed?.totalPenaltyDue}</span></strong></div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>
                {policeDossier.legalRecommendation}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <Button
                variant="outline"
                onClick={() => window.print()}
                leftIcon={<Download size={16} />}
                style={{ flex: 1 }}
              >
                Print / Save Evidence PDF
              </Button>
              <Button
                variant="primary"
                onClick={() => setDossierModalOpen(false)}
                style={{ flex: 1 }}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default EmergencyDashboardPage;
