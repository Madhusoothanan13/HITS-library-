import React, { useState } from 'react';

interface HitsLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  lightTheme?: boolean;
}

const PRIMARY_LOGO_URL = '/hits-logo.jpg';
const FALLBACK_LOGO_URL =
  'https://content.jdmagicbox.com/v2/comp/chennai/c8/044pxx44.xx44.180205174804.k6c8/catalogue/hindustan-university-padur-chennai-universities-0s7gwbt5n6.jpg';

export const HitsLogo: React.FC<HitsLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  lightTheme = false
}) => {
  const [imgSrc, setImgSrc] = useState(PRIMARY_LOGO_URL);

  const sizeDims = {
    sm: { box: 'w-10 h-10', img: 'w-10 h-10', textTitle: 'text-xs', textSub: 'text-[9px]' },
    md: { box: 'w-12 h-12', img: 'w-12 h-12', textTitle: 'text-sm', textSub: 'text-[10px]' },
    lg: { box: 'w-16 h-16', img: 'w-16 h-16', textTitle: 'text-base', textSub: 'text-xs' },
    xl: { box: 'w-20 h-20', img: 'w-20 h-20', textTitle: 'text-lg', textSub: 'text-xs' }
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official HITS Logo Image from user requested source */}
      <div className={`relative ${sizeDims.box} shrink-0 select-none rounded-full overflow-hidden bg-white p-0.5 shadow-md border-2 border-amber-400/80 flex items-center justify-center`}>
        <img
          src={imgSrc}
          alt="Hindustan Institute of Technology and Science Logo"
          referrerPolicy="no-referrer"
          onError={() => {
            if (imgSrc !== FALLBACK_LOGO_URL) {
              setImgSrc(FALLBACK_LOGO_URL);
            }
          }}
          className="w-full h-full object-contain rounded-full"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-black tracking-tight uppercase leading-none ${sizeDims.textTitle} ${lightTheme ? 'text-slate-900' : 'text-white'}`}>
              HINDUSTAN
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
              NAAC A+
            </span>
          </div>

          <span className={`font-bold tracking-tight text-[11px] leading-tight ${lightTheme ? 'text-[#621708]' : 'text-emerald-400'}`}>
            INSTITUTE OF TECHNOLOGY &amp; SCIENCE
          </span>

          <span className="text-[9px] text-slate-400 font-medium tracking-wide">
            (DEEMED TO BE UNIVERSITY) &bull; CHENNAI
          </span>
        </div>
      )}
    </div>
  );
};
