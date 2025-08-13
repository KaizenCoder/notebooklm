import React from 'react';

const SkipLink: React.FC = () => {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-black text-white text-sm px-3 py-2 rounded z-50"
    >
      Skip to main content
    </a>
  );
};

export default SkipLink;
