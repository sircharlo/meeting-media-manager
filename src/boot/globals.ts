import type PQueue from 'p-queue';

const queues: {
  meetings: Record<string, PQueue>;
} = { meetings: {} };

export { queues };
