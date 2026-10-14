---
id: "4.3"
title: "Groundedness and Hallucination"
slug: groundedness-and-hallucination
module: safety-engineering
sectionOrder: 3
description: "Why models produce confident falsehoods, and the controls that reduce and contain them: grounding in retrieved sources, per-claim support checks and their input limits, deterministic citation verification, abstention, and handling for high-stakes domains."
category: safety
controlLayers: [deterministic, runtime-ml, human]
knowledge:
  - "Hallucination is a structural property of next-token prediction and of training and evaluation that reward guessing over abstaining; it can be reduced and contained, not switched off."
  - "Retrieval grounding helps only when the right source is retrieved and the model uses it; it fails when retrieval misses, sources conflict, or the model answers from its parameters anyway."
  - "Support checking extracts atomic claims and tests each against source text with an NLI model or a judge; NLI models have short input limits (often around 512 tokens), so sources must be chunked and checked per chunk with max aggregation."
  - "Citation verification is deterministic: a cited source ID must be in the retrieved set and a quoted span must appear in that source."
  - "Groundedness must be checked on the unredacted answer against the unredacted sources, before redaction and before presentation changes such as disclaimers."
  - "Abstention ('I don't know') must be designed in: a retrieval floor, a schema field for insufficient information, and a useful next step for the user."
skills:
  - "Implement per-claim, per-chunk support checking that handles empty inputs and enforces the checker's input limit."
  - "Implement deterministic citation verification for IDs and quoted spans."
  - "Order output checks so that groundedness, validation, redaction, and presentation do not interfere with each other."
  - "Design abstention behavior and escalation for high-stakes domains such as legal, medical, and policy answers."
sources:
  - title: "Kalai, Nachum, Vempala, Zhang (2025), Why Language Models Hallucinate"
    url: "https://arxiv.org/abs/2509.04664"
  - title: "Min et al. (2023), FActScore: Fine-grained Atomic Evaluation of Factual Precision in Long Form Text Generation"
    url: "https://arxiv.org/abs/2305.14251"
  - title: "Mata v. Avianca, Inc., No. 22-cv-1461 (PKC), Opinion and Order on Sanctions (S.D.N.Y. June 22, 2023)"
    url: "https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.54.0_1.pdf"
  - title: "McCarthy Tetrault (2024), Moffatt v. Air Canada: A Misrepresentation by an AI Chatbot"
    url: "https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot"
  - title: "The Markup (2024), NYC's AI Chatbot Tells Businesses to Break the Law"
    url: "https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law"
  - title: "OWASP Top 10 for LLM Applications 2025: LLM09 Misinformation"
    url: "https://genai.owasp.org/llmrisk/llm092025-misinformation/"
  - title: "Hugging Face model card: FacebookAI/roberta-large-mnli (example NLI model, 512-token maximum)"
    url: "https://huggingface.co/FacebookAI/roberta-large-mnli"
lastReviewed: "2026-10-14"
---

# 4.3 Groundedness and Hallucination

## The problem

On March 1, 2023, lawyers for the plaintiff in *Mata v. Avianca* filed a brief citing judicial decisions that did not exist, with invented quotations and citations. The citations came from ChatGPT. When one lawyer asked it whether a case was real, it said the case did exist and could be found on Westlaw and LexisNexis. On June 22, 2023, the court sanctioned the lawyers and their firm with a $5,000 penalty, noting that there is nothing inherently improper about using a reliable AI tool but that lawyers have a gatekeeping duty to ensure their filings are accurate ([Opinion and Order, S.D.N.Y. 2023](https://storage.courtlistener.com/recap/gov.uscourts.nysd.575368/gov.uscourts.nysd.575368.54.0_1.pdf)).

The same failure appears in customer-facing systems. In February 2024 a Canadian tribunal held Air Canada liable after its website chatbot told a customer he could claim a bereavement fare after travel, which contradicted the airline's own policy page; the tribunal rejected the argument that the chatbot was responsible for its own statements ([McCarthy Tetrault, 2024](https://www.mccarthy.ca/en/insights/blogs/techlex/moffatt-v-air-canada-misrepresentation-ai-chatbot)). In March 2024 *The Markup* found New York City's business-advice chatbot telling users that landlords could refuse housing vouchers and that employers could take a cut of workers' tips, both contrary to law ([The Markup, 2024](https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law)).

In each case, fluent and confident output was delivered without a check that it was supported by an authoritative source.

## Why it happens

A language model generates the next token from a distribution learned over its training data. Nothing in that process consults a store of facts. When the model has seen a fact many times, the likely continuation is usually right. When it has not, the likely continuation is something that looks like a right answer: a plausible case name, a plausible policy, a plausible statute.

Kalai and colleagues argue that this follows from ordinary statistical pressure in pretraining, and that it persists because post-training and common benchmarks reward a confident guess over "I don't know," the way a multiple-choice exam with no penalty for wrong answers rewards guessing ([Kalai et al., 2025](https://arxiv.org/abs/2509.04664)). The consequences for engineering are:

- Hallucination can be reduced, not switched off. A guardrail strategy that assumes the model will stop hallucinating with a better prompt will fail.
- The model's confidence is weak evidence. Asking the model whether its own answer is true, as the *Mata* lawyer did, gives you another sample from the same distribution.
- Retrieval-augmented generation (RAG) changes the odds, not the mechanism. The model still generates text; it now has relevant text in context. It can ignore that text, blend it with memorized material, misread it, or answer confidently when retrieval returned nothing useful.

Retrieval brings its own failures. The right document may not be retrieved, two sources may disagree, a source may be out of date, and a retrieved document may have been planted (covered as poisoning in [3.7 AI Supply Chain](/training/module/security-engineering/ai-supply-chain)).

## Control patterns

Ordered from strongest to weakest. Strong controls constrain what the system can say; weaker ones check what it said.

### 1. Answer from authoritative text, not from the model's paraphrase (deterministic)

For questions where the answer is a fixed fact the operator owns (refund rules, fees, eligibility, legal text), retrieve the canonical passage and show it, with a link, rather than letting the model restate it. The model can select which passage applies and summarize around it, but the user sees the authoritative wording. The Air Canada answer should have been a quotation of the bereavement policy page, not a generated summary of it.

### 2. Deterministic citation verification

Require structured output in which every factual statement carries citations (see [4.6](/training/module/safety-engineering/structured-output-enforcement)). Then check, in code:

- every cited source ID is in the set retrieved for this request (an ID the model invented fails), and
- every quoted span appears verbatim in the cited source after whitespace normalization.

These checks are cheap and exact. They catch invented citations, which is the *Mata* failure. They do not show that the cited source supports the claim; that needs pattern 3.

### 3. Per-claim support checking (runtime-ml)

Break the answer into atomic claims, then test each claim against the source text. This is the approach behind FActScore, which scores long-form text by the fraction of its atomic facts supported by a knowledge source ([Min et al., 2023](https://arxiv.org/abs/2305.14251)). Two checkers are common:

- **NLI models** classify a (premise, hypothesis) pair as entailment, neutral, or contradiction. They are fast and cheap. Many are encoder models with a maximum input around 512 tokens; for example, `roberta-large-mnli` declares a 512-token limit ([model card](https://huggingface.co/FacebookAI/roberta-large-mnli)). Concatenating all sources into one premise overflows that limit, and most tokenizers truncate silently, so the supporting passage may never be seen. Split sources into chunks that fit with the claim, score each (chunk, claim) pair, and take the **maximum** entailment score across chunks as the claim's support.
- **LLM judges** handle paraphrase, hedging, and numbers better and accept longer inputs, but cost more, vary between runs, and can be steered by text inside the sources. Use the injection-resistant judge pattern from [4.2](/training/module/safety-engineering/detection-and-classification), and do not use the generating model to judge its own answer.

Claim extraction is usually done by a model, so it can drop or merge claims. Spot-check extraction against human annotation as part of validating the checker ([6.3](/training/module/evaluation-and-red-teaming/validating-judges-and-classifiers)).

### 4. Designed abstention

Give the system ways to say it does not know, and make them the default when evidence is weak:

- A **retrieval floor**: if no retrieved passage scores above a relevance threshold, do not ask the model to answer. Return a message that says the information was not found and offers a next step (a link to the relevant page, a human contact).
- A **schema field** such as `"status": "insufficient_information"` that the model can choose, and that your evaluation rewards rather than penalizes.
- **Partial answers**: deliver the supported claims, remove the unsupported ones, and say what could not be confirmed.

### 5. High-stakes routing (human)

For legal, medical, financial, and policy answers that a user may act on, combine the patterns above with a stricter policy tier (see [4.1](/training/module/safety-engineering/content-policy-as-specification)): lower support thresholds for blocking, mandatory citations, abstention on any unsupported material claim, and escalation to a qualified person where the product allows it. OWASP's 2025 guidance on misinformation lists cross-verification, human oversight for critical information, and clear communication of limits among its mitigations ([LLM09:2025](https://genai.owasp.org/llmrisk/llm092025-misinformation/)).

### Ordering the output checks

Output checks interact. The order below avoids the common conflicts:

```text
model output (structured: answer, claims, citations)
  |
  v
[1] parse and validate against the schema (4.6) -------- invalid --> retry or fallback
  |
  v
[2] citation verification (IDs in retrieved set, quotes verbatim)
  |
  v
[3] support check: unredacted claims vs unredacted source chunks,
    inside the trusted boundary; log claim IDs and scores, not text
  |
  v
[4] decide: deliver / drop unsupported claims / abstain / escalate
  |
  v
[5] content-safety and policy checks on the final text (4.2)
  |
  v
[6] PII redaction (3.5) -- last transformation of the text
  |
  v
[7] render: disclaimers and source links added by the template, outside the JSON
```

Redacting before step 3 replaces names and numbers in the answer with placeholders that no source contains, so correct claims fail the support check. Adding a disclaimer by string concatenation before step 1 turns valid JSON into invalid JSON. Presentation belongs in the rendering template, as a separate field.

## Implementation

Chunking sources to fit the checker's input limit. `count_tokens` must use the checker's own tokenizer.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class Chunk:
    source_id: str
    text: str


def chunk_source(source_id: str, text: str, max_tokens: int, count_tokens, split_sentences) -> list[Chunk]:
    """Pack paragraphs (or sentences of oversized paragraphs) into chunks of at most max_tokens."""
    units: list[str] = []
    for para in (p.strip() for p in text.split("\n\n")):
        if not para:
            continue
        units.extend(split_sentences(para) if count_tokens(para) > max_tokens else [para])

    chunks, current = [], []
    for unit in units:
        if count_tokens(unit) > max_tokens:
            raise ValueError(f"{source_id}: a single sentence exceeds the checker limit")
        if current and count_tokens(" ".join(current + [unit])) > max_tokens:
            chunks.append(Chunk(source_id, " ".join(current)))
            current = []
        current.append(unit)
    if current:
        chunks.append(Chunk(source_id, " ".join(current)))
    return chunks
```

Set `max_tokens` to the model's limit minus the longest claim you will test and the model's special tokens. Raising on an oversized sentence is deliberate: silent truncation is the failure being avoided.

Per-claim, per-chunk support with max aggregation and explicit handling of empty inputs:

```python
@dataclass(frozen=True)
class ClaimResult:
    claim: str
    support: float          # max entailment probability over chunks
    best_source: str | None
    supported: bool


@dataclass(frozen=True)
class GroundednessReport:
    status: str             # "grounded" | "partially_grounded" | "ungrounded" | "no_claims" | "no_sources"
    claims: tuple[ClaimResult, ...]
    supported_fraction: float | None


def check_support(claims: list[str], chunks: list[Chunk], entail_prob, threshold: float) -> GroundednessReport:
    """entail_prob(premise, hypothesis) -> P(entailment); must raise if the pair exceeds the model limit."""
    if not claims:
        # Nothing checkable was extracted. Not evidence of grounding: route by policy.
        return GroundednessReport("no_claims", (), None)
    if not chunks:
        return GroundednessReport("no_sources", (), 0.0)

    results = []
    for claim in claims:
        best_score, best_source = 0.0, None
        for chunk in chunks:
            score = entail_prob(premise=chunk.text, hypothesis=claim)
            if score > best_score:
                best_score, best_source = score, chunk.source_id
        results.append(ClaimResult(claim, best_score, best_source, best_score >= threshold))

    n_supported = sum(r.supported for r in results)
    fraction = n_supported / len(results)  # len(results) == len(claims) > 0
    if n_supported == len(results):
        status = "grounded"
    elif n_supported == 0:
        status = "ungrounded"
    else:
        status = "partially_grounded"
    return GroundednessReport(status, tuple(results), fraction)
```

Checking every claim against every chunk costs claims times chunks calls. In practice, restrict each claim to the few chunks most similar to it, or to the chunks it cites, and accept that a claim whose support spans two chunks may score low under max aggregation. Route `no_claims` by policy: for a factual Q&A product it usually means the extractor failed or the answer is evasive, not that it is safe.

Deterministic citation verification:

```python
import re

_WS = re.compile(r"\s+")


def _norm(s: str) -> str:
    return _WS.sub(" ", s).strip().casefold()


def verify_citations(citations: list[dict], retrieved: dict[str, str]) -> list[str]:
    """Return problems; an empty list means every citation resolved and every quote was found."""
    problems = []
    for i, cit in enumerate(citations):
        source_id = cit.get("source_id")
        text = retrieved.get(source_id) if isinstance(source_id, str) else None
        if text is None:
            problems.append(f"citation {i}: source {source_id!r} was not retrieved for this request")
            continue
        quote = cit.get("quote")
        if quote is not None and _norm(quote) not in _norm(text):
            problems.append(f"citation {i}: quoted text not found in {source_id}")
    return problems
```

A retrieval floor that abstains before generation:

```python
def answer_or_abstain(question: str, retrieve, generate, min_relevance: float, fallback_link: str) -> dict:
    hits = [h for h in retrieve(question) if h.score >= min_relevance]
    if not hits:
        return {
            "status": "insufficient_information",
            "message": "I couldn't find this in our published information.",
            "next_step": fallback_link,
        }
    return generate(question, hits)
```

## Where it breaks

- **The source is wrong.** A support check measures agreement with the retrieved text. If the corpus is outdated, contradictory, or poisoned, a fully "grounded" answer is still wrong. Corpus ownership and freshness are part of the control.
- **Extraction misses claims.** If the claim extractor drops a sentence, that sentence is never checked. Implicit claims ("you are eligible") are easy to miss.
- **Max aggregation and multi-hop claims.** A claim that needs facts from two chunks may be supported by neither alone. Larger chunks help, up to the input limit; a judge with longer context helps more, at higher cost.
- **Paraphrase, numbers, and negation.** NLI models are weaker on arithmetic, dates, units, and negation. A claim that changes "within 90 days" to "after 90 days" may still score as entailed by a lenient model.
- **Thresholds.** Support scores are classifier scores and need calibration like any other (see [4.2](/training/module/safety-engineering/detection-and-classification)). A threshold copied from a paper is not calibrated for your domain.
- **Citation checks prove less than they appear to.** A real ID with a verbatim quote can still be cited for a claim it does not support. Pattern 2 catches invention; pattern 3 is needed for misuse.
- **Latency.** Support checks after generation add time. For streamed answers, see [4.7](/training/module/safety-engineering/streaming-latency-and-failure-behavior) on holding back output until checks finish.
- **Abstention that annoys.** A retrieval floor set too high makes the system refuse answerable questions, which is over-refusal ([4.4](/training/module/safety-engineering/over-refusal-and-refusal-design)). Measure both.

## Lab exercise

In [Lab 4: Safety Controls](/labs/lab-4-safety-controls), Task 4.3 has you add citation verification, chunked per-claim support checking, and a retrieval floor to the lab's RAG answer path, then measure how many fabricated or unsupported answers still reach the user and how many answerable questions now abstain.

## Check your understanding

<details>
<summary>1. A groundedness checker joins all five retrieved documents into one premise for an NLI model with a 512-token limit. Most answers score as unsupported. What is happening, and what is the fix?</summary>

The joined premise exceeds the model's limit and is truncated, so supporting text past the cutoff is never seen. Chunk the sources to fit alongside the claim, score each claim against each chunk, and take the maximum entailment score per claim.
</details>

<details>
<summary>2. Why should PII redaction run after the groundedness check rather than before it?</summary>

Redaction replaces names and numbers with placeholders that do not appear in the sources, so correct claims fail the support check. Run the support check on unredacted text inside the trusted boundary, log only IDs and scores, and redact as the last transformation before delivery.
</details>

<details>
<summary>3. An assistant's answers cite document IDs. Which part of the Mata v. Avianca failure does a deterministic citation check catch, and which part does it miss?</summary>

It catches invented sources: an ID not in the retrieved set or a quote not present in the source fails. It does not show that a real, correctly quoted source actually supports the claim it is attached to; that needs a support check.
</details>

<details>
<summary>4. A claim extractor returns no claims for an answer. The checker reports "grounded" with a score of 1.0. What is wrong?</summary>

No claims means nothing was verified, not that everything was. The checker should return a distinct status (for example `no_claims`) and let policy decide, typically treating it as a failure for factual Q&A. Reporting 1.0 also hides what would otherwise be a division by zero.
</details>
