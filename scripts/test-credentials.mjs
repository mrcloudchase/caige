// Round-trip tests for credential signing and verification.
import { generateKeyPairSync } from 'node:crypto';
import assert from 'node:assert/strict';
import { issueToken, verifyToken } from './credentials.mjs';

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const issuer = { keys: [{ kid: 't1', alg: 'Ed25519', publicKey: publicKey.export({ format: 'jwk' }).x }] };
const fields = { kid: 't1', id: 'CAIGE-A-TEST-0001', name: 'Test Person', credential: 'cAIge Associate', programVersion: '2.0', issued: '2026-10-14', expires: '2028-10-14' };
const token = issueToken(pem, fields);
const now = new Date('2027-01-01');

assert.equal(verifyToken(token, issuer, { revoked: [] }, now).ok, true, 'valid credential verifies');
assert.equal(verifyToken('https://caige.org/verify#' + token, issuer, { revoked: [] }, now).ok, true, 'URL form verifies');

const envelope = JSON.parse(Buffer.from(token, 'base64url').toString());
const tampered = Buffer.from(JSON.stringify({ ...envelope, credential: envelope.credential.replace('Test Person', 'Someone Else') })).toString('base64url');
assert.equal(verifyToken(tampered, issuer, { revoked: [] }, now).reason, 'signature does not match', 'edited name fails');

assert.equal(verifyToken(token, issuer, { revoked: [{ id: 'CAIGE-A-TEST-0001' }] }, now).reason, 'revoked');
assert.equal(verifyToken(token, issuer, { revoked: [] }, new Date('2029-01-01')).reason, 'expired');
assert.equal(verifyToken(token, { keys: [] }, { revoked: [] }, now).reason, 'unknown signing key t1');
assert.equal(verifyToken('not-a-token', issuer, { revoked: [] }, now).reason, 'malformed credential');

const other = generateKeyPairSync('ed25519');
const forged = issueToken(other.privateKey.export({ type: 'pkcs8', format: 'pem' }), fields);
assert.equal(verifyToken(forged, issuer, { revoked: [] }, now).reason, 'signature does not match', 'wrong key fails');

console.log('credentials: 8 checks passed');
