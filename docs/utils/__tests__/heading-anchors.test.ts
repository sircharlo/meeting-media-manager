import { describe, expect, it } from 'vitest';

import {
  getTrailingHeadingAnchors,
  replaceHeadingAnchor,
} from '../heading-anchors.mjs';

describe('getTrailingHeadingAnchors', () => {
  it('reads every trailing anchor, in order', () => {
    expect(getTrailingHeadingAnchors('## Title {#one} {#two}  ')).toEqual({
      anchors: ['one', 'two'],
      start: 8,
    });
  });

  it('reports the line length when there is no anchor', () => {
    expect(getTrailingHeadingAnchors('## Title')).toEqual({
      anchors: [],
      start: 8,
    });
  });

  it.each([
    ['an empty anchor', '## Title {#}'],
    ['an anchor with a space', '## Title {#two words}'],
    ['an anchor that is not at the end', '## Title {#one} text'],
  ])('ignores %s', (_label, line) => {
    expect(getTrailingHeadingAnchors(line).anchors).toEqual([]);
  });
});

describe('replaceHeadingAnchor', () => {
  it('replaces all trailing anchors with one', () => {
    expect(replaceHeadingAnchor('## Titre {#old} {#older}', 'new')).toBe(
      '## Titre {#new}',
    );
  });

  it('adds an anchor without keeping trailing whitespace', () => {
    expect(replaceHeadingAnchor('## Titre   ', 'new')).toBe('## Titre {#new}');
  });

  it.each([
    ['a bare anchor', '{#old}'],
    ['an anchor after a space', ' {#new}'],
  ])('leaves no space before the anchor of %s', (_label, line) => {
    expect(replaceHeadingAnchor(line, 'new')).toBe('{#new}');
  });
});
