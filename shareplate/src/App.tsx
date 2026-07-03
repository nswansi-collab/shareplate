import React from 'react';
import MarketplaceApp from './components/MarketplaceApp';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased selection:bg-emerald-500/10 selection:text-emerald-800 p-2 sm:p-4 lg:p-6 h-screen overflow-hidden">
      <MarketplaceApp />
    </div>
  );
}

