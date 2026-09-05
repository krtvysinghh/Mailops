import React, { useState, useRef, useMemo } from 'react';

interface VirtualScrollerProps<T> {
  items: T[];
  rowHeight: number;
  overscan?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
}

export function VirtualScroller<T>({ items, rowHeight, overscan = 3, renderRow }: VirtualScrollerProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalHeight = items.length * rowHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const viewportHeight = containerRef.current?.clientHeight || 600;
  const endIndex = Math.min(items.length - 1, Math.floor((scrollTop + viewportHeight) / rowHeight) + overscan);

  const visibleItems = useMemo(() => {
    const rows = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        rows.push(
          <div key={i} style={{ position: 'absolute', top: i * rowHeight, height: rowHeight, width: '100%' }}>
            {renderRow(items[i], i)}
          </div>
        );
      }
    }
    return rows;
  }, [items, startIndex, endIndex, rowHeight, renderRow]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div ref={containerRef} onScroll={handleScroll} style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}