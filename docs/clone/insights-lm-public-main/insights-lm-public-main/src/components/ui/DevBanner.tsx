import React from 'react';

type DevBannerProps = {
  className?: string;
};

const DevBanner: React.FC<DevBannerProps> = ({ className }) => {
  const useMocks = String(import.meta.env.VITE_USE_MOCKS) === 'true';
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'N/A';

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        'w-full text-xs text-white bg-zinc-900 px-3 py-1.5 flex items-center justify-between ' +
        (className || '')
      }
      style={{ position: 'sticky', top: 0, zIndex: 60 }}
    >
      <div>
        <strong>DEV</strong> • Mocks: {useMocks ? 'ON' : 'OFF'} • Supabase: {supabaseUrl}
      </div>
      <div className="flex items-center gap-3">
        {useMocks ? (
          <span className="opacity-80">Switch to real: set VITE_USE_MOCKS=false</span>
        ) : (
          <span className="opacity-80">Real mode: Edge→Orchestrator</span>
        )}
      </div>
    </div>
  );
};

export default DevBanner;
