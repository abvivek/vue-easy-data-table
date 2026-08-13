import type { Header } from './types/main';
import type { HeaderForRender } from './types/internal';

export function cloneHeader(header: Header): Header {
  const cloned: Header = { ...header };
  if (Array.isArray(header.children)) {
    cloned.children = header.children.map(cloneHeader);
  }
  return cloned;
}

export function isGroup(header: Header): boolean {
  return Array.isArray(header.children) && header.children.length > 0;
}

export function visibleLeaves(header: Header): Header[] {
  if (header.hidden) return [];
  if (!isGroup(header)) return [header];
  return (header.children ?? []).flatMap(visibleLeaves);
}

export function filterHiddenHeaders(headers: Header[]): Header[] {
  const result: Header[] = [];
  for (const header of headers) {
    if (header.hidden) continue;
    if (isGroup(header)) {
      const children = filterHiddenHeaders(header.children ?? []);
      if (children.length === 0) continue;
      result.push({ ...header, children });
    } else {
      result.push(header);
    }
  }
  return result;
}

function stripFixedOnLeaves(header: Header): Header {
  if (isGroup(header)) {
    return {
      ...header,
      children: (header.children ?? []).map(stripFixedOnLeaves),
    };
  }
  return { ...header, fixed: false };
}

export function normalizeGroupFixed(header: Header, warn: (msg: string) => void): Header {
  if (!isGroup(header)) return header;
  const children = (header.children ?? []).map((child) => normalizeGroupFixed(child, warn));
  const normalized: Header = { ...header, children };
  const leaves = visibleLeaves(normalized);
  const hasFixed = leaves.some((leaf) => leaf.fixed === true);
  const hasUnfixed = leaves.some((leaf) => leaf.fixed !== true);
  if (hasFixed && hasUnfixed) {
    warn(
      `[vue-easy-data-table] grouped header "${header.text}" mixes fixed and unfixed children; treating the group as unfixed.`,
    );
    return {
      ...normalized,
      children: children.map(stripFixedOnLeaves),
    };
  }
  return normalized;
}

export function headerDepth(header: Header): number {
  if (!isGroup(header)) return 1;
  const childDepths = (header.children ?? []).map(headerDepth);
  return 1 + (childDepths.length ? Math.max(...childDepths) : 0);
}

export function maxDepth(headers: Header[]): number {
  if (!headers.length) return 1;
  return Math.max(...headers.map(headerDepth), 1);
}

export function isTopLevelFixed(header: Header): boolean {
  if (!isGroup(header)) return header.fixed === true;
  const leaves = visibleLeaves(header);
  return leaves.length > 0 && leaves.every((leaf) => leaf.fixed === true);
}

export function partitionFixedTopLevel(headers: Header[]): Header[] {
  if (!headers.some(isTopLevelFixed)) return headers;
  const fixed: Header[] = [];
  const unfixed: Header[] = [];
  for (const header of headers) {
    if (isTopLevelFixed(header)) fixed.push(header);
    else unfixed.push(header);
  }
  return [...fixed, ...unfixed];
}

export function flattenLeaves(headers: Header[]): Header[] {
  return headers.flatMap((header) => (
    isGroup(header) ? flattenLeaves(header.children ?? []) : [header]
  ));
}

export function buildHeaderRows(
  orderedTopLevel: Header[],
  synthetic: HeaderForRender[],
  applySort: (leaf: Header) => HeaderForRender,
): HeaderForRender[][] {
  const depth = maxDepth(orderedTopLevel);
  const rows: HeaderForRender[][] = Array.from({ length: depth }, () => []);

  for (const cell of synthetic) {
    rows[0].push({
      ...cell,
      colspan: 1,
      rowspan: depth,
      isGroup: false,
    });
  }

  const place = (header: Header, currentDepth: number) => {
    if (isGroup(header)) {
      const leaves = visibleLeaves(header);
      const allFixed = leaves.length > 0 && leaves.every((leaf) => leaf.fixed === true);
      rows[currentDepth].push({
        text: header.text,
        value: header.value,
        fixed: allFixed,
        align: header.align,
        className: header.className,
        colspan: leaves.length,
        rowspan: 1,
        isGroup: true,
        firstLeafValue: leaves[0]?.value,
        lastLeafValue: leaves[leaves.length - 1]?.value,
      });
      for (const child of header.children ?? []) {
        place(child, currentDepth + 1);
      }
      return;
    }
    const leaf = applySort(header);
    rows[currentDepth].push({
      ...leaf,
      colspan: 1,
      rowspan: depth - currentDepth,
      isGroup: false,
    });
  };

  for (const header of orderedTopLevel) {
    place(header, 0);
  }

  return rows;
}
