---
title: "ChatGPT Outage Exposes Other Users' Chat Titles and Payment Details"
slug: chatgpt-redis-cache-leak
date: "2023-03-20"
category: [security]
sections: ["3.5", "3.7"]
summary: "A bug in the redis-py client library caused ChatGPT to return cached data to the wrong users, exposing chat titles and, for about 1.2% of Plus subscribers, partial payment details."
sources:
  - title: "OpenAI (2023), March 20 ChatGPT outage: Here's what happened"
    url: "https://openai.com/index/march-20-chatgpt-outage/"
  - title: "Help Net Security (2023), A bug revealed ChatGPT users' chat history, personal and billing data"
    url: "https://www.helpnetsecurity.com/2023/03/27/chatgpt-data-leak/"
  - title: "BleepingComputer (2023), OpenAI: ChatGPT payment data leak caused by open-source bug"
    url: "https://www.bleepingcomputer.com/news/security/openai-chatgpt-payment-data-leak-caused-by-open-source-bug/"
---

## What happened

On March 20, 2023, OpenAI took ChatGPT offline after users reported seeing the titles of other users' conversations in their chat history sidebar. OpenAI's post-mortem traced the problem to a bug in redis-py, the open-source Redis client library it used to cache user information from its asynchronous Python servers.

The library shared a pool of connections across requests. If a request was cancelled after its command was sent but before its response was read, the connection could be left holding that unread response. The next, unrelated request on the same connection could then receive it. A change OpenAI deployed that day caused a spike in request cancellations, which turned a rare race into a frequent one.

The same bug exposed payment-related information. During a window of about nine hours on March 20, some ChatGPT Plus subscribers could see another subscriber's first and last name, email address, payment address, card type, last four digits of the card number, and card expiration date, through the "Manage Subscription" page or subscription confirmation emails sent to the wrong user. Full card numbers were not exposed. OpenAI notified about 1.2% of Plus subscribers who were active in that window. OpenAI reported the bug to the redis-py maintainers with a patch, added checks that returned data matches the requesting user, and improved the robustness of its Redis cluster.

## Failure analysis

- **Category:** security impact (one user's data disclosed to another) with no adversary involved. The cause was a reliability bug in a third-party dependency.
- **Mechanism:** shared infrastructure (a connection pool feeding a cache) returned data to the wrong session, and nothing downstream verified ownership before display.
- **Missing controls:** an end-to-end check that data returned for a request belongs to the authenticated caller. The design trusted the cache layer to be correct.

## Controls that would have helped

- Key caches and session state by the verified principal, and check ownership on every read before returning data ([3.5 Data Protection and Isolation](/training/module/security-engineering/data-protection-and-isolation)).
- Treat open-source infrastructure libraries as part of the supply chain: track them, test failure paths such as cancellation under load, and patch quickly ([3.7 AI Supply Chain Security](/training/module/security-engineering/ai-supply-chain)).

## Lessons

One of the first widely reported data exposures in a consumer AI product had nothing to do with the model. AI applications are web applications first, and the classic isolation failures (shared caches, pooled connections, missing ownership checks) apply in full. A cheap ownership check at the point of return would have turned a cross-user leak into an error.
