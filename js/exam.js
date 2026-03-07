// ============================================================
// QUESTION BANK — 75 questions across 6 domains
// ============================================================
const QUESTIONS = [
  // -------------------------------------------------------
  // DOMAIN 1: AI Fundamentals & Failure Modes (11 questions)
  // -------------------------------------------------------
  {
    id: 1, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "Which mechanism allows transformer-based large language models to weigh the relevance of different tokens in a sequence when generating output?",
    options: ["A. Recurrent gating", "B. Self-attention", "C. Convolutional filtering", "D. Markov chain transitions"],
    correct: [1],
    explanation: "Self-attention is the core mechanism in transformer architectures that computes relevance scores between all token pairs."
  },
  {
    id: 2, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "A customer-facing chatbot confidently provides a detailed product return policy that does not exist in any company documentation. This failure mode is best described as:",
    options: ["A. Data leakage", "B. Prompt injection", "C. Hallucination", "D. Model drift"],
    correct: [2],
    explanation: "Hallucination occurs when an LLM generates plausible but factually incorrect information not grounded in its source data."
  },
  {
    id: 3, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "ms",
    question: "Which of the following are direct risks associated with prompt injection attacks? (Choose 3)",
    options: ["A. Bypassing system-level safety instructions", "B. Exfiltrating data embedded in the system prompt", "C. Increasing the model's inference latency", "D. Causing the model to execute unintended actions", "E. Reducing the model's parameter count"],
    correct: [0, 1, 3],
    explanation: "Prompt injection can override system instructions, leak system prompt contents, and cause unintended behaviors. Latency and parameter count are not direct consequences."
  },
  {
    id: 4, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "Your company is deploying an LLM-based internal assistant that can query HR databases and send emails on behalf of employees. During threat modeling, which risk should receive the HIGHEST priority?\n\nScenario: The assistant uses function calling to interact with internal APIs. Authentication is handled via a shared service account with broad permissions.",
    options: ["A. The model may generate grammatically incorrect emails", "B. Excessive agency — the assistant could take privileged actions beyond user intent", "C. The model's responses may be slower during peak hours", "D. Users might ask questions outside the assistant's training data"],
    correct: [1],
    explanation: "Excessive agency with a shared privileged service account is the highest-risk issue, as the model could take actions beyond what any individual user should be authorized to perform."
  },
  {
    id: 5, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "In the context of LLM security, what does a jailbreak attack primarily attempt to achieve?",
    options: ["A. Gain administrative access to the hosting infrastructure", "B. Circumvent the model's alignment and safety guardrails to produce restricted content", "C. Extract the exact model weights through API queries", "D. Overload the model with requests to cause a denial of service"],
    correct: [1],
    explanation: "Jailbreaking targets the model's safety alignment to make it produce content it was trained to refuse, bypassing behavioral guardrails."
  },
  {
    id: 6, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "A financial services firm is building an agentic AI system that can autonomously research stocks, draft investment reports, and place trades. During a threat modeling session, which risk category is MOST critical to address first?\n\nScenario: The agent operates in a loop — it can call tools, evaluate results, and decide next steps without human approval for transactions under $10,000.",
    options: ["A. The agent may produce verbose reports that exceed token limits", "B. The agent could enter a feedback loop executing an escalating series of trades based on its own prior outputs", "C. The agent's research summaries might not match the company's style guide", "D. The agent may take too long to complete its research cycle"],
    correct: [1],
    explanation: "An autonomous agent with trading authority operating in a loop could compound errors by acting on its own outputs, creating cascading financial risk without human oversight."
  },
  {
    id: 7, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "ms",
    question: "Which of the following represent security risks specific to the Model Context Protocol (MCP) when used as an integration layer for LLM tools? (Choose 2)",
    options: ["A. MCP servers may expose capabilities beyond what the LLM agent should be authorized to use", "B. MCP increases the model's tendency to hallucinate due to additional context", "C. Malicious MCP tool descriptions could manipulate the LLM's behavior through injected instructions", "D. MCP reduces model accuracy by limiting available token context"],
    correct: [0, 2],
    explanation: "MCP servers can expose excessive capabilities (privilege escalation risk) and malicious tool descriptions can serve as a prompt injection vector through the tool metadata."
  },
  {
    id: 8, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "What is the primary purpose of the temperature parameter in LLM inference?",
    options: ["A. It controls the maximum number of tokens generated", "B. It adjusts the randomness of the probability distribution over the output vocabulary", "C. It determines the number of attention heads used during inference", "D. It sets the learning rate for fine-tuning during inference"],
    correct: [1],
    explanation: "Temperature scales the logits before softmax, controlling how peaked or flat the output distribution is — higher values increase randomness, lower values make output more deterministic."
  },
  {
    id: 9, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "A healthcare startup has deployed an LLM to summarize medical research papers. Clinicians report that the model occasionally attributes findings to the wrong studies, mixing up results across different papers provided in context.\n\nThis failure mode is BEST categorized as:",
    options: ["A. Training data poisoning", "B. Cross-context contamination or confabulation", "C. Prompt injection from the research papers", "D. Tokenization errors in medical terminology"],
    correct: [1],
    explanation: "When an LLM conflates information across multiple documents in its context window, mixing attributions incorrectly, this is cross-context contamination — a form of confabulation where the model blends information inappropriately."
  },
  {
    id: 10, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "mc",
    question: "Which of the following BEST describes the data leakage risk in LLM deployments?",
    options: ["A. The model forgets previously learned information over time", "B. Sensitive information from training data, system prompts, or user conversations is unintentionally exposed in model outputs", "C. The model's weights are too large and leak into system memory", "D. API rate limits are exceeded causing data to be lost"],
    correct: [1],
    explanation: "Data leakage in LLM contexts refers to the unintentional exposure of sensitive information — whether memorized training data, system prompt contents, or other users' conversation data."
  },
  {
    id: 11, domain: 1, domainName: "AI Fundamentals & Failure Modes", type: "ms",
    question: "An organization is performing a threat model for a new LLM-based customer support agent. Which of the following should be included as threat vectors in their analysis? (Choose 3)",
    options: ["A. Adversarial inputs crafted by malicious users to override agent instructions", "B. Compromised retrieval sources feeding manipulated content to the agent", "C. The agent's CSS styling being modified by end users", "D. Tool calls that exceed the agent's intended authorization scope", "E. The color scheme of the agent's chat interface"],
    correct: [0, 1, 3],
    explanation: "Adversarial inputs (prompt injection), compromised retrieval sources (indirect injection), and unauthorized tool use (excessive agency) are all critical threat vectors. UI styling is not a security threat vector."
  },

  // -------------------------------------------------------
  // DOMAIN 2: Guardrail Architecture & Design (19 questions)
  // -------------------------------------------------------
  {
    id: 12, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "In a defense-in-depth guardrail architecture, what is the primary rationale for implementing guardrails at multiple layers (input, system, and output)?",
    options: ["A. To increase response latency and discourage overuse", "B. To ensure that if one guardrail layer is bypassed, subsequent layers can still catch violations", "C. To reduce the total cost of LLM API calls", "D. To simplify the overall system architecture"],
    correct: [1],
    explanation: "Defense in depth applies multiple independent security controls so that failure of one layer does not result in complete system compromise."
  },
  {
    id: 13, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "A company operates a multi-tenant SaaS platform where each customer has an AI assistant. Customer A should never see data from Customer B, even if both use the same underlying LLM.\n\nWhich architectural pattern is MOST critical for this requirement?",
    options: ["A. Implementing output guardrails that redact all proper nouns", "B. Using a single shared system prompt with instructions to not cross reference tenants", "C. Enforcing tenant-level data isolation in the retrieval layer and including tenant-scoped context boundaries", "D. Adding a rate limiter to prevent one tenant from consuming too many resources"],
    correct: [2],
    explanation: "Multi-tenant isolation requires enforcing data boundaries at the retrieval and context layer — instructing the model alone is insufficient as it can be bypassed."
  },
  {
    id: 14, domain: 2, domainName: "Guardrail Architecture & Design", type: "ms",
    question: "Which of the following are characteristics of effective input guardrails? (Choose 3)",
    options: ["A. They validate and sanitize user input before it reaches the LLM", "B. They detect and block prompt injection attempts", "C. They guarantee the model will never hallucinate", "D. They enforce input length and format constraints", "E. They replace the need for output guardrails entirely"],
    correct: [0, 1, 3],
    explanation: "Input guardrails sanitize inputs, detect injection attacks, and enforce format constraints. They cannot prevent hallucination (a model behavior) and do not replace the need for output guardrails."
  },
  {
    id: 15, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "When designing guardrails for a Retrieval-Augmented Generation (RAG) system, which of the following is the MOST important consideration?",
    options: ["A. Ensuring the retrieval index is sorted alphabetically", "B. Validating that retrieved documents are relevant, authorized for the requesting user, and free of injected content", "C. Maximizing the number of documents retrieved regardless of relevance", "D. Using the largest available embedding model to improve retrieval speed"],
    correct: [1],
    explanation: "RAG guardrails must ensure retrieved content is relevant, access-controlled, and not poisoned with adversarial content that could influence the LLM."
  },
  {
    id: 16, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "Your team is designing an agentic system where an LLM can browse the web, write code, and execute shell commands. The security architect recommends implementing a human-in-the-loop (HITL) pattern.\n\nAt which point should HITL approval be enforced?",
    options: ["A. Only after the final output is generated, before displaying to the user", "B. Before any tool execution that has side effects or accesses sensitive resources", "C. Only when the model's confidence score is below 50%", "D. Before every single LLM inference call to validate the prompt"],
    correct: [1],
    explanation: "HITL approval should gate actions with real-world side effects (code execution, shell commands, web requests) rather than every inference call or only final outputs."
  },
  {
    id: 17, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "What is the primary architectural purpose of output guardrails?",
    options: ["A. To compress the model's response for faster network transmission", "B. To validate, filter, or transform the model's output before it reaches the end user", "C. To fine-tune the model based on user feedback in real-time", "D. To cache responses for repeated queries"],
    correct: [1],
    explanation: "Output guardrails sit between the model and the user, inspecting and potentially modifying responses to enforce safety, compliance, and quality standards."
  },
  {
    id: 18, domain: 2, domainName: "Guardrail Architecture & Design", type: "ms",
    question: "An organization is designing trust boundaries for an agentic AI system that uses MCP to connect to external tool servers. Which of the following are valid trust boundary considerations? (Choose 2)",
    options: ["A. Each MCP server should be treated as an untrusted external service regardless of who operates it", "B. Tool descriptions from MCP servers should be trusted implicitly since they are machine-generated", "C. The agent should validate tool outputs before incorporating them into its reasoning or passing them to other tools", "D. MCP connections do not need authentication because they operate within the internal network"],
    correct: [0, 2],
    explanation: "MCP servers should be treated as untrusted (tool descriptions can contain injected instructions), and tool outputs must be validated before use. Authentication is always necessary."
  },
  {
    id: 19, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "A legal technology company wants to build an AI contract review assistant. The system must ensure that the AI never provides definitive legal advice, only analysis.\n\nWhich guardrail design pattern BEST addresses this requirement?",
    options: ["A. Remove all legal terminology from the model's training data", "B. Implement system-level guardrails that frame all outputs as analysis with explicit disclaimers, combined with output classifiers that detect and flag definitive legal advice language", "C. Set the model temperature to 0 to prevent creative legal interpretations", "D. Limit the model to processing only contracts under 10 pages"],
    correct: [1],
    explanation: "System-level framing combined with output classification creates a defense-in-depth approach — the system prompt guides behavior while the output classifier catches violations."
  },
  {
    id: 20, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "In the context of identity delegation for agentic AI systems, which principle should govern how an agent accesses resources on behalf of a user?",
    options: ["A. The agent should use a highly privileged service account to ensure it can complete any task", "B. The agent should operate with the same permissions as the requesting user, using scoped credentials that reflect the user's actual authorization level", "C. The agent should prompt the user for their password each time it needs to access a resource", "D. The agent should cache user credentials locally for faster subsequent access"],
    correct: [1],
    explanation: "Identity delegation requires the agent to inherit the user's permissions through scoped credentials, enforcing least privilege and ensuring the agent cannot exceed the user's authorization."
  },
  {
    id: 21, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "Which architectural pattern is MOST effective for preventing an LLM-based agent from taking irreversible actions without appropriate oversight?",
    options: ["A. Logging all actions after they complete", "B. Implementing a gated execution model where high-impact actions require explicit approval before execution", "C. Using a smaller model for high-risk tasks", "D. Running the agent in a separate virtual machine"],
    correct: [1],
    explanation: "A gated execution model ensures that actions classified as high-impact are queued for approval rather than executed immediately, preventing irreversible mistakes."
  },
  {
    id: 22, domain: 2, domainName: "Guardrail Architecture & Design", type: "ms",
    question: "Which of the following are valid architectural patterns for implementing guardrails in a production LLM system? (Choose 3)",
    options: ["A. Inline middleware that intercepts requests and responses in the LLM call chain", "B. Asynchronous monitoring that analyzes interactions after they occur for audit purposes", "C. Proxy-based architecture where all LLM traffic routes through a guardrail gateway", "D. Client-side JavaScript validation as the sole guardrail mechanism", "E. Compiling guardrail logic directly into the model weights"],
    correct: [0, 1, 2],
    explanation: "Inline middleware, async monitoring, and proxy/gateway architectures are all valid patterns. Client-side-only validation is trivially bypassed, and guardrail logic cannot be compiled into weights."
  },
  {
    id: 23, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "A bank is deploying an AI assistant that helps customers with account inquiries. The assistant can view account balances and recent transactions.\n\nScenario: A customer asks: 'Show me the balance for account number 98765.' The customer's own account number is 12345.\n\nWhich guardrail design prevents this type of unauthorized data access?",
    options: ["A. An output guardrail that redacts all numbers from responses", "B. An input guardrail that checks the requested account number against the authenticated user's authorized accounts before querying the database", "C. A system prompt instructing the model to only show the user's own data", "D. Rate limiting the number of account queries per session"],
    correct: [1],
    explanation: "Authorization checks must be enforced programmatically at the input/retrieval layer — verifying the requested resource belongs to the authenticated user before data is accessed."
  },
  {
    id: 24, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "What is the primary risk of relying exclusively on system prompts to enforce guardrail behaviors?",
    options: ["A. System prompts increase the model's inference cost significantly", "B. System prompts can be overridden or ignored through prompt injection, jailbreaking, or model updates", "C. System prompts are not supported by modern LLM APIs", "D. System prompts always reduce the quality of the model's responses"],
    correct: [1],
    explanation: "System prompts are soft controls that can be circumvented through adversarial techniques. They should be part of a layered defense but never the sole guardrail mechanism."
  },
  {
    id: 25, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "An e-commerce platform uses an LLM to generate product descriptions. The system occasionally generates descriptions that make unsupported health claims about food products.\n\nWhich combination of guardrails would MOST effectively address this issue?",
    options: ["A. Increase the model's temperature to generate more diverse descriptions", "B. Implement a domain-specific output classifier trained to detect health claims, paired with a system prompt that prohibits unsupported medical or health assertions", "C. Switch to a smaller model that has less knowledge about health topics", "D. Add a disclaimer to every product description regardless of content"],
    correct: [1],
    explanation: "Combining a targeted output classifier with system-level instructions creates an effective defense-in-depth approach for domain-specific content policy enforcement."
  },
  {
    id: 26, domain: 2, domainName: "Guardrail Architecture & Design", type: "ms",
    question: "When designing guardrails for a multi-step agentic workflow, which of the following principles should be applied? (Choose 2)",
    options: ["A. Guardrails should only be evaluated at the final output step to minimize latency", "B. Each tool invocation should be validated against an allowlist of permitted actions for the current workflow context", "C. The agent should accumulate permissions as it progresses through workflow steps", "D. Inter-step guardrails should validate that tool outputs match expected schemas before the agent uses them for subsequent reasoning"],
    correct: [1, 3],
    explanation: "Agentic guardrails should validate at each step (not just the final output) and ensure tool outputs conform to expected formats to prevent cascading errors or injection through tool results."
  },
  {
    id: 27, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "Which of the following BEST describes the concept of a 'guardrail gateway' in LLM architecture?",
    options: ["A. A physical network device that filters LLM traffic at the packet level", "B. A centralized service through which all LLM interactions are routed for consistent policy enforcement, logging, and monitoring", "C. A browser extension that modifies LLM responses on the client side", "D. A database that stores all guardrail configuration settings"],
    correct: [1],
    explanation: "A guardrail gateway is a centralized proxy or middleware service that intercepts all LLM traffic to apply consistent security policies, content filtering, and observability."
  },
  {
    id: 28, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "A government agency is building an AI system to help citizens navigate benefit applications. The system must meet strict accessibility requirements and must never deny benefits based on its own judgment.\n\nWhich architectural constraint is MOST important?",
    options: ["A. The system should use the newest available LLM to ensure the best accuracy", "B. The system should be advisory only — all eligibility determinations must be made by human caseworkers, with the AI limited to information gathering and form assistance", "C. The system should automatically approve applications to reduce processing time", "D. The system should use multiple LLMs and average their outputs for eligibility decisions"],
    correct: [1],
    explanation: "For high-stakes government decisions affecting citizen benefits, the AI must be constrained to an advisory role with humans making all determinations — this is a fundamental architectural boundary."
  },
  {
    id: 29, domain: 2, domainName: "Guardrail Architecture & Design", type: "mc",
    question: "In a RAG-based guardrail architecture, what is a 'retrieval guardrail'?",
    options: ["A. A guardrail that prevents users from retrieving the model's system prompt", "B. A control that validates, filters, and scopes the documents retrieved from the knowledge base before they are included in the LLM's context", "C. A mechanism that caches retrieved documents to improve performance", "D. A database constraint that limits the size of stored documents"],
    correct: [1],
    explanation: "Retrieval guardrails operate between the vector store and the LLM, ensuring that only authorized, relevant, and safe content enters the model's context window."
  },
  {
    id: 30, domain: 2, domainName: "Guardrail Architecture & Design", type: "ms",
    question: "Which of the following are key considerations when designing guardrails for MCP tool servers that an LLM agent will interact with? (Choose 3)",
    options: ["A. Tool descriptions should be reviewed for potential prompt injection payloads", "B. Tool capabilities should be scoped to the minimum required for the agent's task", "C. MCP tool servers should share a single authentication token for simplicity", "D. Tool invocation results should be validated before being fed back into the agent's context", "E. All tool servers should have unrestricted network access to maximize flexibility"],
    correct: [0, 1, 3],
    explanation: "MCP tool security requires reviewing descriptions for injection, enforcing least-privilege capabilities, and validating tool outputs. Shared tokens and unrestricted access violate security principles."
  },

  // -------------------------------------------------------
  // DOMAIN 3: Guardrail Implementation (15 questions)
  // -------------------------------------------------------
  {
    id: 31, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "A development team needs to detect and block Social Security Numbers in LLM outputs before they reach end users. Which detection technique is MOST appropriate as the first line of defense?",
    options: ["A. Train a custom neural network to identify SSN patterns", "B. Use regular expressions to match the known SSN format (XXX-XX-XXXX)", "C. Ask the LLM to self-evaluate whether its response contains SSNs", "D. Implement a keyword blocklist containing common SSN prefixes"],
    correct: [1],
    explanation: "SSNs have a well-defined format (XXX-XX-XXXX) that regex can reliably match. This is a deterministic, fast, and accurate first-line detection approach for structured PII patterns."
  },
  {
    id: 32, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "What is the 'LLM-as-judge' pattern in guardrail implementation?",
    options: ["A. Using one LLM to evaluate and score the outputs of another LLM against defined safety criteria", "B. Having the same LLM grade its own outputs in a self-evaluation loop", "C. Using an LLM to replace human judges in legal proceedings", "D. Training an LLM specifically as a binary classifier for spam detection"],
    correct: [0],
    explanation: "The LLM-as-judge pattern uses a separate LLM (often with specific evaluation prompts) to assess another model's outputs against safety, quality, or compliance criteria."
  },
  {
    id: 33, domain: 3, domainName: "Guardrail Implementation", type: "ms",
    question: "Which of the following are effective techniques for handling PII in LLM-based systems? (Choose 3)",
    options: ["A. Tokenizing PII with reversible placeholders before sending to the LLM, then de-tokenizing in the response", "B. Storing all PII in the system prompt so the model always has access", "C. Applying regex and NER-based detection on outputs to identify and redact PII before delivery", "D. Implementing data loss prevention (DLP) policies at the API gateway layer", "E. Relying on the model's training to naturally avoid outputting PII"],
    correct: [0, 2, 3],
    explanation: "PII handling should use tokenization (pre-processing), output scanning with regex/NER (post-processing), and DLP policies (infrastructure). Storing PII in system prompts increases risk, and model training alone is unreliable."
  },
  {
    id: 34, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "A team is implementing structured output validation for an LLM that generates JSON responses for an API. The LLM occasionally produces malformed JSON or includes unexpected fields.\n\nWhich implementation approach is MOST robust?",
    options: ["A. Adding 'always return valid JSON' to the system prompt", "B. Using JSON schema validation on every LLM response, with a fallback mechanism that retries or returns a safe default when validation fails", "C. Using string replacement to fix common JSON errors in the output", "D. Switching to a model fine-tuned exclusively on JSON data"],
    correct: [1],
    explanation: "Schema validation provides deterministic enforcement of output structure, and combining it with retry/fallback logic ensures the system degrades gracefully when the model produces invalid output."
  },
  {
    id: 35, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "Your organization is evaluating whether to build custom guardrails or purchase a commercial guardrail platform. Which factor MOST strongly favors building a custom solution?",
    options: ["A. The organization wants guardrails deployed as quickly as possible", "B. The organization operates in a highly regulated niche domain with unique policy requirements that no commercial tool adequately addresses", "C. The development team has limited experience with ML and NLP", "D. The organization wants to minimize ongoing maintenance costs"],
    correct: [1],
    explanation: "Custom solutions are justified when commercial products cannot meet domain-specific regulatory or policy requirements. Speed, limited expertise, and maintenance costs favor commercial solutions."
  },
  {
    id: 36, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "A content moderation team wants to detect toxic language in LLM outputs. They need a solution that balances accuracy with latency.\n\nWhich approach offers the BEST trade-off for real-time detection?",
    options: ["A. A fine-tuned lightweight classification model specifically trained on toxic language detection", "B. Sending every output to a large LLM for toxicity evaluation", "C. A keyword blocklist of offensive terms", "D. Manual human review of every output"],
    correct: [0],
    explanation: "A fine-tuned lightweight classifier provides high accuracy for the specific task while maintaining low latency, making it ideal for real-time content moderation in production."
  },
  {
    id: 37, domain: 3, domainName: "Guardrail Implementation", type: "ms",
    question: "Which of the following are effective prompt engineering techniques for improving LLM safety? (Choose 2)",
    options: ["A. Including explicit behavioral boundaries and refusal instructions in the system prompt", "B. Making the system prompt as short as possible to reduce attack surface", "C. Using few-shot examples in the system prompt that demonstrate appropriate refusal behavior for edge cases", "D. Encrypting the system prompt to prevent users from reading it"],
    correct: [0, 2],
    explanation: "Explicit behavioral boundaries and few-shot refusal examples are proven prompt engineering techniques for safety. Short prompts reduce guidance, and encryption of prompts is not standard practice."
  },
  {
    id: 38, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "An engineering team is implementing an MCP server that allows an LLM agent to query a customer database. Which implementation pattern is MOST secure?",
    options: ["A. The MCP server exposes a generic SQL execution tool that accepts raw queries from the agent", "B. The MCP server provides narrow, predefined query tools (e.g., 'get_customer_by_id') with input validation, parameterized queries, and result filtering based on the requesting user's permissions", "C. The MCP server connects to the database using an admin account and relies on the LLM to formulate safe queries", "D. The MCP server caches all database contents in memory so the agent can search without direct database access"],
    correct: [1],
    explanation: "Predefined narrow tools with input validation, parameterized queries, and permission-based filtering follow the principle of least privilege and prevent SQL injection and unauthorized data access."
  },
  {
    id: 39, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "What is the primary advantage of using a dedicated classification model over regex for detecting prompt injection attempts?",
    options: ["A. Classification models have zero false positives", "B. Classification models can detect semantically adversarial inputs that do not match any predefined pattern, including novel attack variations", "C. Classification models are always faster than regex", "D. Classification models require no training data"],
    correct: [1],
    explanation: "ML classifiers can generalize to detect novel injection attempts based on semantic patterns, whereas regex can only match predefined syntactic patterns and is easily circumvented with variations."
  },
  {
    id: 40, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "A healthcare application uses an LLM to generate patient discharge summaries from structured medical records. The development team needs to ensure the summaries do not include information from other patients' records.\n\nScenario: The system retrieves relevant medical records from a database and includes them in the LLM's context. Occasionally, a retrieval error causes records from a different patient to be included.\n\nWhich implementation is MOST effective at preventing cross-patient data leakage?",
    options: ["A. Adding an instruction to the system prompt: 'Only reference records for the specified patient'", "B. Implementing a post-retrieval validation step that verifies every retrieved record belongs to the target patient ID before including it in the LLM context", "C. Using a higher retrieval similarity threshold to reduce the chance of incorrect matches", "D. Training the LLM to recognize and ignore records that do not belong to the target patient"],
    correct: [1],
    explanation: "Programmatic validation of retrieved records against the target patient ID is a deterministic control that prevents cross-contamination regardless of retrieval quality or model behavior."
  },
  {
    id: 41, domain: 3, domainName: "Guardrail Implementation", type: "ms",
    question: "Which of the following are valid strategies for implementing guardrails on structured LLM outputs? (Choose 2)",
    options: ["A. Using constrained decoding or grammar-based generation to force the model to produce outputs conforming to a specific schema", "B. Applying JSON/XML schema validation on the raw model output and rejecting non-conforming responses", "C. Converting all model outputs to plain text to avoid structural issues", "D. Allowing the model to output any format and transforming it client-side"],
    correct: [0, 1],
    explanation: "Constrained decoding enforces structure during generation, and schema validation enforces it after generation. Both are valid implementation strategies for structured output guardrails."
  },
  {
    id: 42, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "When implementing a content filtering guardrail, what is the recommended approach for handling false positives (legitimate content incorrectly blocked)?",
    options: ["A. Disable the guardrail to avoid blocking legitimate content", "B. Implement a tiered response strategy — soft blocks that warn users with an option to rephrase, combined with hard blocks only for high-confidence violations, plus a feedback mechanism for false positive reporting", "C. Set the detection threshold as low as possible to minimize false positives", "D. Route all flagged content to human reviewers before responding"],
    correct: [1],
    explanation: "A tiered approach balances safety with usability — soft blocks handle uncertain cases without completely blocking users, while hard blocks catch clear violations and feedback loops improve the system over time."
  },
  {
    id: 43, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "A development team is implementing guardrails for an LLM that generates SQL queries from natural language. Which guardrail implementation is MOST critical?",
    options: ["A. Limiting the LLM to generating only SELECT statements and using parameterized query templates with allowlisted tables and columns", "B. Adding a comment in the generated SQL that says '-- AI generated, use with caution'", "C. Running all generated queries in a production database with transaction rollback enabled", "D. Validating that the generated SQL has correct syntax before execution"],
    correct: [0],
    explanation: "Restricting query types, using parameterized templates, and allowlisting accessible tables/columns prevents SQL injection, data modification, and unauthorized data access at the implementation level."
  },
  {
    id: 44, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "Your team needs to implement a guardrail that detects when an LLM's response contradicts information in its provided context (a grounding guardrail). Which implementation approach is MOST effective?",
    options: ["A. Comparing the word count of the response to the word count of the context", "B. Using an NLI (Natural Language Inference) model to check whether claims in the response are entailed by the provided context documents", "C. Checking whether all words in the response appear somewhere in the context", "D. Asking the same LLM if its response is accurate"],
    correct: [1],
    explanation: "NLI models are specifically designed to determine entailment relationships between text passages, making them well-suited for verifying that LLM outputs are grounded in provided context."
  },
  {
    id: 45, domain: 3, domainName: "Guardrail Implementation", type: "mc",
    question: "Which of the following BEST describes the role of canary tokens in LLM guardrail implementation?",
    options: ["A. Tokens added to the vocabulary to improve model performance", "B. Unique markers placed in system prompts or sensitive data that trigger alerts if they appear in model outputs, indicating potential data leakage or prompt extraction", "C. Authentication tokens used to validate API requests", "D. Special tokens that mark the beginning and end of model responses"],
    correct: [1],
    explanation: "Canary tokens are detection mechanisms — unique strings placed in sensitive locations that, if reproduced in outputs, indicate the model has leaked protected information."
  },

  // -------------------------------------------------------
  // DOMAIN 4: Policy, Compliance & Governance (11 questions)
  // -------------------------------------------------------
  {
    id: 46, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "Which function of the NIST AI Risk Management Framework (AI RMF) focuses on understanding and documenting the risks associated with an AI system?",
    options: ["A. Govern", "B. Map", "C. Measure", "D. Manage"],
    correct: [1],
    explanation: "The Map function in NIST AI RMF focuses on identifying and understanding AI risks — establishing context, identifying potential impacts, and documenting risk characteristics."
  },
  {
    id: 47, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "Under the EU AI Act, an AI system used to evaluate the creditworthiness of individuals would be classified under which risk category?",
    options: ["A. Minimal risk", "B. Limited risk", "C. High risk", "D. Unacceptable risk"],
    correct: [2],
    explanation: "Credit scoring AI systems are explicitly classified as high-risk under the EU AI Act because they significantly affect individuals' access to financial resources."
  },
  {
    id: 48, domain: 4, domainName: "Policy, Compliance & Governance", type: "ms",
    question: "According to the OWASP Top 10 for LLM Applications, which of the following are identified as top risks? (Choose 3)",
    options: ["A. Prompt Injection", "B. CSS Cross-Site Styling", "C. Insecure Output Handling", "D. Excessive Agency", "E. Database Normalization Failures"],
    correct: [0, 2, 3],
    explanation: "Prompt Injection, Insecure Output Handling, and Excessive Agency are all in the OWASP Top 10 for LLMs. CSS styling and database normalization are not LLM-specific risks."
  },
  {
    id: 49, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "A Chief Compliance Officer asks your team to translate the company's acceptable use policy into technical guardrail specifications. The policy states: 'AI systems must not generate content that could be construed as financial advice.'\n\nWhich translation approach is MOST effective?",
    options: ["A. Add 'do not give financial advice' to the system prompt and consider it complete", "B. Define specific detectable patterns (e.g., buy/sell recommendations, price predictions, portfolio allocation suggestions), implement classifiers for each pattern, define response actions for violations, and document the mapping between policy clauses and technical controls", "C. Block all conversations that mention money or finance", "D. Have a lawyer review every response before it is sent to the user"],
    correct: [1],
    explanation: "Effective policy translation requires decomposing abstract policies into specific, detectable patterns, implementing technical controls for each, defining response actions, and documenting the policy-to-control mapping."
  },
  {
    id: 50, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "What is the primary purpose of maintaining audit documentation for AI guardrail systems?",
    options: ["A. To increase the company's marketing credibility", "B. To provide an evidence trail demonstrating that appropriate controls were in place, how they were tested, and how incidents were handled — supporting regulatory compliance and accountability", "C. To train new employees on how to use the AI system", "D. To reduce cloud computing costs through better resource planning"],
    correct: [1],
    explanation: "Audit documentation provides evidence of due diligence, control effectiveness, and incident response — critical for regulatory compliance, legal defense, and organizational accountability."
  },
  {
    id: 51, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "An AI ethics board reviews a new customer service chatbot and discovers it provides noticeably different levels of service quality when interacting with users who write in non-standard English dialects.\n\nThis issue BEST maps to which ethical concern?",
    options: ["A. Data privacy violation", "B. Algorithmic bias leading to disparate treatment of users based on linguistic characteristics", "C. Intellectual property infringement", "D. Excessive energy consumption"],
    correct: [1],
    explanation: "Differential service quality based on dialect or linguistic characteristics is a form of algorithmic bias that leads to disparate treatment, raising fairness and equity concerns."
  },
  {
    id: 52, domain: 4, domainName: "Policy, Compliance & Governance", type: "ms",
    question: "Which of the following are required elements of a comprehensive AI governance framework for guardrail management? (Choose 2)",
    options: ["A. Defined roles and responsibilities for guardrail oversight, including escalation procedures", "B. A commitment to never updating guardrails once deployed to ensure consistency", "C. Regular review cycles that evaluate guardrail effectiveness against evolving threats and policy changes", "D. Restricting guardrail configuration access to the AI model vendor only"],
    correct: [0, 2],
    explanation: "AI governance requires clear accountability structures and regular review cycles. Static guardrails become ineffective against evolving threats, and organizations must retain control over their guardrail configurations."
  },
  {
    id: 53, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "Your organization is preparing for a regulatory audit of its AI systems. The auditor requests evidence that your guardrails are effective at preventing harmful outputs.\n\nWhich documentation BEST satisfies this requirement?",
    options: ["A. The source code of the guardrail system", "B. Test results showing guardrail performance metrics (precision, recall, F1) across categories, red team assessment reports, production incident logs with resolution details, and regular guardrail effectiveness reviews", "C. Marketing materials describing the guardrail features", "D. A signed statement from the CTO affirming that guardrails are in place"],
    correct: [1],
    explanation: "Auditors need evidence of effectiveness — quantitative performance metrics, adversarial testing results, incident response records, and regular review documentation provide comprehensive compliance evidence."
  },
  {
    id: 54, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "The NIST AI RMF's 'Govern' function primarily addresses which aspect of AI risk management?",
    options: ["A. Technical implementation of security controls", "B. Establishing organizational policies, processes, accountability structures, and a culture of responsible AI development", "C. Measuring the accuracy of AI model outputs", "D. Deploying AI models to production environments"],
    correct: [1],
    explanation: "The Govern function establishes the organizational foundation — policies, accountability, culture, and processes — that supports all other AI risk management activities."
  },
  {
    id: 55, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "A multinational company deploys an AI assistant in both the EU and the US. Under the EU AI Act, the system must provide transparency to users.\n\nWhich requirement MUST the company implement for EU users?",
    options: ["A. The AI must generate responses in the user's native language only", "B. Users must be clearly informed that they are interacting with an AI system, not a human", "C. The AI must disclose its full model architecture to users", "D. The company must publish the model's training dataset"],
    correct: [1],
    explanation: "The EU AI Act requires transparency — users must be clearly informed when they are interacting with an AI system, ensuring they can make informed decisions about the interaction."
  },
  {
    id: 56, domain: 4, domainName: "Policy, Compliance & Governance", type: "mc",
    question: "When translating the policy requirement 'AI must not discriminate based on protected characteristics' into technical guardrail specifications, which approach is MOST comprehensive?",
    options: ["A. Remove all mentions of protected characteristics from the training data", "B. Implement bias testing across protected characteristic groups in both inputs and outputs, monitor for disparate impact in production, establish regular fairness audits, and create feedback mechanisms for affected users", "C. Add 'do not discriminate' to the system prompt", "D. Use a model that was not trained on any data containing demographic information"],
    correct: [1],
    explanation: "Comprehensive anti-discrimination guardrails require multi-layered approaches: testing, monitoring, auditing, and feedback mechanisms — not just data removal or prompt instructions."
  },

  // -------------------------------------------------------
  // DOMAIN 5: Testing & Red Teaming (11 questions)
  // -------------------------------------------------------
  {
    id: 57, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "What is the primary objective of red teaming an LLM-based system?",
    options: ["A. Improving the model's response speed under load", "B. Systematically probing the system using adversarial techniques to identify vulnerabilities, guardrail bypasses, and failure modes before malicious actors exploit them", "C. Testing the system's user interface for visual bugs", "D. Benchmarking the model's performance against competitor models"],
    correct: [1],
    explanation: "Red teaming aims to discover vulnerabilities through adversarial testing, simulating the tactics of malicious actors to identify weaknesses before they can be exploited in production."
  },
  {
    id: 58, domain: 5, domainName: "Testing & Red Teaming", type: "ms",
    question: "Which of the following are valid red teaming techniques for testing LLM guardrails? (Choose 3)",
    options: ["A. Prompt injection using role-play scenarios to bypass safety instructions", "B. Testing with multilingual inputs to check if guardrails apply consistently across languages", "C. Restarting the LLM server to clear its memory", "D. Gradually escalating the sensitivity of requests across a multi-turn conversation", "E. Changing the LLM's font size to confuse the model"],
    correct: [0, 1, 3],
    explanation: "Role-play injection, multilingual testing, and multi-turn escalation are established red teaming techniques. Server restarts and font changes are not adversarial testing methods."
  },
  {
    id: 59, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "A guardrail designed to detect harmful content has the following test results:\n- True Positives: 85\n- False Positives: 15\n- False Negatives: 10\n- True Negatives: 890\n\nWhat is the precision of this guardrail?",
    options: ["A. 85.0%", "B. 89.5%", "C. 90.0%", "D. 98.5%"],
    correct: [0],
    explanation: "Precision = TP / (TP + FP) = 85 / (85 + 15) = 85 / 100 = 85.0%. Precision measures how many of the flagged items were actually harmful."
  },
  {
    id: 60, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "Using the same test results from the previous scenario (TP=85, FP=15, FN=10, TN=890), what is the recall of this guardrail?",
    options: ["A. 85.0%", "B. 89.5%", "C. 90.0%", "D. 98.9%"],
    correct: [1],
    explanation: "Recall = TP / (TP + FN) = 85 / (85 + 10) = 85 / 95 = 89.47%, approximately 89.5%. Recall measures how many actual harmful items were caught."
  },
  {
    id: 61, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "A security team is planning a red team exercise for a customer-facing LLM chatbot. They have limited time and must prioritize their testing.\n\nScenario: The chatbot can access customer account information and process certain transactions. It uses RAG with a company knowledge base.\n\nWhich attack vector should the team prioritize FIRST?",
    options: ["A. Testing whether the chatbot can write poetry in an inappropriate style", "B. Attempting to use prompt injection to access other customers' account data or trigger unauthorized transactions", "C. Checking if the chatbot responds in an overly formal tone", "D. Testing the chatbot's ability to handle misspelled words"],
    correct: [1],
    explanation: "When the system has access to sensitive data and can perform transactions, testing for unauthorized data access and action execution through injection attacks should be the highest priority."
  },
  {
    id: 62, domain: 5, domainName: "Testing & Red Teaming", type: "ms",
    question: "Which of the following metrics are useful for evaluating guardrail effectiveness? (Choose 2)",
    options: ["A. F1 score — the harmonic mean of precision and recall, providing a balanced measure of guardrail accuracy", "B. Lines of code in the guardrail implementation", "C. False positive rate — the percentage of legitimate interactions incorrectly blocked, measuring impact on user experience", "D. The number of programming languages used in the guardrail system"],
    correct: [0, 2],
    explanation: "F1 score measures overall guardrail accuracy (balancing precision and recall), and false positive rate directly measures negative user experience impact. Code metrics are not relevant to guardrail effectiveness."
  },
  {
    id: 63, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "What is the purpose of continuous validation in the context of LLM guardrails?",
    options: ["A. Continuously retraining the LLM on new data", "B. Regularly and automatically testing guardrails against known and emerging attack patterns to ensure they remain effective as the system, threats, and usage patterns evolve", "C. Continuously monitoring the server's CPU usage", "D. Running the same test suite once before deployment"],
    correct: [1],
    explanation: "Continuous validation ensures guardrails remain effective over time by regularly testing against evolving threats, new attack patterns, and changes in the system or its usage."
  },
  {
    id: 64, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "A red team discovers that a chatbot's content filter can be bypassed by encoding harmful requests in Base64 and asking the model to decode and respond to them.\n\nThis finding BEST demonstrates which guardrail weakness?",
    options: ["A. The guardrail's output validation is too strict", "B. The input guardrail only analyzes the surface-level text and does not account for encoded or obfuscated payloads", "C. The model's temperature is set too high", "D. The system prompt is too long"],
    correct: [1],
    explanation: "This bypass demonstrates that the input guardrail lacks encoding-aware analysis — it only processes literal text and cannot detect threats hidden through encoding or obfuscation techniques."
  },
  {
    id: 65, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "When establishing a guardrail testing framework, which approach is MOST effective for ensuring comprehensive coverage?",
    options: ["A. Testing only the most common user queries", "B. Creating a test matrix that covers each guardrail across multiple attack categories (injection, jailbreak, data extraction, encoding bypass, multilingual, multi-turn), with both automated regression tests and periodic manual red team exercises", "C. Running a single comprehensive penetration test before launch", "D. Relying on production monitoring to identify guardrail failures"],
    correct: [1],
    explanation: "Comprehensive guardrail testing requires a structured matrix covering multiple attack categories with both automated (regression) and manual (red team) testing approaches."
  },
  {
    id: 66, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "A team is testing guardrails for a medical information chatbot. They discover the guardrail catches 95% of dangerous medical advice in English but only 60% in Spanish.\n\nWhat does this finding indicate?",
    options: ["A. The guardrail is working as intended since English is the primary language", "B. There is a critical coverage gap — the guardrail has language-dependent effectiveness, requiring multilingual test coverage and language-equitable guardrail implementation", "C. Spanish-language users are less likely to follow medical advice, so lower coverage is acceptable", "D. The finding is a false alarm caused by translation differences"],
    correct: [1],
    explanation: "A significant effectiveness gap across languages represents a critical vulnerability — guardrails must provide equitable protection regardless of the language used, as adversaries will exploit the weakest path."
  },
  {
    id: 67, domain: 5, domainName: "Testing & Red Teaming", type: "mc",
    question: "Which of the following BEST describes the relationship between precision and recall in guardrail tuning?",
    options: ["A. Both precision and recall should always be maximized to 100%", "B. There is typically a trade-off: increasing sensitivity (recall) tends to increase false positives (lowering precision), and the optimal balance depends on the risk profile of the use case", "C. Precision and recall are always equal for well-designed guardrails", "D. Recall is only relevant for output guardrails, not input guardrails"],
    correct: [1],
    explanation: "The precision-recall trade-off is fundamental — higher recall catches more violations but generates more false positives. High-risk applications may prioritize recall, while user-facing applications may balance both."
  },

  // -------------------------------------------------------
  // DOMAIN 6: Operations & Observability (8 questions)
  // -------------------------------------------------------
  {
    id: 68, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "Which metric is MOST important to monitor in production to detect guardrail drift over time?",
    options: ["A. The total number of API calls per day", "B. The guardrail trigger rate (percentage of interactions that activate guardrails), tracked over time with alerts for statistically significant deviations from baseline", "C. The average length of model responses", "D. The number of unique users per week"],
    correct: [1],
    explanation: "Guardrail trigger rate changes indicate either evolving user behavior, new attack patterns, or degrading guardrail effectiveness — making it the key metric for detecting drift."
  },
  {
    id: 69, domain: 6, domainName: "Operations & Observability", type: "ms",
    question: "Which of the following should be included in an LLM guardrail incident response plan? (Choose 3)",
    options: ["A. Predefined severity levels for different types of guardrail failures (e.g., PII leak vs. off-topic response)", "B. Escalation procedures and contact information for the responsible team members", "C. A plan to permanently shut down the AI system after any incident", "D. Post-incident review processes that feed findings back into guardrail improvements", "E. Instructions to delete all logs to protect user privacy"],
    correct: [0, 1, 3],
    explanation: "Effective incident response requires severity classification, clear escalation paths, and post-incident reviews that drive improvements. Permanent shutdown and log deletion are not appropriate responses."
  },
  {
    id: 70, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "A production LLM system's guardrail trigger rate has increased from 2% to 12% over the past week with no changes to the guardrail configuration.\n\nWhat is the MOST likely explanation and appropriate first response?",
    options: ["A. The guardrails have become more effective and no action is needed", "B. Investigate whether there has been a change in user behavior, a coordinated attack, or a model update that altered output characteristics — analyze the triggered interactions to determine root cause", "C. Immediately reduce the guardrail sensitivity to bring the trigger rate back to 2%", "D. Increase the LLM's temperature to produce more varied responses"],
    correct: [1],
    explanation: "A sudden spike in trigger rate requires investigation — it could indicate attacks, changing user patterns, or model behavior changes. Adjusting sensitivity without understanding the cause could introduce risk."
  },
  {
    id: 71, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "What is 'guardrail drift' and why is it a concern in production systems?",
    options: ["A. Physical movement of servers causing network latency", "B. The gradual degradation of guardrail effectiveness over time due to evolving attack techniques, model updates, changing user behavior, or shifts in the data distribution", "C. The tendency of guardrails to consume more memory over time", "D. Automatic updates to guardrail configuration by the cloud provider"],
    correct: [1],
    explanation: "Guardrail drift refers to the gradual decrease in guardrail effectiveness as the environment evolves — new attacks emerge, models change, and usage patterns shift, making previously effective controls less reliable."
  },
  {
    id: 72, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "An organization wants to implement comprehensive logging for their LLM guardrail system. Which logging approach BEST balances observability with privacy?",
    options: ["A. Log complete user inputs and model outputs in plaintext for full transparency", "B. Log guardrail decisions (triggered/passed), metadata (timestamps, user session IDs, guardrail type, confidence scores), and sanitized interaction summaries — with PII redacted from logs and appropriate retention policies", "C. Disable all logging to maximize user privacy", "D. Log only errors and discard all successful interaction data"],
    correct: [1],
    explanation: "Effective logging captures guardrail decisions and metadata for observability while redacting PII and applying retention policies to protect privacy — balancing operational needs with data protection."
  },
  {
    id: 73, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "A company updates the underlying LLM model used in their customer service system from version 3 to version 4. After the update, they notice their guardrails are blocking significantly more legitimate customer queries.\n\nWhat is the MOST likely cause?",
    options: ["A. The new model is more intelligent and needs fewer guardrails", "B. The new model's output characteristics (formatting, phrasing, style) have changed in ways that trigger existing guardrail detection patterns differently, causing increased false positives", "C. The guardrail system has a bug that only appears with even-numbered model versions", "D. Users are intentionally phrasing queries differently because they know the model was updated"],
    correct: [1],
    explanation: "Model updates frequently change output characteristics — phrasing, formatting, and style differences can trigger existing guardrails differently, requiring guardrail re-calibration after model updates."
  },
  {
    id: 74, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "Which lifecycle management practice is MOST important for maintaining guardrail effectiveness over time?",
    options: ["A. Never modifying guardrails after initial deployment", "B. Establishing a regular review cadence that evaluates guardrail performance metrics, incorporates new threat intelligence, tests against emerging attack patterns, and updates controls based on incident findings", "C. Replacing all guardrails with new ones every quarter regardless of performance", "D. Delegating all guardrail management to the LLM vendor"],
    correct: [1],
    explanation: "Regular review cycles that incorporate performance data, threat intelligence, new attack patterns, and incident findings ensure guardrails evolve with the threat landscape."
  },
  {
    id: 75, domain: 6, domainName: "Operations & Observability", type: "mc",
    question: "A site reliability engineer notices that the guardrail evaluation layer is adding 800ms of latency to every LLM interaction, causing user complaints about slow response times.\n\nScenario: The system runs three guardrail checks sequentially: input classification (200ms), toxicity detection (300ms), and PII scanning (300ms).\n\nWhich optimization strategy would MOST effectively reduce latency while maintaining guardrail coverage?",
    options: ["A. Remove the slowest guardrail to reduce total latency", "B. Execute all three guardrail checks in parallel rather than sequentially, reducing total latency to approximately the duration of the slowest single check", "C. Run guardrail checks only on every tenth request to reduce average latency", "D. Move all guardrail processing to run after the response is delivered to the user"],
    correct: [1],
    explanation: "Parallelizing independent guardrail checks reduces total latency from the sum of all checks (~800ms) to approximately the duration of the longest single check (~300ms) while maintaining full coverage."
  }
];

// ============================================================
// EXAM ENGINE STATE
// ============================================================
let state = {
  screen: 'intro',
  candidateName: '',
  questions: [],
  answers: {},       // questionIndex -> [selected option indices]
  flags: new Set(),
  currentIndex: 0,
  timeRemaining: 120 * 60,
  timerInterval: null,
  submitted: false
};

// ============================================================
// SHUFFLE UTILITY
// ============================================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// PREPARE EXAM — shuffle questions and options
// ============================================================
function prepareExam() {
  const shuffledQuestions = shuffle(QUESTIONS);
  state.questions = shuffledQuestions.map((q, idx) => {
    // Create option mapping for shuffling
    const optionIndices = q.options.map((_, i) => i);
    const shuffledOptionIndices = shuffle(optionIndices);
    const shuffledOptions = shuffledOptionIndices.map(i => q.options[i]);
    // Map correct indices to new positions
    const newCorrect = q.correct.map(c => shuffledOptionIndices.indexOf(c));
    return {
      ...q,
      originalId: q.id,
      displayIndex: idx,
      options: shuffledOptions,
      correct: newCorrect,
      optionMap: shuffledOptionIndices
    };
  });
}

// ============================================================
// START EXAM
// ============================================================
function startExam() {
  const nameInput = document.getElementById('candidate-name');
  const name = nameInput.value.trim();
  if (!name) {
    document.getElementById('name-error').style.display = 'block';
    nameInput.focus();
    return;
  }
  document.getElementById('name-error').style.display = 'none';
  state.candidateName = name;

  prepareExam();
  state.answers = {};
  state.flags = new Set();
  state.currentIndex = 0;
  state.submitted = false;
  state.timeRemaining = 120 * 60;

  document.getElementById('intro-screen').style.display = 'none';
  document.getElementById('exam-screen').style.display = 'block';
  document.getElementById('timer-display').style.display = 'block';

  buildPalette();
  renderQuestion();
  startTimer();
}

// ============================================================
// TIMER
// ============================================================
function startTimer() {
  updateTimerDisplay();
  state.timerInterval = setInterval(() => {
    state.timeRemaining--;
    updateTimerDisplay();
    if (state.timeRemaining <= 0) {
      clearInterval(state.timerInterval);
      submitExam();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timeRemaining / 60);
  const secs = state.timeRemaining % 60;
  const display = document.getElementById('timer-display');
  display.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  display.classList.remove('warning', 'critical');
  if (state.timeRemaining <= 300) {
    display.classList.add('critical');
  } else if (state.timeRemaining <= 600) {
    display.classList.add('warning');
  }
}

// ============================================================
// RENDER QUESTION
// ============================================================
function renderQuestion() {
  const q = state.questions[state.currentIndex];
  document.getElementById('question-number').textContent = 'Question ' + (state.currentIndex + 1) + ' of ' + state.questions.length;
  document.getElementById('domain-label').textContent = 'Domain ' + q.domain + ': ' + q.domainName;
  document.getElementById('question-text').textContent = q.question;

  const optList = document.getElementById('options-list');
  optList.innerHTML = '';

  const isMulti = q.type === 'ms';
  const selected = state.answers[state.currentIndex] || [];

  q.options.forEach((opt, idx) => {
    const li = document.createElement('li');
    li.className = 'option-item' + (selected.includes(idx) ? ' selected' : '');
    const inputType = isMulti ? 'checkbox' : 'radio';
    const checked = selected.includes(idx) ? 'checked' : '';
    li.innerHTML = '<input type="' + inputType + '" name="q' + state.currentIndex + '" ' + checked + '><span class="option-text">' + escapeHTML(opt) + '</span>';
    li.addEventListener('click', (e) => {
      if (e.target.tagName === 'INPUT') return;
      selectOption(idx);
    });
    li.querySelector('input').addEventListener('change', () => selectOption(idx));
    optList.appendChild(li);
  });

  // Flag button
  const flagBtn = document.getElementById('flag-btn');
  const flagText = document.getElementById('flag-text');
  if (state.flags.has(state.currentIndex)) {
    flagBtn.classList.add('flagged');
    flagText.textContent = 'Flagged';
  } else {
    flagBtn.classList.remove('flagged');
    flagText.textContent = 'Flag for Review';
  }

  // Nav buttons
  document.getElementById('prev-btn').disabled = state.currentIndex === 0;
  document.getElementById('next-btn').disabled = state.currentIndex === state.questions.length - 1;

  updatePalette();
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// OPTION SELECTION
// ============================================================
function selectOption(idx) {
  const q = state.questions[state.currentIndex];
  let selected = state.answers[state.currentIndex] || [];

  if (q.type === 'ms') {
    if (selected.includes(idx)) {
      selected = selected.filter(i => i !== idx);
    } else {
      selected = [...selected, idx];
    }
  } else {
    selected = [idx];
  }

  state.answers[state.currentIndex] = selected;
  renderQuestion();
}

// ============================================================
// NAVIGATION
// ============================================================
function prevQuestion() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    renderQuestion();
    scrollToTop();
  }
}

function nextQuestion() {
  if (state.currentIndex < state.questions.length - 1) {
    state.currentIndex++;
    renderQuestion();
    scrollToTop();
  }
}

function goToQuestion(idx) {
  state.currentIndex = idx;
  renderQuestion();
  scrollToTop();
  // Collapse mobile palette
  const panel = document.getElementById('side-panel');
  if (window.innerWidth <= 768) {
    panel.classList.remove('expanded');
  }
}

function scrollToTop() {
  document.getElementById('question-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// FLAG
// ============================================================
function toggleFlag() {
  if (state.flags.has(state.currentIndex)) {
    state.flags.delete(state.currentIndex);
  } else {
    state.flags.add(state.currentIndex);
  }
  renderQuestion();
}

// ============================================================
// PALETTE
// ============================================================
function buildPalette() {
  const grid = document.getElementById('palette-grid');
  grid.innerHTML = '';
  state.questions.forEach((_, idx) => {
    const box = document.createElement('div');
    box.className = 'palette-box';
    box.textContent = idx + 1;
    box.addEventListener('click', () => goToQuestion(idx));
    grid.appendChild(box);
  });
}

function updatePalette() {
  const boxes = document.getElementById('palette-grid').children;
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    box.className = 'palette-box';
    if (i === state.currentIndex) box.classList.add('current');
    if (state.answers[i] && state.answers[i].length > 0) box.classList.add('answered');
    if (state.flags.has(i)) box.classList.add('flagged');
  }
}

// ============================================================
// MOBILE PALETTE TOGGLE
// ============================================================
function togglePalette() {
  document.getElementById('side-panel').classList.toggle('expanded');
}

// ============================================================
// SUBMIT
// ============================================================
function confirmSubmit() {
  const unanswered = state.questions.length - Object.keys(state.answers).filter(k => state.answers[k].length > 0).length;
  const flagged = state.flags.size;
  let msg = 'Are you sure you want to submit your exam? This action cannot be undone.';
  if (unanswered > 0 || flagged > 0) {
    const parts = [];
    if (unanswered > 0) parts.push(unanswered + ' unanswered question' + (unanswered > 1 ? 's' : ''));
    if (flagged > 0) parts.push(flagged + ' flagged question' + (flagged > 1 ? 's' : ''));
    msg = 'You have ' + parts.join(' and ') + '. ' + msg;
  }
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('confirm-modal').classList.remove('active');
}

function submitExam() {
  if (state.submitted) return;
  state.submitted = true;
  closeModal();
  clearInterval(state.timerInterval);
  document.getElementById('timer-display').style.display = 'none';
  document.getElementById('exam-screen').style.display = 'none';
  showResults();
}

// ============================================================
// SCORING & RESULTS
// ============================================================
function showResults() {
  // Calculate scores
  let totalCorrect = 0;
  const domainScores = {};
  const domainTotals = {};
  const domainNames = {};

  state.questions.forEach((q, idx) => {
    if (!domainScores[q.domain]) {
      domainScores[q.domain] = 0;
      domainTotals[q.domain] = 0;
      domainNames[q.domain] = q.domainName;
    }
    domainTotals[q.domain]++;

    const selected = (state.answers[idx] || []).sort();
    const correct = [...q.correct].sort();

    if (selected.length === correct.length && selected.every((v, i) => v === correct[i])) {
      totalCorrect++;
      domainScores[q.domain]++;
    }
  });

  const total = state.questions.length;
  const pct = Math.round((totalCorrect / total) * 100);
  const passed = pct >= 70;

  // Banner
  const banner = document.getElementById('result-banner');
  banner.className = 'result-banner ' + (passed ? 'pass' : 'fail');
  document.getElementById('result-status').textContent = passed ? 'PASSED' : 'DID NOT PASS';
  document.getElementById('result-score').textContent = 'Score: ' + totalCorrect + ' / ' + total;
  document.getElementById('result-percent').textContent = pct + '%' + (passed ? '' : ' (70% required to pass)');

  // Domain breakdown
  const tbody = document.getElementById('domain-breakdown');
  tbody.innerHTML = '';
  for (let d = 1; d <= 6; d++) {
    if (!domainTotals[d]) continue;
    const dScore = domainScores[d];
    const dTotal = domainTotals[d];
    const dPct = Math.round((dScore / dTotal) * 100);
    let colorClass = 'pass-color';
    if (dPct < 50) colorClass = 'fail-color';
    else if (dPct < 70) colorClass = 'warn-color';

    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>Domain ' + d + ': ' + escapeHTML(domainNames[d]) + '</td>' +
      '<td>' + dScore + '/' + dTotal + '</td>' +
      '<td><div class="score-bar-cell"><div class="score-bar-track"><div class="score-bar-fill ' + colorClass + '" style="width:' + dPct + '%"></div></div><span class="score-label">' + dPct + '%</span></div></td>';
    tbody.appendChild(tr);
  }

  // Actions
  const actions = document.getElementById('result-actions');
  actions.innerHTML = '';
  if (passed) {
    const certBtn = document.createElement('button');
    certBtn.className = 'btn btn-success';
    certBtn.textContent = 'Download Certificate';
    certBtn.addEventListener('click', () => downloadCertificate(totalCorrect, total, pct));
    actions.appendChild(certBtn);
  }
  const homeBtn = document.createElement('button');
  homeBtn.className = 'btn btn-secondary';
  homeBtn.textContent = 'Return Home';
  homeBtn.addEventListener('click', () => { window.location.href = 'index.html'; });
  actions.appendChild(homeBtn);

  document.getElementById('results-screen').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// CERTIFICATE GENERATION
// ============================================================
function downloadCertificate(correct, total, pct) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#FFFDF7';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  const borderMargin = 40;
  const borderWidth = 3;
  ctx.strokeStyle = '#1a365d';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderMargin, borderMargin, canvas.width - borderMargin * 2, canvas.height - borderMargin * 2);

  // Inner border
  const innerMargin = 52;
  ctx.strokeStyle = '#6c9fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(innerMargin, innerMargin, canvas.width - innerMargin * 2, canvas.height - innerMargin * 2);

  // Corner accents
  const cornerSize = 30;
  const corners = [
    [borderMargin, borderMargin],
    [canvas.width - borderMargin, borderMargin],
    [borderMargin, canvas.height - borderMargin],
    [canvas.width - borderMargin, canvas.height - borderMargin]
  ];
  ctx.strokeStyle = '#1a365d';
  ctx.lineWidth = 3;
  corners.forEach(([cx, cy]) => {
    const dx = cx < canvas.width / 2 ? 1 : -1;
    const dy = cy < canvas.height / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(cx + dx * cornerSize, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * cornerSize);
    ctx.stroke();
  });

  // Decorative line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 160);
  ctx.lineTo(canvas.width - 300, 160);
  ctx.stroke();

  // Header text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4a5568';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.letterSpacing = '8px';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT', canvas.width / 2, 140);

  // cAIge logo
  ctx.fillStyle = '#1a365d';
  ctx.font = '700 64px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('cAIge', canvas.width / 2, 240);

  // Subtitle
  ctx.fillStyle = '#6c9fff';
  ctx.font = '400 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Certified AI Guardrail Engineer', canvas.width / 2, 280);

  // Decorative line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(400, 310);
  ctx.lineTo(canvas.width - 400, 310);
  ctx.stroke();

  // "This certifies that"
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 20px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('This certifies that', canvas.width / 2, 380);

  // Name
  ctx.fillStyle = '#1a365d';
  ctx.font = '700 42px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText(state.candidateName, canvas.width / 2, 440);

  // Name underline
  const nameWidth = ctx.measureText(state.candidateName).width;
  ctx.strokeStyle = '#1a365d';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo((canvas.width - nameWidth) / 2 - 20, 455);
  ctx.lineTo((canvas.width + nameWidth) / 2 + 20, 455);
  ctx.stroke();

  // Description
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  const desc1 = 'has successfully passed the Certified AI Guardrail Engineer (cAIge)';
  const desc2 = 'examination, demonstrating proficiency in AI guardrail design,';
  const desc3 = 'implementation, testing, and operations.';
  ctx.fillText(desc1, canvas.width / 2, 510);
  ctx.fillText(desc2, canvas.width / 2, 540);
  ctx.fillText(desc3, canvas.width / 2, 570);

  // Score and Date
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  ctx.fillStyle = '#4a5568';
  ctx.font = '400 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';

  // Left column: Date
  ctx.textAlign = 'center';
  ctx.fillText('Date of Certification', 450, 700);
  ctx.fillStyle = '#1a365d';
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText(dateStr, 450, 670);

  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(300, 680);
  ctx.lineTo(600, 680);
  ctx.stroke();

  // Right column: Score
  ctx.fillStyle = '#4a5568';
  ctx.font = '400 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Examination Score', canvas.width - 450, 700);
  ctx.fillStyle = '#1a365d';
  ctx.font = '600 18px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText(correct + ' / ' + total + ' (' + pct + '%)', canvas.width - 450, 670);

  ctx.strokeStyle = '#4a5568';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(canvas.width - 600, 680);
  ctx.lineTo(canvas.width - 300, 680);
  ctx.stroke();

  // Certificate ID
  const certId = generateCertId(state.candidateName, dateStr, pct);
  ctx.fillStyle = '#8b90a0';
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Certificate ID: ' + certId, canvas.width / 2, 780);

  // Decorative bottom line
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 820);
  ctx.lineTo(canvas.width - 300, 820);
  ctx.stroke();

  // Organization
  ctx.fillStyle = '#6c9fff';
  ctx.font = '600 16px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('caigeai.dev', canvas.width / 2, 860);

  ctx.fillStyle = '#8b90a0';
  ctx.font = '400 13px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Vendor-Agnostic AI Certification Programs', canvas.width / 2, 885);

  // Validity
  const expiryDate = new Date(today);
  expiryDate.setFullYear(expiryDate.getFullYear() + 3);
  const expiryStr = expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.fillStyle = '#8b90a0';
  ctx.font = '400 12px -apple-system, BlinkMacSystemFont, Segoe UI, system-ui, sans-serif';
  ctx.fillText('Valid through ' + expiryStr + ' | 3-year recertification required', canvas.width / 2, 920);

  // Download
  const link = document.createElement('a');
  link.download = 'cAIge-Certificate-' + state.candidateName.replace(/\s+/g, '-') + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function generateCertId(name, date, score) {
  const input = name + '|' + date + '|' + score;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + c;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return 'CAIGE-' + hex.substring(0, 4) + '-' + hex.substring(4, 8) + '-' + Date.now().toString(36).toUpperCase().slice(-4);
}
