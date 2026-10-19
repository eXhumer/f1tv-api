import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { MockAgent } from 'undici';
import { vi } from 'vitest';

import { F1TVClient, type F1TVClientOptions } from '../src/client';

export const ORIGIN = 'https://f1tv.formula1.com';
export const JWKS_URL = 'https://api.formula1.com/static/jwks.json';

/** The parts of `/config` the client reads. */
export const CONFIG = {
  apiConfig: { playAPIVersion: '2.0', videoAPIVersion: '3.0' },
  bitmovin: { playProgressCapture: { enabled: true, interval: 60_000, minResumeSeconds: 30 } },
};

export const location = (entitlement = 'REGISTERED', groupId = 14) => ({
  resultObj: { userLocation: [{ entitlement, groupId }] },
});

/** A request the fake F1TV answered. Header names are lower-cased. */
export interface SeenRequest {
  readonly method: string;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly body: string | undefined;
}

/**
 * F1TV's API on an undici MockAgent. Each `on()` answers one request whose
 * path (without the query) matches, and records it in `seen`, so tests can
 * check the full path, query, headers and body the client sent.
 */
export class FakeF1TV {
  readonly agent = new MockAgent();
  readonly seen: SeenRequest[] = [];
  readonly #pool;

  constructor() {
    this.agent.disableNetConnect();
    this.#pool = this.agent.get(ORIGIN);
  }

  on(method: string, pathname: string, statusCode: number, data: object | string): this {
    this.#pool.intercept({ method, path: (path) => path.split('?')[0] === pathname }).reply((options) => {
      const headers = options.headers instanceof Headers ? Object.fromEntries(options.headers) : (options.headers ?? {});
      this.seen.push({
        method: options.method,
        path: options.path,
        headers: Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(value)])),
        body: typeof options.body === 'string' ? options.body : undefined,
      });
      return { statusCode, data };
    });
    return this;
  }

  /** The last request to `pathname`. */
  last(pathname: string): SeenRequest {
    const request = [...this.seen].reverse().find((seen) => seen.path.split('?')[0] === pathname);
    if (!request) throw new Error(`No request to ${pathname}`);
    return request;
  }

  /** Throws if an answer set up with `on()` was never asked for. */
  done(): void {
    this.agent.assertNoPendingInterceptors();
  }
}

export const ANON_LOCATION = '/1.0/A/ENG/WEB_DASH/ALL/USER/LOCATION';
export const USER_LOCATION = '/1.0/R/ENG/WEB_DASH/ALL/USER/LOCATION';
export const ENTITLEMENT = '/2.0/R/ENG/WEB_DASH/ALL/USER/ENTITLEMENT';

/** A client created against a fake F1TV that has answered `/config` and the anonymous location. */
export async function anonymousClient(
  options: F1TVClientOptions = {},
  { config = CONFIG as object, anonLocation = location() as object } = {},
) {
  const server = new FakeF1TV().on('GET', '/config', 200, config).on('GET', ANON_LOCATION, 200, anonLocation);
  const client = await F1TVClient.create({ dispatcher: server.agent, ...options });
  return { client, server };
}

/** A client logged in with a valid token, its location PREMIUM unless given. */
export async function loggedInClient(
  options: F1TVClientOptions = {},
  { config = CONFIG as object, userLocation = location('PREMIUM') as object } = {},
) {
  const server = new FakeF1TV()
    .on('GET', '/config', 200, config)
    .on('GET', ANON_LOCATION, 200, location())
    .on('GET', ENTITLEMENT, 200, { resultObj: { entitlementToken: 'entitlement-token' } })
    .on('GET', USER_LOCATION, 200, userLocation);
  const ascendon = await signToken();
  const client = await F1TVClient.create({ dispatcher: server.agent, ascendon, ...options });
  return { client, server, ascendon };
}

/**
 * A client made without create(), so with no config or location loaded. The
 * constructor is private to steer callers to create(); tests use it to reach
 * the guards for a client that has not loaded them.
 */
export function bareClient(options: F1TVClientOptions = {}): F1TVClient {
  return new (F1TVClient as unknown as new (options: F1TVClientOptions) => F1TVClient)(options);
}

const { publicKey, privateKey } = await generateKeyPair('RS256');
const otherKey = (await generateKeyPair('RS256')).privateKey;
const jwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'RS256' };

/**
 * An ascendon token signed like F1's, with the key `serveJwks()` publishes
 * (or another one). `kid: null` leaves the key ID out of the header.
 */
export function signToken({ kid = 'test-key' as string | null, wrongKey = false, claims = {} } = {}): Promise<string> {
  return new SignJWT({ SubscriberId: '1234', FirstName: 'Max', SubscribedProduct: 'F1 TV Premium', ...claims })
    .setProtectedHeader(kid ? { alg: 'RS256', kid } : { alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(wrongKey ? otherKey : privateKey);
}

/** Answers jose's JWKS request with the test key instead of F1's. */
export function serveJwks() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== JWKS_URL) throw new Error(`Unexpected fetch of ${url}`);
    return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'content-type': 'application/json' } });
  });
}
