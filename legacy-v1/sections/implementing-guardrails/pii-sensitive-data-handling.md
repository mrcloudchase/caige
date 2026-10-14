---
title: "PII and Sensitive Data Handling"
slug: "pii-sensitive-data-handling"
module: "implementing-guardrails"
sectionOrder: 3
description: "Detecting, classifying, and protecting personally identifiable information in AI systems."
---

## Section 4.3: PII and Sensitive Data Handling

Of all the guardrail domains, PII handling carries the most immediate regulatory and legal weight. If your AI system leaks a social security number, exposes a medical record, or logs a credit card number — you do not just have a product quality problem. You have a compliance violation with real financial and legal consequences.

PII handling in AI systems is uniquely challenging because LLMs have multiple exposure surfaces. PII can appear in user prompts, in retrieved documents fed to the model, in the model's generated output (from memorized training data or repeated user input), and in application logs. A complete PII protection strategy must cover all four surfaces.

![PII handling pipeline showing detection, classification, and protection stages](/svg/pii-handling-pipeline.svg)

### PII Categories and Sensitivity Levels

Not all PII is equally sensitive. A person's name in a business context is very different from their social security number. Effective PII handling starts with a classification system that drives different handling strategies for different data types.

| Category | Examples | Sensitivity | Detection Method | Typical Handling |
|----------|----------|-------------|-----------------|-----------------|
| **Government IDs** | SSN, passport number, driver's license | Critical | Regex (structured format) | Redact — never pass to model |
| **Financial** | Credit card numbers, bank accounts, tax IDs | Critical | Regex + Luhn validation | Redact — never pass to model |
| **Health/Medical** | Diagnoses, medications, medical record numbers | Critical | NER + keyword detection | Redact unless medical context requires it |
| **Contact (direct)** | Email addresses, phone numbers, physical addresses | High | Regex (email, phone), NER (address) | Mask or redact depending on context |
| **Biometric** | Fingerprint templates, facial recognition data, voice prints | Critical | Format-specific detection | Never process through LLM |
| **Personal identifiers** | Full name, date of birth, age | Moderate | NER models | Mask or anonymize |
| **Employment** | Salary, employee ID, performance reviews | High | NER + context classification | Redact in cross-tenant contexts |
| **Online identifiers** | IP addresses, device IDs, session tokens | Moderate | Regex | Strip from model inputs |
| **Behavioral** | Purchase history, browsing patterns, location data | Moderate | Context-dependent | Minimize — send aggregates, not raw data |

### Detection Methods

PII detection uses a layered approach: regex for structured data with known formats, NER models for unstructured PII embedded in natural language, and purpose-built detectors that combine both.

**Regex for structured PII** — Formats like SSNs, credit cards, and emails have predictable patterns that regex catches reliably.

```python
import re
from dataclasses import dataclass

@dataclass
class PIIMatch:
    pii_type: str
    value: str
    start: int
    end: int
    confidence: float

PII_PATTERNS = {
    "ssn": {
        "pattern": r"\b(\d{3}-\d{2}-\d{4})\b",
        "confidence": 0.95,
    },
    "credit_card": {
        "pattern": r"\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b",
        "confidence": 0.90,
    },
    "email": {
        "pattern": r"\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b",
        "confidence": 0.95,
    },
    "phone_us": {
        "pattern": r"\b(\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b",
        "confidence": 0.85,
    },
    "ip_address": {
        "pattern": r"\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b",
        "confidence": 0.80,
    },
    "date_of_birth": {
        "pattern": r"\b((?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/(?:19|20)\d{2})\b",
        "confidence": 0.70,
    },
}

def detect_pii_regex(text: str) -> list[PIIMatch]:
    """Detect structured PII using regex patterns."""
    findings = []

    for pii_type, config in PII_PATTERNS.items():
        for match in re.finditer(config["pattern"], text):
            findings.append(PIIMatch(
                pii_type=pii_type,
                value=match.group(1),
                start=match.start(1),
                end=match.end(1),
                confidence=config["confidence"],
            ))

    return findings
```

**Luhn validation for credit cards** — A regex match on a 16-digit number is not enough. The Luhn algorithm validates whether the number is a plausible credit card, reducing false positives on random number sequences.

```python
def luhn_check(number: str) -> bool:
    """Validate a number using the Luhn algorithm."""
    digits = [int(d) for d in number if d.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False

    checksum = 0
    reverse_digits = digits[::-1]
    for i, digit in enumerate(reverse_digits):
        if i % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        checksum += digit

    return checksum % 10 == 0


def detect_credit_cards(text: str) -> list[PIIMatch]:
    """Detect credit card numbers with Luhn validation."""
    pattern = r"\b(\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4})\b"
    findings = []

    for match in re.finditer(pattern, text):
        number = match.group(1)
        digits_only = re.sub(r"[-\s]", "", number)
        if luhn_check(digits_only):
            findings.append(PIIMatch(
                pii_type="credit_card",
                value=number,
                start=match.start(1),
                end=match.end(1),
                confidence=0.98,
            ))

    return findings
```

**NER models for unstructured PII** — Names, addresses, and organization names do not follow fixed formats. Named Entity Recognition models trained on labeled text are necessary for detecting these.

```python
from transformers import pipeline

ner_pipeline = pipeline(
    "ner",
    model="dslim/bert-base-NER",
    aggregation_strategy="simple",
)

NER_TO_PII_TYPE = {
    "PER": "person_name",
    "LOC": "location",
    "ORG": "organization",
}

def detect_pii_ner(text: str, min_score: float = 0.7) -> list[PIIMatch]:
    """Detect unstructured PII using NER."""
    entities = ner_pipeline(text)
    findings = []

    for entity in entities:
        pii_type = NER_TO_PII_TYPE.get(entity["entity_group"])
        if pii_type and entity["score"] >= min_score:
            findings.append(PIIMatch(
                pii_type=pii_type,
                value=entity["word"],
                start=entity["start"],
                end=entity["end"],
                confidence=entity["score"],
            ))

    return findings
```

**Combined PII detection pipeline** — The most robust approach runs regex and NER in parallel and merges results.

```python
def detect_all_pii(text: str) -> list[PIIMatch]:
    """Run all PII detection methods and merge results."""
    regex_findings = detect_pii_regex(text)
    cc_findings = detect_credit_cards(text)
    ner_findings = detect_pii_ner(text)

    all_findings = regex_findings + cc_findings + ner_findings

    # Deduplicate overlapping matches, keeping highest confidence
    all_findings.sort(key=lambda f: (-f.confidence, f.start))
    deduplicated = []
    covered_ranges = []

    for finding in all_findings:
        overlaps = any(
            finding.start < end and finding.end > start
            for start, end in covered_ranges
        )
        if not overlaps:
            deduplicated.append(finding)
            covered_ranges.append((finding.start, finding.end))

    return deduplicated
```

> **Why this matters for guardrails:** No single detection method catches all PII. Regex misses names and addresses entirely. NER misses SSNs and credit cards. A production PII guardrail must combine both approaches and deduplicate their results — otherwise you have gaps that guarantee data leakage.

### Redaction vs. Masking vs. Tokenization

Once PII is detected, you have three strategies for protecting it. Each makes a different tradeoff between security and utility.

**Redaction** replaces PII with a type label. The original value is gone — it cannot be recovered.

```python
def redact_pii(text: str, findings: list[PIIMatch]) -> str:
    """Replace PII with type labels. Irreversible."""
    sorted_findings = sorted(findings, key=lambda f: f.start, reverse=True)
    result = text
    for finding in sorted_findings:
        replacement = f"[{finding.pii_type.upper()}]"
        result = result[:finding.start] + replacement + result[finding.end:]
    return result

# "Contact John Smith at john@example.com or 555-123-4567"
# becomes: "Contact [PERSON_NAME] at [EMAIL] or [PHONE_US]"
```

**Masking** partially obscures PII, preserving format but hiding the sensitive portion.

```python
def mask_pii(text: str, findings: list[PIIMatch]) -> str:
    """Partially mask PII values. Format preserved, content hidden."""
    sorted_findings = sorted(findings, key=lambda f: f.start, reverse=True)
    result = text

    for finding in sorted_findings:
        value = finding.value
        if finding.pii_type == "email":
            local, domain = value.split("@")
            masked = f"{local[0]}***@{domain}"
        elif finding.pii_type == "ssn":
            masked = f"***-**-{value[-4:]}"
        elif finding.pii_type == "credit_card":
            digits = re.sub(r"[-\s]", "", value)
            masked = f"****-****-****-{digits[-4:]}"
        elif finding.pii_type == "phone_us":
            masked = f"(***) ***-{value[-4:]}"
        else:
            masked = value[0] + "*" * (len(value) - 2) + value[-1]

        result = result[:finding.start] + masked + result[finding.end:]

    return result

# "Contact John Smith at john@example.com"
# becomes: "Contact J***h at j***@example.com"
```

**Tokenization** replaces PII with a reversible token. A mapping table allows the original value to be restored by authorized systems.

```python
import uuid

class PIITokenizer:
    """Replace PII with reversible tokens. Requires secure token store."""

    def __init__(self):
        self._token_map: dict[str, str] = {}
        self._reverse_map: dict[str, str] = {}

    def tokenize(self, text: str, findings: list[PIIMatch]) -> str:
        sorted_findings = sorted(findings, key=lambda f: f.start, reverse=True)
        result = text

        for finding in sorted_findings:
            if finding.value in self._token_map:
                token = self._token_map[finding.value]
            else:
                token = f"<TOK_{finding.pii_type.upper()}_{uuid.uuid4().hex[:8]}>"
                self._token_map[finding.value] = token
                self._reverse_map[token] = finding.value

            result = result[:finding.start] + token + result[finding.end:]

        return result

    def detokenize(self, text: str) -> str:
        result = text
        for token, original in self._reverse_map.items():
            result = result.replace(token, original)
        return result
```

| Strategy | Reversible | Preserves Format | Security Level | Use Case |
|----------|-----------|-----------------|----------------|----------|
| **Redaction** | No | No — replaces with label | Highest — data is destroyed | Logging, audit trails, low-trust environments |
| **Masking** | No | Partial — format hints remain | High — most data hidden | User-facing displays, partial verification |
| **Tokenization** | Yes | No — replaces with token | Medium — depends on token store security | When downstream processing needs original values later |

> **Why this matters for guardrails:** The choice between redaction, masking, and tokenization is not a technical decision — it is a business and compliance decision. Redaction is safest but loses information permanently. Tokenization preserves reversibility but requires securing the token store. Choose based on whether any downstream system legitimately needs the original PII value.

### Data Minimization in Prompts

The most effective PII protection is not detecting and redacting PII — it is never sending it to the model in the first place. Data minimization means designing your prompts and data flows so the model only receives the information it needs to answer the question.

```python
def minimize_prompt_data(user_query: str, user_context: dict) -> str:
    """Build a prompt with minimal PII exposure."""

    # Bad: sending the full user profile to the model
    # prompt = f"User profile: {json.dumps(user_context)}\n\nQuestion: {user_query}"

    # Good: send only what the model needs
    relevant_fields = {
        "account_type": user_context.get("account_type"),
        "subscription_tier": user_context.get("subscription_tier"),
        "region": user_context.get("region"),
    }

    prompt = (
        f"User context: account_type={relevant_fields['account_type']}, "
        f"tier={relevant_fields['subscription_tier']}, "
        f"region={relevant_fields['region']}\n\n"
        f"Question: {user_query}"
    )

    return prompt
```

Data minimization principles for AI systems:

1. **Never send PII unless the task requires it.** If a user asks "what's my billing cycle?" — the model needs account type, not the user's name, email, or SSN.
2. **Aggregate rather than enumerate.** Instead of sending ten transaction records, send a summary: "User has 10 transactions totaling $X in the last 30 days."
3. **Use references instead of values.** Pass `account_id=12345` instead of embedding account details in the prompt. The model can reference it without knowing the PII.
4. **Strip PII from retrieved documents** before injecting them into the context. RAG pipelines should run PII detection on retrieved chunks, not just on user input.

### Logging Considerations

Logging is the hidden PII exposure surface. Engineering teams build detailed logging for debugging and monitoring — and inadvertently create a second copy of every piece of PII that passes through the system.

**What to log:**

- Request IDs and timestamps
- Guardrail decisions (allow/block) and the reason
- Detection stage that triggered (rule, ML, LLM-judge)
- Confidence scores and thresholds
- Latency metrics
- Hashed input fingerprints (for deduplication, not content recovery)

**What to never log:**

- Raw user prompts (may contain PII)
- Raw model responses (may contain PII)
- PII values detected during scanning
- System prompt content (reveals guardrail logic)
- API keys, tokens, or credentials

```python
import hashlib

def create_safe_log_entry(
    request_id: str,
    guardrail_result: dict,
    pii_findings: list[PIIMatch],
) -> dict:
    """Create a log entry that captures decision data without PII."""
    return {
        "request_id": request_id,
        "timestamp": time.time(),
        "decision": guardrail_result["decision"],
        "stage": guardrail_result["stage"],
        "reason": guardrail_result["reason"],
        "confidence": guardrail_result["confidence"],
        "latency_ms": guardrail_result["latency_ms"],
        "pii_detected": len(pii_findings) > 0,
        "pii_types_found": list(set(f.pii_type for f in pii_findings)),
        "pii_count": len(pii_findings),
        # Hash for deduplication — NOT for content recovery
        "input_hash": hashlib.sha256(
            guardrail_result.get("input_text", "").encode()
        ).hexdigest()[:16],
    }
```

> **Why this matters for guardrails:** Your logging system is a guardrail surface you probably have not thought about. If your PII detection catches an SSN in a user prompt and your log records `"pii_value": "123-45-6789"` — you have just created a second copy of the PII in your log database, potentially with weaker access controls than the primary system.

### Regional and Regulatory Differences

PII definitions and handling requirements vary by jurisdiction. What counts as PII, what requires consent, and what must be deleted on request all depend on where your users are.

| Regulation | Jurisdiction | PII Scope | Key Requirements |
|-----------|-------------|-----------|-----------------|
| **GDPR** | EU/EEA | Broad — any data that can identify a person, directly or indirectly | Consent, right to erasure, data minimization, DPO requirement |
| **CCPA/CPRA** | California | Broad — includes household-level data and inferences | Opt-out of sale, right to delete, categories disclosed at collection |
| **HIPAA** | US (healthcare) | 18 specific identifiers when linked to health information | Minimum necessary standard, BAA requirements, breach notification |
| **PCI DSS** | Global (payment) | Cardholder data — PAN, cardholder name, expiration, service code | Encryption, access controls, never store CVV/PIN, quarterly scans |
| **LGPD** | Brazil | Similar to GDPR — any data related to an identified or identifiable person | Legal basis, DPO, cross-border transfer restrictions |
| **PIPEDA** | Canada | Personal information — any factual or subjective info about an identifiable individual | Consent, limited collection, retention limits |

The practical implication for guardrail engineering: your PII detection must be configurable per region. A system serving EU users under GDPR must treat IP addresses and cookie identifiers as personal data. The same system serving only US users under no specific regulation might treat those as non-PII. Build your PII detection with configurable sensitivity profiles.

```python
PII_PROFILES = {
    "gdpr_strict": {
        "detect": ["ssn", "credit_card", "email", "phone_us", "ip_address",
                    "person_name", "location", "date_of_birth", "organization"],
        "handle_as_critical": ["ssn", "credit_card", "date_of_birth"],
        "handle_as_high": ["email", "phone_us", "person_name", "ip_address"],
    },
    "us_general": {
        "detect": ["ssn", "credit_card", "email", "phone_us", "person_name"],
        "handle_as_critical": ["ssn", "credit_card"],
        "handle_as_high": ["email", "phone_us"],
    },
    "hipaa": {
        "detect": ["ssn", "credit_card", "email", "phone_us", "person_name",
                    "date_of_birth", "location", "ip_address", "medical_record"],
        "handle_as_critical": ["ssn", "credit_card", "medical_record",
                               "date_of_birth"],
        "handle_as_high": ["email", "phone_us", "person_name", "location",
                           "ip_address"],
    },
}
```

---
