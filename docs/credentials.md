# Issuing cAIge credentials

cAIge credentials are signed with Ed25519 and verified in the browser at [caige.org/verify](https://caige.org/verify), or offline with `node scripts/credentials.mjs verify`. There is no credential database. A credential is valid when:

- its signature matches a key in `public/credentials/issuer.json`;
- its ID is not in `public/credentials/revoked.json`;
- it has not expired.

## One-time setup (maintainer)

1. Generate a signing key on a trusted machine, outside the repository:

   ```bash
   node scripts/credentials.mjs keygen --out ~/caige-keys --kid 2026-1
   ```

   The script refuses to write a private key inside the repository. Store the private key offline, for example in a password manager or hardware-backed store, and restrict who can use it.

2. Add the printed public-key entry to `public/credentials/issuer.json` under `keys`. Commit and deploy.

## Issuing

```bash
node scripts/credentials.mjs issue --key ~/caige-keys/caige-2026-1.pem --kid 2026-1 \
  --name "Full Name" --credential "cAIge Associate" --id CAIGE-A-2026-0001 --expires 2028-10-14
```

The command prints a verification link. Send it to the holder, who can share it with anyone.

Use a unique, sequential `--id` per credential, and keep an issuance log outside the repository (who, when, which exam attempt). The log is how you revoke and audit.

## Revoking

Add `{"id": "CAIGE-A-2026-0001", "reason": "...", "date": "YYYY-MM-DD"}` to `public/credentials/revoked.json`, then commit and deploy.

## Rotating keys

1. Generate a new key with a new `--kid`.
2. Add it to `issuer.json`.
3. Set `notAfter` on the old key, so that credentials issued after that date with the old key fail.

Never remove an old key that still has valid credentials.
