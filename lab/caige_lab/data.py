"""Fake tenant data: documents, orders, users, and simulated web pages."""
from __future__ import annotations

import json
import re
import sqlite3
from dataclasses import dataclass
from pathlib import Path

from .types import Document, Principal

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
WORD = re.compile(r"[a-z0-9]+")
STOPWORDS = {"the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "is", "are", "do", "does", "i", "my", "you", "your", "can", "what", "how", "when", "it", "be", "with", "at", "if"}


def _stem(word: str) -> str:
    for suffix in ("ing", "ed", "s"):
        if word.endswith(suffix) and len(word) - len(suffix) >= 3:
            return word[: -len(suffix)]
    return word


def _terms(text: str) -> set[str]:
    return {_stem(w) for w in WORD.findall(text.lower()) if w not in STOPWORDS}


@dataclass(frozen=True)
class StoredDocument(Document):
    visibility: str = "public"


class DocumentStore:
    """Keyword-overlap retrieval. Simple on purpose: the lab is about what reaches the model, not ranking quality."""

    def __init__(self, documents: list[StoredDocument]):
        self.documents = documents

    def search(self, query: str, top_k: int, tenant: str | None = None, include_internal: bool = True) -> list[StoredDocument]:
        q = _terms(query)
        scored = []
        for doc in self.documents:
            if tenant is not None and doc.tenant != tenant:
                continue  # authorization applied inside the query, not after ranking
            if not include_internal and doc.visibility == "internal":
                continue
            score = len(q & _terms(doc.title + " " + doc.text))
            if score:
                scored.append((score, doc.doc_id, doc))
        scored.sort(key=lambda item: (-item[0], item[1]))
        return [doc for _, _, doc in scored[:top_k]]


@dataclass
class LabData:
    store: DocumentStore
    db: sqlite3.Connection
    users_by_token: dict[str, Principal]
    tenants: dict[str, dict]
    web_pages: dict[str, str]


def load(data_dir: Path = DATA_DIR) -> LabData:
    tenants_raw = json.loads((data_dir / "tenants.json").read_text())
    users_raw = json.loads((data_dir / "users.json").read_text())
    web_raw = json.loads((data_dir / "web.json").read_text())

    docs = [
        StoredDocument(doc_id=d["doc_id"], tenant=tenant_id, title=d["title"], text=d["text"], visibility=d.get("visibility", "public"))
        for tenant_id, tenant in tenants_raw["tenants"].items()
        for d in tenant["documents"]
    ]

    db = sqlite3.connect(":memory:", check_same_thread=False)
    db.execute("CREATE TABLE orders (order_id TEXT PRIMARY KEY, tenant TEXT, customer TEXT, item TEXT, total REAL, status TEXT)")
    db.executemany(
        "INSERT INTO orders VALUES (:order_id, :tenant, :customer, :item, :total, :status)",
        tenants_raw["orders"],
    )

    users = {
        u["token"]: Principal(user_id=u["user_id"], tenant=u["tenant"], role=u["role"], email=u["email"])
        for u in users_raw["users"]
    }
    return LabData(store=DocumentStore(docs), db=db, users_by_token=users, tenants=tenants_raw["tenants"], web_pages=web_raw["pages"])
