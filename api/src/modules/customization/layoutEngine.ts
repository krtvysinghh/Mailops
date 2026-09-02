/**
 * Feature 42: Split Pane & Multi-View Layouts
 * Pure TypeScript layout manager supporting:
 * - 3-pane vertical layout (Sidebar + Thread List + Reader)
 * - 2-pane horizontal layout (Thread List on top + Reader on bottom)
 * - Compact list view (Single list pane + modal or full-width reader)
 * - Zen Mode (Full-screen distraction-free reader / composer)
 * - Resizable pane constraints, snap points, and collapse states.
 */

export type LayoutMode = 'split-3pane' | 'split-2pane-horizontal' | 'compact-list' | 'zen-mode';

export interface PaneWidths {
  sidebarWidth: number;   // In pixels, e.g. 240
  listWidth: number;      // In pixels (or percentage for 3-pane), e.g. 360
  readerWidth?: number;   // Remaining space or explicit px
  listHeight?: number;    // In pixels for horizontal split, e.g. 300
}

export interface LayoutConstraints {
  minSidebarWidth: number;
  maxSidebarWidth: number;
  minListWidth: number;
  maxListWidth: number;
  minReaderWidth: number;
  minListHeight: number;
  maxListHeight: number;
}

export const DEFAULT_LAYOUT_CONSTRAINTS: LayoutConstraints = {
  minSidebarWidth: 160,
  maxSidebarWidth: 400,
  minListWidth: 240,
  maxListWidth: 600,
  minReaderWidth: 320,
  minListHeight: 150,
  maxListHeight: 600,
};

export interface LayoutState {
  mode: LayoutMode;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  listWidth: number;
  listHeight: number;
  zenActive: boolean;
}

export const DEFAULT_LAYOUT_STATE: LayoutState = {
  mode: 'split-3pane',
  sidebarCollapsed: false,
  sidebarWidth: 240,
  listWidth: 360,
  listHeight: 300,
  zenActive: false,
};

/**
 * Validates and clamps pane dimensions against container width and constraints.
 */
export function clampPaneDimensions(
  proposed: Partial<PaneWidths>,
  totalContainerWidth: number,
  totalContainerHeight: number,
  constraints: LayoutConstraints = DEFAULT_LAYOUT_CONSTRAINTS
): PaneWidths {
  let sidebar = proposed.sidebarWidth ?? 240;
  let list = proposed.listWidth ?? 360;
  let listHeight = proposed.listHeight ?? 300;

  // Clamp sidebar
  sidebar = Math.max(constraints.minSidebarWidth, Math.min(constraints.maxSidebarWidth, sidebar));

  // Clamp list width
  list = Math.max(constraints.minListWidth, Math.min(constraints.maxListWidth, list));

  // Clamp list height for horizontal mode
  listHeight = Math.max(constraints.minListHeight, Math.min(constraints.maxListHeight, listHeight));

  // Ensure reader has minimum width in 3-pane mode
  const remainingForReader = totalContainerWidth - sidebar - list;
  if (remainingForReader < constraints.minReaderWidth && totalContainerWidth > (constraints.minSidebarWidth + constraints.minListWidth + constraints.minReaderWidth)) {
    // Compress list first, then sidebar
    const deficit = constraints.minReaderWidth - remainingForReader;
    const canReduceList = list - constraints.minListWidth;
    const listReduction = Math.min(deficit, canReduceList);
    list -= listReduction;
    const remainingDeficit = deficit - listReduction;
    if (remainingDeficit > 0) {
      sidebar = Math.max(constraints.minSidebarWidth, sidebar - remainingDeficit);
    }
  }

  const reader = Math.max(0, totalContainerWidth - sidebar - list);

  return {
    sidebarWidth: Math.round(sidebar),
    listWidth: Math.round(list),
    readerWidth: Math.round(reader),
    listHeight: Math.round(listHeight),
  };
}

/**
 * Calculates CSS grid template columns or flex basis based on layout state.
 */
export function computeLayoutGridStyles(
  state: LayoutState,
  containerWidth: number
): {
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  display: string;
  sidebarVisible: boolean;
  listVisible: boolean;
  readerVisible: boolean;
  isZen: boolean;
} {
  if (state.zenActive || state.mode === 'zen-mode') {
    return {
      display: 'flex',
      sidebarVisible: false,
      listVisible: false,
      readerVisible: true,
      isZen: true,
    };
  }

  switch (state.mode) {
    case 'split-3pane': {
      const sidebar = state.sidebarCollapsed ? 0 : state.sidebarWidth;
      const list = state.listWidth;
      const grid = `${sidebar > 0 ? `${sidebar}px ` : ''}${list}px 1fr`;
      return {
        display: 'grid',
        gridTemplateColumns: grid,
        sidebarVisible: !state.sidebarCollapsed,
        listVisible: true,
        readerVisible: true,
        isZen: false,
      };
    }
    case 'split-2pane-horizontal': {
      const sidebar = state.sidebarCollapsed ? 0 : state.sidebarWidth;
      const grid = `${sidebar > 0 ? `${sidebar}px ` : ''}1fr`;
      return {
        display: 'grid',
        gridTemplateColumns: grid,
        gridTemplateRows: `1fr`,
        sidebarVisible: !state.sidebarCollapsed,
        listVisible: true,
        readerVisible: true,
        isZen: false,
      };
    }
    case 'compact-list': {
      const sidebar = state.sidebarCollapsed ? 0 : state.sidebarWidth;
      const grid = `${sidebar > 0 ? `${sidebar}px ` : ''}1fr`;
      return {
        display: 'grid',
        gridTemplateColumns: grid,
        sidebarVisible: !state.sidebarCollapsed,
        listVisible: true,
        readerVisible: false,
        isZen: false,
      };
    }
    default:
      return {
        display: 'grid',
        gridTemplateColumns: `240px 360px 1fr`,
        sidebarVisible: true,
        listVisible: true,
        readerVisible: true,
        isZen: false,
      };
  }
}
