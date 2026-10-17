// Types for heading-anchors.mjs, which stays plain JavaScript so the
// fix-doc-markdown and cleanup-crowdin scripts can run it directly in Node.

export declare function getTrailingHeadingAnchors(line: string): {
  anchors: string[];
  start: number;
};

export declare function replaceHeadingAnchor(
  line: string,
  anchor: string,
): string;
