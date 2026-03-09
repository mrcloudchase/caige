---
title: "PII and Sensitive Data Handling"
slug: "pii-handling"
module: "guardrail-implementation"
moduleOrder: 3
sectionOrder: 3
description: "Section 3 of the guardrail implementation module."
---

Protecting personally identifiable information is one of the most common guardrail requirements across industries.

![PII detection and handling pipeline](/svg/pii-handling-pipeline.svg)

### 3.3.1 PII Categories and Sensitivity Levels

Not all PII is equally sensitive. A practical classification:

| Sensitivity | Examples | Guardrail Response |
|---|---|---|
| High | SSN, credit card, passwords, medical records | Block or redact immediately, alert |
| Medium | Full name + DOB, email, phone, address | Redact in most contexts |
| Low | First name alone, job title, company name | Allow unless combined with other PII |

**High sensitivity (immediate harm if exposed):**
- Social Security Numbers / National ID numbers
- Financial account numbers (credit cards, bank accounts)
- Medical record numbers and health information
- Passwords, API keys, and authentication credentials
- Biometric data

**Medium sensitivity (potential harm if exposed):**
- Full name combined with other identifiers
- Date of birth
- Physical address
- Phone number
- Email address
- Employment information

**Low sensitivity (minimal direct harm):**
- First name only
- City/state (without street address)
- Job title without company
- General age range

The sensitivity level determines the guardrail response:
- High: Block or redact immediately, log the event, potentially alert
- Medium: Redact in most contexts, may allow in specific authorized contexts
- Low: May not require redaction depending on use case

### 3.3.2 Detection Methods

**Regex-based detection:**
Best for structured PII with predictable patterns:
```
# Credit card (major formats)
/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|
  3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|
  (?:2131|1800|35\d{3})\d{11})\b/

# Email
/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
```

Advantages: Fast, deterministic, high precision for well-defined formats
Disadvantages: Cannot detect unstructured PII (names, addresses in free text)

**Named Entity Recognition (NER):**
ML models trained to identify entities in text:
- PERSON: "John Smith"
- LOCATION: "123 Main Street, Springfield, IL"
- ORGANIZATION: "Acme Corporation"
- DATE: "March 7, 1990" (potential date of birth)

Advantages: Detects unstructured PII, handles variation in formatting
Disadvantages: Not 100% accurate, may miss unusual names or formats, requires model hosting

**Purpose-built PII detectors:**
Services and libraries specifically designed for PII detection across multiple categories:
- Combine regex, NER, and contextual analysis
- Often include confidence scores per detection
- Support for multiple languages and regional PII formats
- Usually the best choice for production PII guardrails

| Method | Speed | Accuracy | Handles Unstructured Text | Setup Effort |
|---|---|---|---|---|
| Regex patterns | Very fast | Low (structured PII only) | No | Low |
| NER models | Fast | Medium | Yes | Medium (needs training data) |
| Purpose-built PII detectors | Medium | High | Yes | Low (API/library) |

### 3.3.3 Handling Strategies

**Redaction** — Replace PII with a generic placeholder:
```
Input:  "My SSN is 123-45-6789 and I live at 456 Oak Ave"
Output: "My SSN is [SSN_REDACTED] and I live at [ADDRESS_REDACTED]"
```

**Masking** — Partially obscure PII:
```
Input:  "My email is john.smith@example.com"
Output: "My email is j***.s****@example.com"
```

**Tokenization** — Replace PII with a reversible token stored in a secure vault:
```
Input:  "Patient: Jane Doe, DOB: 03/15/1985"
Output: "Patient: [TOKEN_A7B3], DOB: [TOKEN_C9D1]"
Vault:  TOKEN_A7B3 → "Jane Doe", TOKEN_C9D1 → "03/15/1985"
```

**Data minimization** — The most effective strategy. Don't send PII to the model in the first place:
- Strip PII from user input before sending to the model
- Use references instead of values ("customer #12345" instead of "John Smith")
- Only include PII in the prompt when the model absolutely needs it to answer
- If the model needs a name, consider using a pseudonym and mapping back after

### 3.3.4 PII in Logging

Logging is a major PII risk area:

**Never log:**
- Raw user inputs that may contain PII
- Full model outputs that may contain generated PII
- Request/response bodies from PII-containing API calls

**Safe to log:**
- Hashed or tokenized versions of inputs
- Whether PII was detected and what type (without the actual values)
- Redacted versions where PII is replaced with category labels
- Aggregate PII detection metrics (count of PII detected, not the PII itself)

**Log architecture for PII safety:**
```
User Request
    |
    v
[PII Scanner] → Detects PII, creates PII-free version
    |
    ├── PII-free version → Normal logging pipeline
    └── PII metadata (types detected, count) → Security logging pipeline
```

### 3.3.5 Regional Considerations

PII definitions vary by jurisdiction:
- **EU (GDPR):** Broad definition including IP addresses, cookie IDs, location data
- **US (varies by state):** California (CCPA) has broader definitions than federal standards
- **Healthcare (HIPAA):** 18 specific identifier categories for Protected Health Information
- **Financial (PCI DSS):** Specific requirements for cardholder data

Your PII detection pipeline must be configured for the jurisdictions your application serves.

---
