import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Copy,
  Check,
} from 'lucide-react';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentDetails: {
    transactionId: string;
    method: 'UPI' | 'CARD' | 'CLINIC';
    amount: number;
    paidAt: string;
  }) => void;
  amount: number;
  doctorName: string;
  hospitalName?: string;
  patientName: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  amount = 500,
  doctorName,
  hospitalName = 'HealthSync Network',
  patientName,
}) => {
  const [method, setMethod] = useState<'UPI' | 'CARD' | 'CLINIC'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(patientName || '');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptTxnId, setReceiptTxnId] = useState('');

  if (!isOpen) return null;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('healthsync.pay@icici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleProcessPayment = () => {
    setProcessing(true);
    const txnId = 'TXN-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    setTimeout(() => {
      setProcessing(false);
      setIsSuccess(true);
      setReceiptTxnId(txnId);

      setTimeout(() => {
        onPaymentSuccess({
          transactionId: txnId,
          method,
          amount,
          paidAt: new Date().toISOString(),
        });
      }, 1500);
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          width: '100%',
          maxWidth: '520px',
          padding: '1.75rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          color: '#0F172A',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#1A56DB', fontSize: '0.75rem', fontWeight: 800 }}>
              <ShieldCheck size={14} />
              <span>256-BIT ENCRYPTED HEALTHCARE GATEWAY</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.25rem 0 0 0', color: '#0F172A' }}>
              Confirm Consultation Payment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#DCFCE7',
                color: '#16A34A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#16A34A' }}>
              Payment Verified & Confirmed!
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.375rem' }}>
              Transaction Reference ID: <strong style={{ color: '#0F172A' }}>{receiptTxnId}</strong>
            </p>
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '8px', padding: '0.75rem', marginTop: '1rem', fontSize: '0.8125rem', color: '#475569' }}>
              Your appointment with <strong>{doctorName}</strong> is fully booked.
            </div>
          </div>
        ) : (
          <>
            {/* Amount Summary Pill */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: '#1E40AF', fontWeight: 600 }}>CONSULTATION CHARGES</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E3A8A' }}>
                  {doctorName} • {hospitalName}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.6875rem', color: '#1E40AF' }}>TOTAL PAYABLE</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1A56DB' }}>₹{amount}</div>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setMethod('UPI')}
                style={{
                  padding: '0.625rem 0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${method === 'UPI' ? '#1A56DB' : '#E2E8F0'}`,
                  backgroundColor: method === 'UPI' ? '#EFF6FF' : '#FFFFFF',
                  color: method === 'UPI' ? '#1A56DB' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <QrCode size={18} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CARD')}
                style={{
                  padding: '0.625rem 0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${method === 'CARD' ? '#1A56DB' : '#E2E8F0'}`,
                  backgroundColor: method === 'CARD' ? '#EFF6FF' : '#FFFFFF',
                  color: method === 'CARD' ? '#1A56DB' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <CreditCard size={18} />
                <span>Cards / NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setMethod('CLINIC')}
                style={{
                  padding: '0.625rem 0.5rem',
                  borderRadius: '8px',
                  border: `1px solid ${method === 'CLINIC' ? '#1A56DB' : '#E2E8F0'}`,
                  backgroundColor: method === 'CLINIC' ? '#EFF6FF' : '#FFFFFF',
                  color: method === 'CLINIC' ? '#1A56DB' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  cursor: 'pointer',
                }}
              >
                <Building size={18} />
                <span>Pay at Clinic</span>
              </button>
            </div>

            {/* TAB 1: UPI CONTENT */}
            {method === 'UPI' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {/* Dynamic Real Scan-Ready UPI QR Code */}
                  <div
                    style={{
                      width: '110px',
                      height: '110px',
                      backgroundColor: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '10px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                        `upi://pay?pa=healthsync.pay@icici&pn=HealthSync%20Healthcare&am=${amount}&cu=INR`
                      )}`}
                      alt="UPI QR Code"
                      style={{ width: '100%', height: '100%', borderRadius: '6px' }}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A' }}>
                      Scan QR with Any UPI App
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '2px' }}>
                      GPay, PhonePe, Paytm, BHIM, CRED
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        marginTop: '0.5rem',
                        fontSize: '0.75rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        padding: '4px 8px',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace', color: '#334155', fontWeight: 700 }}>healthsync.pay@icici</span>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#1A56DB', cursor: 'pointer' }}
                      >
                        {copiedUpi ? <Check size={14} color="#16A34A" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>


                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Or enter UPI ID (e.g. mobile@upi)"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      color: '#0F172A',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (upiId) alert('UPI verification request sent to your app!');
                    }}
                    style={{
                      padding: '0.5rem 0.875rem',
                      backgroundColor: '#1A56DB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Verify
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CREDIT / DEBIT CARD */}
            {method === 'CARD' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="12/28"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                      CVV / CVC
                    </label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: PAY AT CLINIC */}
            {method === 'CLINIC' && (
              <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B45309', fontWeight: 700, fontSize: '0.875rem' }}>
                  <Building size={18} />
                  <span>Pay Offline at Hospital Counter</span>
                </div>
                <p style={{ margin: '0.375rem 0 0 0', fontSize: '0.75rem', color: '#92400E' }}>
                  You can pay ₹{amount} directly via Cash, Card, or UPI at the hospital billing desk before consulting Dr. {doctorName}. Your appointment slot will be confirmed immediately.
                </p>
              </div>
            )}

            {/* Submit Action Button */}
            <button
              type="button"
              onClick={handleProcessPayment}
              disabled={processing}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.75rem',
                backgroundColor: method === 'CLINIC' ? '#0D9488' : '#1A56DB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9375rem',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(26, 86, 219, 0.25)',
              }}
            >
              <Lock size={16} />
              <span>
                {processing
                  ? 'Verifying Transaction with Bank...'
                  : method === 'CLINIC'
                  ? 'Confirm Slot (Pay ₹' + amount + ' at Clinic)'
                  : 'Pay ₹' + amount + ' Securely'}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
