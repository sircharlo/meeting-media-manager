import type { MediaSectionIdentifier } from 'src/types';

import { useCurrentStateStore } from 'stores/current-state';

// See the `pendingSectionImports` doc comment in the current-state store:
// these are the read/write side of that array, shared by every code path
// that adds media to a section, so MediaList can render a skeleton
// placeholder for the gap between the user picking media and it actually
// landing in the store.

export function beginPendingSectionImport(
  section: MediaSectionIdentifier | undefined,
  count = 1,
) {
  if (!section || count <= 0) return;
  const currentState = useCurrentStateStore();
  for (let i = 0; i < count; i++) {
    currentState.pendingSectionImports.push(section);
  }
}

export function endPendingSectionImport(
  section: MediaSectionIdentifier | undefined,
  count = 1,
) {
  if (!section || count <= 0) return;
  const currentState = useCurrentStateStore();
  for (let i = 0; i < count; i++) {
    const index = currentState.pendingSectionImports.indexOf(section);
    if (index === -1) break;
    currentState.pendingSectionImports.splice(index, 1);
  }
}

// count should reflect how many items are expected to land in the section
// once fn resolves, so the number of skeletons shown matches reality (e.g.
// a multi-item study Bible or JW Playlist import). When the exact count
// isn't known ahead of time (e.g. a jwpub document import that pulls in all
// of a document's media), pass 1 as a "something is coming" placeholder
// rather than skipping the indicator entirely.
export async function withPendingSectionImport<T>(
  section: MediaSectionIdentifier | undefined,
  count: number,
  fn: () => Promise<T>,
): Promise<T> {
  beginPendingSectionImport(section, count);
  try {
    return await fn();
  } finally {
    endPendingSectionImport(section, count);
  }
}
