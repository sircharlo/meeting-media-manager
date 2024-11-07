import type PQueue from 'p-queue';

import OBSWebSocket from 'obs-websocket-js';
const obsWebSocket = new OBSWebSocket();

const queues: {
  // downloads: Record<string, PQueue>;
  meetings: Record<string, PQueue>;
} = { /*downloads: {}, */ meetings: {} };

export { obsWebSocket, queues };
