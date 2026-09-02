import React, { useState, useRef, useEffect } from 'react';
import { useUI } from '../../context/UIContext';

interface SplitPaneLayoutProps {
  sidebarContent: React.ReactNode;
  listContent: React.ReactNode;
  readerContent: React.ReactNode;
}

export const SplitPaneLayout: React.FC<SplitPaneLayoutProps> = ({
  sidebarContent,
  listContent,
  readerContent,
}) => {
  const {
    layoutMode,
    setLayoutMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    zenModeActive,
    setZenModeActive,
    paneWidths,
    setPaneWidths,
    density,
  } = useUI();

  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isResizingList, setIsResizingList] = useState(false);
  const [isResizingListHeight, setIsResizingListHeight] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Resize drag listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isResizingSidebar) {
        const newWidth = Math.max(160, Math.min(400, e.clientX - rect.left));
        setPaneWidths(prev => ({ ...prev, sidebar: newWidth }));
      } else if (isResizingList) {
        const sidebarW = sidebarCollapsed ? 0 : paneWidths.sidebar;
        const newWidth = Math.max(220, Math.min(650, e.clientX - rect.left - sidebarW));
        setPaneWidths(prev => ({ ...prev, list: newWidth }));
      } else if (isResizingListHeight) {
        const newHeight = Math.max(150, Math.min(550, e.clientY - rect.top));
        setPaneWidths(prev => ({ ...prev, listHeight: newHeight }));
      }
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      setIsResizingList(false);
      setIsResizingListHeight(false);
    };

    if (isResizingSidebar || isResizingList || isResizingListHeight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSidebar, isResizingList, isResizingListHeight, sidebarCollapsed, paneWidths.sidebar, setPaneWidths]);

  // Full Zen Mode View
  if (zenModeActive || layoutMode === 'zen-mode') {
    return (
      <div className="flex flex-col h-screen w-screen bg-[var(--mailops-bg)] text-[var(--mailops-text)]">
        <header className="flex items-center justify-between px-6 py-3 border-b border-[var(--mailops-border)] bg-[var(--mailops-card)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Zen Mode Active
            </span>
            <span className="text-xs text-slate-500">Distraction-free email view</span>
          </div>
          <button
            onClick={() => setZenModeActive(false)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Exit Zen Mode (Esc)
          </button>
        </header>
        <main className="flex-1 overflow-auto max-w-4xl w-full mx-auto p-8">
          {readerContent}
        </main>
      </div>
    );
  }

  // Layout switcher sub-header
  const renderLayoutControls = () => (
    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs">
      <button
        onClick={() => setLayoutMode('split-3pane')}
        title="3-Pane Vertical Split"
        className={`px-2 py-1 rounded transition ${layoutMode === 'split-3pane' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
      >
        3-Pane
      </button>
      <button
        onClick={() => setLayoutMode('split-2pane-horizontal')}
        title="2-Pane Horizontal Split"
        className={`px-2 py-1 rounded transition ${layoutMode === 'split-2pane-horizontal' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
      >
        Top/Bottom
      </button>
      <button
        onClick={() => setLayoutMode('compact-list')}
        title="Compact List View"
        className={`px-2 py-1 rounded transition ${layoutMode === 'compact-list' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
      >
        Compact
      </button>
      <button
        onClick={() => setZenModeActive(true)}
        title="Zen Focus Mode"
        className="px-2 py-1 rounded text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
      >
        🧘 Zen
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`h-screen w-screen flex flex-col bg-[var(--mailops-bg)] text-[var(--mailops-text)] select-none ${density}`}
    >
      {/* Top Navbar */}
      <div className="h-12 border-b border-[var(--mailops-border)] flex items-center justify-between px-4 bg-[var(--mailops-card)] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm"
          >
            {sidebarCollapsed ? '☰' : '⇤'}
          </button>
          <div className="font-bold text-base tracking-tight text-[var(--mailops-accent)]">
            Mailops
          </div>
        </div>
        <div className="flex items-center gap-3">
          {renderLayoutControls()}
        </div>
      </div>

      {/* Main Multi-View Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 1. Sidebar Pane */}
        {!sidebarCollapsed && (
          <>
            <aside
              style={{ width: `${paneWidths.sidebar}px` }}
              className="h-full overflow-y-auto shrink-0 border-r border-[var(--mailops-border)] bg-[var(--mailops-card)]"
            >
              {sidebarContent}
            </aside>
            {/* Resizer Handle */}
            <div
              onMouseDown={() => setIsResizingSidebar(true)}
              className="w-1 hover:w-1.5 bg-transparent hover:bg-blue-500 cursor-col-resize transition-all z-10 shrink-0"
              title="Drag to resize sidebar"
            />
          </>
        )}

        {/* 2. Middle & Reader Panes based on Layout Mode */}
        {layoutMode === 'split-3pane' && (
          <>
            {/* List Pane */}
            <div
              style={{ width: `${paneWidths.list}px` }}
              className="h-full overflow-y-auto shrink-0 border-r border-[var(--mailops-border)]"
            >
              {listContent}
            </div>
            {/* Resizer Handle */}
            <div
              onMouseDown={() => setIsResizingList(true)}
              className="w-1 hover:w-1.5 bg-transparent hover:bg-blue-500 cursor-col-resize transition-all z-10 shrink-0"
              title="Drag to resize list pane"
            />
            {/* Reader Pane */}
            <main className="flex-1 h-full overflow-y-auto bg-[var(--mailops-bg)]">
              {readerContent}
            </main>
          </>
        )}

        {layoutMode === 'split-2pane-horizontal' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Top List Pane */}
            <div
              style={{ height: `${paneWidths.listHeight}px` }}
              className="w-full overflow-y-auto shrink-0 border-b border-[var(--mailops-border)]"
            >
              {listContent}
            </div>
            {/* Horizontal Resizer Handle */}
            <div
              onMouseDown={() => setIsResizingListHeight(true)}
              className="h-1 hover:h-1.5 bg-transparent hover:bg-blue-500 cursor-row-resize transition-all z-10 shrink-0"
              title="Drag to resize top/bottom pane"
            />
            {/* Bottom Reader Pane */}
            <main className="flex-1 overflow-y-auto bg-[var(--mailops-bg)]">
              {readerContent}
            </main>
          </div>
        )}

        {layoutMode === 'compact-list' && (
          <div className="flex-1 h-full overflow-y-auto">
            {listContent}
          </div>
        )}
      </div>
    </div>
  );
};
