// components/CountryFlag.tsx
import 'flag-icons/css/flag-icons.min.css';
import { getAlpha2Code, getCustomFlagPath } from '@/utils/countryCodeMap';
import { FC } from 'react';
import Image from 'next/image';

interface CountryFlagProps {
    countryCode: string;
    className?: string;
}

const CountryFlag: FC<CountryFlagProps> = ({ countryCode, className = '' }) => {
    const alpha2Code = getAlpha2Code(countryCode);
    const customPath = getCustomFlagPath(countryCode);

    // Priority 1: flag-icons library
    if (alpha2Code) {
        return (
            <span
                className={`shrink-0 fi fi-${alpha2Code.toLowerCase()} ${className}`}
                aria-label={countryCode}
            />
        );
    }

    // Priority 2: custom SVG
    if (customPath) {
        return (
            <Image
                src={customPath}
                alt={countryCode || 'flag'}
                width={24}
                height={24}
                className={className}
            />
        );
    }

    // Default fallback
    // return <span className={className}>🏳️</span>;
    return <span className="text-xs px-1.5 py-0.5 rounded shrink-0"
        style={{
            background: "var(--glass-strong)",
        }}>
        {countryCode}</span>;

};

export default CountryFlag;