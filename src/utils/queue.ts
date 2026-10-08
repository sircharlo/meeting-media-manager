import type PQueue from 'p-queue';

export const createQueue = async (concurrency: number): Promise<PQueue> => {
  const { default: PQueue } = await import('p-queue');
  return new PQueue({ concurrency });
};
