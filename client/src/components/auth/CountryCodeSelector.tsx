import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRIES: Country[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
];

export interface CountryCodeSelectorProps {
  selectedDialCode: string;
  onSelect: (dialCode: string) => void;
}

export const CountryCodeSelector: React.FC<CountryCodeSelectorProps> = ({
  selectedDialCode,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry =
    COUNTRIES.find((c) => c.dialCode === selectedDialCode) || COUNTRIES[0];

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dialCode.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0 0.875rem',
          height: '48px',
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: '8px 0 0 8px',
          cursor: 'pointer',
          color: '#0F172A',
          fontSize: '0.9375rem',
          fontWeight: 600,
          outline: 'none',
        }}
        aria-label="Select Country Code"
      >
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{selectedCountry.flag}</span>
        <span style={{ color: '#475569', fontSize: '0.8125rem', fontWeight: 700 }}>{selectedCountry.code}</span>
        <span style={{ color: '#0F172A' }}>{selectedCountry.dialCode}</span>
        <ChevronDown size={14} color="#64748B" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 9999,
            width: '320px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {/* Search bar inside dropdown */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: '#FFFFFF',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #F1F5F9',
              marginBottom: '0.375rem',
              zIndex: 2,
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.75rem', color: '#94A3B8' }}
              />
              <input
                type="text"
                placeholder="Search country name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                  fontSize: '0.8125rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                  color: '#0F172A',
                  outline: 'none',
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {filteredCountries.map((country) => {
            const isSelected = country.dialCode === selectedDialCode;
            return (
              <div
                key={country.code}
                onClick={() => {
                  onSelect(country.dialCode);
                  setIsOpen(false);
                  setSearch('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  backgroundColor: isSelected ? '#EFF6FF' : 'transparent',
                  color: isSelected ? '#1A56DB' : '#1E293B',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{country.flag}</span>
                  <span style={{ fontSize: '0.875rem' }}>{country.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>{country.code}</span>
                  <span style={{ color: '#0F172A', fontWeight: 600, fontSize: '0.8125rem' }}>{country.dialCode}</span>
                </div>
              </div>
            );
          })}

          {filteredCountries.length === 0 && (
            <div
              style={{
                padding: '1.25rem 0.5rem',
                textAlign: 'center',
                fontSize: '0.8125rem',
                color: '#94A3B8',
              }}
            >
              No country found matching "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
