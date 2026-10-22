/**
 * Explicit markdown heading anchors (`## Title {#anchor}`), shared by
 * docs/utils/fix-doc-markdown.mjs (repairs the docs files in the repo) and
 * scripts/cleanup-crowdin.mjs (repairs the same headings in Crowdin), so the
 * two always agree on what an anchor is and how one is rewritten.
 */

/**
 * The explicit anchors at the end of a heading line, in order, and where
 * they start (after any whitespace before them). `start` is the line's
 * length when there are none.
 */
export function getTrailingHeadingAnchors(line) {
  const anchors = [];
  let cursor = trimEndIndex(line);

  while (cursor > 0 && line[cursor - 1] === '}') {
    const openIndex = line.lastIndexOf('{#', cursor - 1);
    if (openIndex === -1) break;

    const anchor = line.slice(openIndex + 2, cursor - 1);
    if (!isValidAnchor(anchor)) break;

    anchors.unshift(anchor);
    cursor = trimEndIndex(line, openIndex);
  }

  const start = anchors.length > 0 ? cursor : line.length;
  return { anchors, start };
}

/**
 * The heading line with its trailing anchors (and the whitespace before
 * them) replaced by a single `{#anchor}`. A line holding nothing but anchors
 * (the hidden `{#slug}` string Crowdin splits off a heading) becomes the bare
 * `{#anchor}`: the export already puts the source's space before it.
 */
export function replaceHeadingAnchor(line, anchor) {
  const text = line.slice(0, getTrailingHeadingAnchors(line).start).trimEnd();
  return text ? `${text} {#${anchor}}` : `{#${anchor}}`;
}

function isValidAnchor(anchor) {
  return (
    anchor.length > 0 &&
    [...anchor].every((char) => char !== '}' && char.trim() !== '')
  );
}

function trimEndIndex(value, end = value.length) {
  let cursor = end;
  while (cursor > 0 && value[cursor - 1].trim() === '') {
    cursor -= 1;
  }
  return cursor;
}
