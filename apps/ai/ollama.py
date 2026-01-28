from __future__ import annotations

import json
import os
import urllib.error
import urllib.request


class OllamaError(RuntimeError):
    pass


def _post_json(*, url: str, payload: dict, timeout: float = 120.0) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        raise OllamaError(f"Ollama HTTP {e.code}: {body}")
    except Exception as e:
        raise OllamaError(f"Не удалось обратиться к Ollama: {e}")

    try:
        return json.loads(raw) if raw else {}
    except Exception as e:
        raise OllamaError(f"Некорректный ответ Ollama: {e}")


def ollama_chat(*, model: str, messages: list[dict], base_url: str | None = None, timeout: float = 120.0) -> str:
    base = base_url or os.getenv("OLLAMA_BASE_URL") or "http://127.0.0.1:11434"
    url = base.rstrip("/") + "/api/chat"

    result = _post_json(
        url=url,
        payload={
            "model": model,
            "messages": messages,
            "stream": False,
        },
        timeout=timeout,
    )

    msg = (result.get("message") or {}).get("content")
    if not msg:
        raise OllamaError("Пустой ответ от Ollama")
    return str(msg)
