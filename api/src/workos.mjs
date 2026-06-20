import 'dotenv/config';
import { WorkOS } from '@workos-inc/node';

export const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID;

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.WORKOS_API_KEY;
  if (!apiKey || !WORKOS_CLIENT_ID) {
    throw new Error('WorkOS not configured: set WORKOS_API_KEY and WORKOS_CLIENT_ID in .env');
  }
  _client = new WorkOS(apiKey);
  return _client;
}

// Lazy proxy: the SDK is only constructed on first use, so the server (and
// /health, the data layer, sockets) boots fine before WorkOS keys are added.
export const workos = new Proxy(
  {},
  {
    get(_t, prop) {
      const client = getClient();
      const value = client[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  }
);
