import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

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
          gap: '0.375rem',
          padding: '0.625rem 0.75rem',
          background: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
          cursor: 'pointer',
          minHeight: '44px',
          color: 'var(--text-primary)',
          fontSize: '0.9375rem',
          fontWeight: 500,
        }}
        aria-label="Select Country Code"
      >
        <span style={{ fontSize: '1.25rem' }}>{selectedCountry.flag}</span>
        <span>{selectedCountry.dialCode}</span>
        <ChevronDown size={14} color="var(--text-muted)" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            marginTop: '4px',
            width: '280px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '0.5rem',
          }}
        >
          {/* Search bar inside dropdown */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              background: 'var(--bg-surface)',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: '0.5rem',
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search
                size={14}
                style={{ position: 'absolute', left: '0.5rem', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '0.375rem 0.5rem 0.375rem 2rem',
                  fontSize: '0.8125rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {filteredCountries.map((country) => (
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
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                background:
                  country.dialCode === selectedDialCode
                    ? 'var(--color-primary-50)'
                    : 'transparent',
                color:
                  country.dialCode === selectedDialCode
                    ? 'var(--color-primary-700)'
                    : 'var(--text-primary)',
              }}
              onMouseEnter={(e) => {
                if (country.dialCode !== selectedDialCode) {
                  e.currentTarget.style.background = 'var(--bg-surface-subtle)';
                }
              }}
              onMouseLeave={(e) => {
                if (country.dialCode !== selectedDialCode) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>{country.flag}</span>
                <span>{country.name}</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
                {country.dialCode}
              </span>
            </div>
          ))}

          {filteredCountries.length === 0 && (
            <div
              style={{
                padding: '1rem',
                textAlign: 'center',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              No countries found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
