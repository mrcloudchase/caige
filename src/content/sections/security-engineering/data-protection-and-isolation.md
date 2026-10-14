---
id: "3.5"
title: "Data Protection and Isolation"
slug: data-protection-and-isolation
module: security-engineering
sectionOrder: 5
description: "Keeping each caller's context limited to what that caller may see: retrieval-time authorization, tenant and session isolation, PII detection and handling, keyed pseudonymization, minimization, privacy-preserving logs, and memory stores."
category: security
controlLayers: [deterministic, runtime-ml]
knowledge:
  - "Retrieval authorization belongs inside the search query, built from the caller's authenticated identity, so unauthorized chunks never become candidates; post-retrieval checks are a second layer, not the primary one."
  - "Tenant and session isolation fail through shared caches, shared indexes without enforced filters, and memory stores keyed on anything other than the verified principal."
  - "PII detection combines regex with validation (checksums, context), NER for unstructured identifiers, and purpose-built detector frameworks; all have false negatives."
  - "Redaction removes a value, masking hides part of it, tokenization replaces it with a reversible token held in a vault, and keyed HMAC produces a stable pseudonym; pseudonymized data is still personal data under GDPR."
  - "Logs should record PII types, counts, and keyed pseudonyms, never matched values."
  - "Regulatory scope differs: GDPR has six lawful bases, CCPA counts IP addresses as personal information, and HIPAA's 18 identifiers define the Safe Harbor de-identification method."
skills:
  - "Implement retrieval with an authorization filter built from a verified principal."
  - "Implement PII detectors whose validation runs before any match is emitted."
  - "Design a redaction, masking, or tokenization strategy per data type and destination."
  - "Implement keyed pseudonymization and privacy-preserving logging."
  - "Design per-user memory stores with provenance and deletion."
sources:
  - title: "OWASP Top 10 for LLM Applications 2025: LLM08 Vector and Embedding Weaknesses"
    url: "https://genai.owasp.org/llmrisk/llm082025-vector-and-embedding-weaknesses/"
  - title: "OWASP Top 10 for LLM Applications 2025: LLM02 Sensitive Information Disclosure"
    url: "https://genai.owasp.org/llmrisk/llm022025-sensitive-information-disclosure/"
  - title: "OpenAI (2023), March 20 ChatGPT outage: Here's what happened"
    url: "https://openai.com/index/march-20-chatgpt-outage/"
  - title: "Help Net Security (2023), A bug revealed ChatGPT users' chat history, personal and billing data"
    url: "https://www.helpnetsecurity.com/2023/03/27/chatgpt-data-leak/"
  - title: "Presidio: data protection and de-identification SDK"
    url: "https://presidio.dataprivacystack.org/"
  - title: "GDPR Article 4: Definitions (personal data, pseudonymisation)"
    url: "https://gdpr-info.eu/art-4-gdpr/"
  - title: "GDPR Article 6: Lawfulness of processing"
    url: "https://gdpr-info.eu/art-6-gdpr/"
  - title: "GDPR Recital 26: Not applicable to anonymous data"
    url: "https://gdpr-info.eu/recitals/no-26/"
  - title: "California Consumer Privacy Act (Civil Code 1798.140, definitions), as published by the CPPA"
    url: "https://cppa.ca.gov/regulations/pdf/ccpa_statute.pdf"
  - title: "Inside Privacy (2012), HHS Releases Guidance on HIPAA De-Identification Standard"
    url: "https://www.insideprivacy.com/health-privacy/hhs-releases-guidance-on-hipaa-de-identification-standard/"
lastReviewed: "2026-10-14"
---

# 3.5 Data Protection and Isolation

## The problem

On March 20, 2023, some ChatGPT users saw the titles of other users' conversations in their sidebar. OpenAI took the service offline and later found that the same bug had shown some ChatGPT Plus subscribers another user's name, email address, payment address, card type, last four card digits, and card expiry date, during a window of about nine hours; OpenAI notified 1.2% of Plus subscribers. The cause was in redis-py, the open-source Redis client: a request cancelled at the wrong moment left its connection holding a response that the next, unrelated request then read ([incident](/incidents/chatgpt-redis-cache-leak)).

No model was involved in the failure. A shared component returned one user's data to another, and nothing checked that the data belonged to the caller. AI systems add more places for that to happen: vector indexes shared across tenants, conversation memory, prompt caches, retrieved chunks that include data the user should not see, and logs full of prompts. This section is about keeping each caller's context limited to what that caller is entitled to, and about handling personal data that does legitimately flow through.

## Why it happens

**Retrieval ignores identity.** Vector search finds the most similar chunks. Similarity says nothing about authorization. If the index holds HR documents and engineering docs, an engineer's question about "compensation bands" retrieves HR chunks unless the query excludes them. The model then summarizes them, and the leak is invisible: the user never asked for a document by name.

**Filtering in the wrong place.** Retrieving the top 10 and then dropping unauthorized ones looks safe but fails in two ways: an attacker can still probe which documents exist from result counts or timing, and if all top results are unauthorized the user gets nothing relevant, which pushes teams to raise `top_k` or remove the check.

**Identity from the wrong source.** A tenant ID taken from the request body, a header the client sets, or the model's tool arguments is attacker-controlled. Only identity derived from a verified token is trustworthy.

**Shared state.** Caches, connection pools, prompt caches, and memory stores keyed on something other than the verified principal can return one user's data to another, as in the ChatGPT incident.

**Personal data in transit and at rest.** Users paste personal data into prompts. Retrieved documents contain it. Models repeat it. Logs keep it. Each copy is a liability and, in many jurisdictions, a regulated processing activity.

## Control patterns

| Control | Layer | Bounds |
|---|---|---|
| Authorization filter inside the retrieval query | deterministic | What can enter the context at all |
| Per-tenant index or namespace, or enforced row-level filter | deterministic | Cross-tenant leakage |
| Cache, memory, and session keys derived from the verified principal, with ownership checked on read | deterministic | Cross-session leakage |
| Data minimization: send only the fields the task needs | deterministic | How much is exposed if anything else fails |
| PII detection and redaction, masking, or tokenization | runtime-ml and deterministic | Personal data reaching the model, logs, or other users |
| Keyed pseudonymization in logs and analytics | deterministic | Re-identification from operational data |

### Retrieval-time authorization

Tag every chunk at ingestion with access metadata inherited from its source document: tenant, groups or roles allowed, classification. If a document has sections with different permissions, chunk along those boundaries and label each chunk separately. At query time, build the filter from the caller's authenticated identity and pass it to the vector store as part of the search, so the similarity search only considers authorized chunks (OWASP LLM08:2025 recommends permission-aware vector stores for exactly this reason).

```text
user query + verified token
        |
        v
build filter from principal: tenant_id = T AND allowed_groups overlaps G
        |
        v
vector search(query embedding, filter)   <- authorization applied here
        |
        v
(optional) post-check each chunk against the source system's ACL
        |
        v
relevance threshold / rerank -> context
```

The optional post-check catches stale labels, for example a document whose permissions changed after it was indexed. Re-index on permission change events so labels do not stay stale.

Similarity thresholds belong after authorization and are a quality control, not a security one. The right cutoff depends on the embedding model and the corpus; a cosine value that is strict for one model admits noise for another. Calibrate on labeled queries for your model.

### Tenant and session isolation

- **Separate indexes or namespaces per tenant** give the strongest isolation and simplest audits. A shared index with a tenant filter is acceptable if the filter is added by the retrieval layer from the verified principal, and no code path can query without it.
- **Caches** (response caches, semantic caches, prompt caches) must include the principal or tenant in the key, and a semantic cache must never return one user's answer to another user's similar question if the answer drew on private data.
- **Ownership checks on read**: after fetching a conversation, memory, or file by ID, check that its owner equals the caller. This is the check that would have caught a misrouted cache response.

### Memory stores

Long-term memory is a database the model writes to. Key it by the verified user, record provenance (which conversation, which source, whether the content came from untrusted input), allow users to view and delete it, and treat what is read back as untrusted: memory written during a session that read a poisoned document can carry the injection forward (Domain 5, section 5.7).

### PII detection

Three families of detectors, which you combine:

1. **Regex with validation** for structured identifiers: payment card numbers (with the Luhn checksum), US Social Security numbers (with invalid-range exclusions), email addresses, phone numbers. Validation must run before a match is emitted. A pattern for dates only indicates a date of birth when context (for example "DOB" or "born") says so.
2. **Named-entity recognition (NER)** for unstructured identifiers: person names, locations, street addresses. Use the character offsets the model returns against the original text. Organization names are not personal data and should not be redacted as such.
3. **Purpose-built detector frameworks** combine many recognizers, context words, checksums, and NER behind one interface, with support for multiple languages. Microsoft Presidio is an open-source example; its documentation states that there is no guarantee it will find all sensitive information. Treat any detector, including commercial ones, as reducing exposure, not eliminating it.

### Handling detected PII

| Technique | What it does | Reversible | Use when |
|---|---|---|---|
| Redaction | Replace with a type label: `[EMAIL]` | No | The model does not need the value. |
| Masking | Hide part: `************4242` | No | A human needs to recognize the value. |
| Tokenization | Replace with a random token; the original is stored in a vault with access control | Yes, by the vault | A downstream step must restore the value (for example, filling a form after the model drafts it). |
| Keyed pseudonymization (HMAC) | Replace with `HMAC(key, value)`: stable, not reversible without the key and a candidate value | No (but linkable) | Joining records in logs or analytics without storing the value. |

Use a keyed HMAC, not a plain hash. An unkeyed SHA-256 of an email address or phone number can be reversed by hashing candidate values, because the input space is small. Even keyed pseudonyms are still personal data under GDPR when the controller (or someone else) can link them back to a person with additional information (Recital 26). Pseudonymization reduces risk; it does not take data out of scope.

### Minimization and logging

Minimization is the strongest privacy control because data never sent cannot leak. Retrieve the fields the task needs, not the whole customer record. Summarize or aggregate before sending.

Logs should record what was detected (type and count), a keyed pseudonym of the user, and the decision taken. Never put the matched value in a log line, including in "reason" fields such as `"blocked: found SSN 123-45-6789"`.

### Regulatory scope (as of 2026)

| Regime | What matters for a guardrail engineer |
|---|---|
| GDPR (EU) | Personal data is any information relating to an identifiable person, which includes online identifiers. Processing needs one of six lawful bases in Article 6(1): consent, contract, legal obligation, vital interests, public interest, or legitimate interests. Consent is one option, not a universal requirement. |
| CCPA/CPRA (California) | The statutory definition of personal information lists Internet Protocol addresses among identifiers. Do not treat IP addresses as non-personal for California users. |
| HIPAA (US health) | The 18 identifiers are the list removed under the Safe Harbor method of de-identification; Expert Determination is the alternative method. They do not define the full scope of protected health information. |

Involve your privacy counsel for decisions; this table is orientation, not legal advice.

## Implementation

### Retrieval with authorization in the query

```python
def retrieve(query: str, principal, index, embed, top_k: int = 8) -> list:
    """principal comes from a verified token, never from request fields
    or from the model's tool arguments."""
    acl_filter = {
        "tenant_id": {"$eq": principal.tenant_id},
        "allowed_groups": {"$in": sorted(principal.groups)},
    }
    return index.search(vector=embed(query), top_k=top_k, filter=acl_filter)
```

The filter syntax varies by vector store; the property that matters is that the store applies it during the search, not your code after it.

### Validated PII detectors

```python
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Finding:
    kind: str
    start: int
    end: int
    # Deliberately no field for the matched text.


def _luhn_ok(digits: str) -> bool:
    total = 0
    for i, ch in enumerate(reversed(digits)):
        d = int(ch)
        if i % 2 == 1:
            d *= 2
            if d > 9:
                d -= 9
        total += d
    return total % 10 == 0


# 13-19 digits, optionally separated by single spaces or dashes.
# Covers 15-digit American Express and 16-digit Visa/Mastercard.
_CARD = re.compile(r"(?<!\d)\d(?:[ -]?\d){12,18}(?!\d)")
_SSN = re.compile(r"(?<!\d)(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}(?!\d)")
_EMAIL = re.compile(r"(?<![\w.+-])[\w.+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
# (?<!\w) instead of \b: \b before "(" never matches after a space.
_PHONE_US = re.compile(r"(?<!\w)(?:\+1[ .-]?)?(?:\(\d{3}\)|\d{3})[ .-]?\d{3}[ .-]?\d{4}(?!\d)")
# Dates count as DOB only when a context keyword precedes them.
_DOB = re.compile(
    r"(?i)\b(?:dob|d\.o\.b\.|date of birth|born(?: on)?)\b[\s:]*"
    r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})"
)


def detect_structured(text: str) -> list[Finding]:
    findings = []
    for m in _CARD.finditer(text):
        digits = re.sub(r"\D", "", m.group())
        if 13 <= len(digits) <= 19 and _luhn_ok(digits):   # validate BEFORE emitting
            findings.append(Finding("CREDIT_CARD", m.start(), m.end()))
    for kind, pattern in (("US_SSN", _SSN), ("EMAIL", _EMAIL), ("PHONE_US", _PHONE_US)):
        findings.extend(Finding(kind, m.start(), m.end()) for m in pattern.finditer(text))
    findings.extend(Finding("DATE_OF_BIRTH", m.start(1), m.end(1)) for m in _DOB.finditer(text))
    return findings


PII_ENTITY_LABELS = {"PER": "PERSON", "LOC": "LOCATION"}  # ORG is not personal data


def detect_entities(text: str, ner, min_score: float = 0.80) -> list[Finding]:
    """`ner` returns spans with character offsets into `text`
    (entity_group, start, end, score). Use text[start:end] if you need the
    surface string; subword token text does not match the original."""
    out = []
    for ent in ner(text):
        kind = PII_ENTITY_LABELS.get(ent["entity_group"])
        if kind and ent["score"] >= min_score:
            out.append(Finding(kind, ent["start"], ent["end"]))
    return out
```

A 10-digit order number matches `_PHONE_US`, and a valid-Luhn product code can match `_CARD`. Measure false positives on your own traffic before redacting aggressively, and tune with context words, as purpose-built frameworks do.

### Redaction and keyed pseudonyms

```python
import hashlib
import hmac


def redact(text: str, findings: list[Finding]) -> str:
    """Replace spans with type labels. Overlapping spans are merged."""
    spans = sorted(findings, key=lambda f: (f.start, -f.end))
    merged: list[Finding] = []
    for f in spans:
        if merged and f.start < merged[-1].end:
            last = merged[-1]
            if f.end > last.end:
                merged[-1] = Finding(last.kind, last.start, f.end)
            continue
        merged.append(f)
    out = text
    for f in reversed(merged):
        out = out[:f.start] + f"[{f.kind}]" + out[f.end:]
    return out


def mask_card(digits: str) -> str:
    """'4242424242424242' -> '************4242'."""
    return "*" * (len(digits) - 4) + digits[-4:]


def pseudonym(value: str, key: bytes, kind: str) -> str:
    """Stable keyed pseudonym. The key lives in a secrets manager and is
    rotated on a schedule; without it, candidate values cannot be tested."""
    normalized = value.strip().lower() if kind == "EMAIL" else value.strip()
    mac = hmac.new(key, f"{kind}:{normalized}".encode(), hashlib.sha256).hexdigest()
    return f"{kind}_{mac[:32]}"
```

### Privacy-preserving logging

```python
import json
import logging
import time
from collections import Counter

log = logging.getLogger("guardrails.pii")


def log_pii_decision(user_id: str, findings: list[Finding], action: str, key: bytes) -> None:
    counts = Counter(f.kind for f in findings)
    log.info(json.dumps({
        "ts": time.time(),
        "user": pseudonym(user_id, key, "USER"),
        "pii_counts": dict(counts),   # e.g. {"EMAIL": 2, "US_SSN": 1}
        "action": action,             # e.g. "redacted_before_model"
        # No matched values, no surrounding text, no raw prompt.
    }))
```

## Where it breaks

- **Retrieval filters** are only as correct as the labels. Documents ingested without ACLs, permissions that change without re-indexing, and chunks that merge sections with different permissions all leak. Any code path that queries the index without the filter (an admin tool, a batch job reused for chat) bypasses it.
- **Isolation** fails in components you do not think of as data stores: connection pools, prompt caches, semantic caches, and observability tools that store full prompts.
- **Regex detectors** miss formats you did not anticipate (international phone numbers, card numbers split across lines, values spelled out in words) and flag look-alikes.
- **NER** misses rare names, names in other languages, and names in lowercase or unusual context, and its accuracy varies by domain. It can also mislabel common words as names.
- **Redaction before the model** can break the task (the model cannot draft a letter to `[PERSON]`). Tokenization with restoration after the model solves that but puts the vault in the trust boundary.
- **Pseudonyms** are linkable by design. Anyone with the key and a list of candidate values can re-identify; combining several pseudonymized fields can re-identify without the key.
- **Model memorization**: data in fine-tuning sets can be reproduced verbatim. Minimize and redact before training, not only before inference.

## Lab exercise

In [Lab 3: Security Hardening](/labs/lab-3-security-hardening), Task 3.5 has you show that the lab agent's retrieval returns another tenant's document, move the authorization filter into the search query using the verified principal, and add validated PII detection and HMAC-pseudonymized logging to its request path.

## Check your understanding

1. A RAG service retrieves the top 20 chunks and then drops any the user is not allowed to see. Name two problems with this design.
2. A logging pipeline replaces email addresses with `sha256(email)[:12]`. What is wrong, and what should it use?
3. Your detector found "Acme Corporation" and "Jane Diaz" in a support ticket. Which should be redacted as personal data?
4. A credit card regex emits matches, and a later step runs Luhn validation on the emitted list for metrics. Why does the validation have no effect on what gets redacted?

<details>
<summary>Answers</summary>

1. Unauthorized chunks are still candidates, so authorization depends on post-filter code that can be skipped or buggy, and existence of restricted documents can leak through counts or timing. Relevant authorized chunks are also crowded out of the top 20. Put the filter into the search query.
2. An unkeyed hash of a low-entropy value can be reversed by hashing candidate emails, and truncation adds collisions without adding secrecy. Use a keyed HMAC with a managed key, and treat the result as still personal data.
3. Jane Diaz. An organization name is not personal data on its own.
4. Redaction acts on the emitted matches; validation that runs after emission (or only for metrics) does not remove false matches or change redaction. Validation must gate the emission of each finding.

</details>
