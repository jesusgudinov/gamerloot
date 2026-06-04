import React from 'react';

export default function SkeletonCard({ type = 'default' }: { type?: 'default' | 'metric' | 'chart' | 'list' | 'table' }) {
  if (type === 'metric') {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div className="skeleton skeleton-text" style={{ width: '40%', height: '16px' }}></div>
          <div className="skeleton" style={{ width: '24px', height: '24px', borderRadius: '50%' }}></div>
        </div>
        <div className="skeleton skeleton-title" style={{ width: '70%', height: '36px', marginBottom: '16px' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '50%', height: '14px', marginBottom: '0' }}></div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="table-responsive-wrapper glass-panel">
        <div style={{ minWidth: '1000px', padding: '20px' }}>
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '1px solid var(--card-border)', paddingBottom: '16px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => <div key={`th-${i}`} className="skeleton skeleton-text" style={{ width: '100px', height: '20px', margin: 0 }}></div>)}
          </div>
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div key={`tr-${row}`} style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' }}>
               <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '4px' }}></div>
               <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }}></div>
               <div style={{ flex: 1 }}>
                 <div className="skeleton skeleton-text" style={{ width: '60%', height: '16px' }}></div>
                 <div className="skeleton skeleton-text" style={{ width: '30%', height: '12px', margin: 0 }}></div>
               </div>
               <div className="skeleton skeleton-text" style={{ width: '100px', height: '16px', margin: 0 }}></div>
               <div className="skeleton skeleton-text" style={{ width: '80px', height: '16px', margin: 0 }}></div>
               <div className="skeleton skeleton-text" style={{ width: '120px', height: '24px', borderRadius: '12px', margin: 0 }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className="glass-panel" style={{ padding: '24px', height: '100%', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
        <div className="skeleton skeleton-title" style={{ width: '30%', height: '24px', marginBottom: '30px' }}></div>
        <div className="skeleton" style={{ flex: 1, width: '100%', borderRadius: '8px' }}></div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="skeleton skeleton-title" style={{ width: '40%', height: '24px', marginBottom: '24px' }}></div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '8px' }}></div>
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '80%', height: '16px', marginBottom: '8px' }}></div>
              <div className="skeleton skeleton-text" style={{ width: '40%', height: '12px', marginBottom: '0' }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default generic skeleton
  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
      <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
    </div>
  );
}
