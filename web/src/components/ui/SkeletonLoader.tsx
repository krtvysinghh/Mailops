import React from 'react';

export const SkeletonText: React.FC<{ width?: string | number, height?: string | number }> = ({ width = '100%', height = '1em' }) => (
  <div style={{ width, height, backgroundColor: '#e0e0e0', borderRadius: '4px', animation: 'shimmer 1.5s infinite linear' }} />
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', backgroundColor: '#e0e0e0', animation: 'shimmer 1.5s infinite linear' }} />
);

export const SkeletonCard: React.FC = () => (
  <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
    <SkeletonAvatar size={48} />
    <div style={{ marginTop: '16px' }}><SkeletonText width="80%" /></div>
    <div style={{ marginTop: '8px' }}><SkeletonText width="60%" /></div>
  </div>
);

export const SkeletonInboxRow: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
    <SkeletonAvatar size={32} />
    <div style={{ flex: 1, marginLeft: '12px' }}>
      <SkeletonText width="40%" height="1.2em" />
      <div style={{ marginTop: '4px' }}><SkeletonText width="70%" /></div>
    </div>
  </div>
);

const styles = `
@keyframes shimmer {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}
`;
export const SkeletonStyles = () => <style>{styles}</style>;