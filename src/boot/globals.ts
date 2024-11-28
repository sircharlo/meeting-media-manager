import type PQueue from 'p-queue';

const queues: {
  // downloads: Record<string, PQueue>;
  meetings: Record<string, PQueue>;
} = { /*downloads: {}, */ meetings: {} };

export { queues };
