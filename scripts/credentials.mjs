#!/usr/bin/env node
// Issue and verify signed cAIge credentials (Ed25519).
//
//   node scripts/credentials.mjs keygen --out <dir outside this repo> --kid 2026-1
//   node scripts/credentials.mjs issue --key <private.pem> --kid 2026-1 --name "Ada Lovelace" \
//        --credential "cAIge Associate" --id CAIGE-A-2026-0001 [--expires 2028-10-14]
//   node scripts/credentials.mjs verify <verification URL or token>
//
// A credential is a JSON string signed as-is (no re-serialization), so the
// verifier checks exactly the bytes that were signed. The verification token is
// base64url(JSON({credential, signature})) and travels in the URL fragment, so
// it is never sent to the web server.
import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, realpathSync, existsSync } from 'node:fs';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(fileURLToPath(new URL('..', import.meta.url)));
const ISSUER = join(REPO, 'public/credentials/issuer.json');
const REVOKED = join(REPO, 'public/credentials/revoked.json');
const VERIFY_URL = 'https://caige.org/verify#';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => Buffer.from(s, 'base64url');

function args(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

function insideRepo(path) {
  const rel = relative(REPO, resolve(path));
  return !rel.startsWith('..') && !isAbsolute(rel);
}

export function issueToken(privateKeyPem, fields) {
  const credential = JSON.stringify({ v: 1, issuer: 'caige.org', ...fields });
  const signature = sign(null, Buffer.from(credential, 'utf8'), createPrivateKey(privateKeyPem));
  return b64url(JSON.stringify({ credential, signature: b64url(signature) }));
}

export function verifyToken(token, issuer, revoked, now = new Date()) {
  let envelope, cred;
  try {
    envelope = JSON.parse(fromB64url(token.replace(/^.*#/, '')).toString('utf8'));
    cred = JSON.parse(envelope.credential);
  } catch {
    return { ok: false, reason: 'malformed credential' };
  }
  const key = (issuer.keys || []).find((k) => k.kid === cred.kid);
  if (!key) return { ok: false, reason: `unknown signing key ${cred.kid}` };
  const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: key.publicKey }, format: 'jwk' });
  if (!verify(null, Buffer.from(envelope.credential, 'utf8'), publicKey, fromB64url(envelope.signature))) {
    return { ok: false, reason: 'signature does not match', credential: cred };
  }
  if ((revoked.revoked || []).some((r) => r.id === cred.id)) return { ok: false, reason: 'revoked', credential: cred };
  if (cred.expires && new Date(cred.expires) < now) return { ok: false, reason: 'expired', credential: cred };
  if (key.notAfter && new Date(cred.issued) > new Date(key.notAfter)) return { ok: false, reason: 'issued after key retirement', credential: cred };
  return { ok: true, credential: cred };
}

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const a = args(rest);
  if (command === 'keygen') {
    if (!a.out || !a.kid) throw new Error('usage: keygen --out <dir outside the repo> --kid <key id>');
    if (insideRepo(a.out)) throw new Error('refusing to write a private key inside the repository');
    mkdirSync(a.out, { recursive: true });
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
    const file = join(a.out, `caige-${a.kid}.pem`);
    if (existsSync(file)) throw new Error(`${file} already exists`);
    writeFileSync(file, pem, { mode: 0o600 });
    const jwk = publicKey.export({ format: 'jwk' });
    console.log(`private key: ${file} (keep offline; never commit)`);
    console.log('add this entry to public/credentials/issuer.json "keys":');
    console.log(JSON.stringify({ kid: a.kid, alg: 'Ed25519', publicKey: jwk.x, notBefore: new Date().toISOString().slice(0, 10) }, null, 2));
  } else if (command === 'issue') {
    for (const k of ['key', 'kid', 'name', 'credential', 'id']) if (!a[k]) throw new Error(`issue requires --${k}`);
    if (insideRepo(realpathSync(a.key))) throw new Error('the private key must not live inside the repository');
    const issued = new Date().toISOString().slice(0, 10);
    const fields = { kid: a.kid, id: a.id, name: a.name, credential: a.credential, programVersion: '2.0', issued };
    if (a.expires) fields.expires = a.expires;
    const token = issueToken(readFileSync(a.key, 'utf8'), fields);
    const check = verifyToken(token, JSON.parse(readFileSync(ISSUER, 'utf8')), { revoked: [] });
    if (!check.ok) console.warn(`warning: does not verify against issuer.json yet (${check.reason}); publish the public key first`);
    console.log(VERIFY_URL + token);
  } else if (command === 'verify') {
    if (!a._[0]) throw new Error('usage: verify <url or token>');
    const result = verifyToken(a._[0], JSON.parse(readFileSync(ISSUER, 'utf8')), JSON.parse(readFileSync(REVOKED, 'utf8')));
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.ok ? 0 : 1);
  } else {
    console.error('commands: keygen | issue | verify');
    process.exit(2);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}
