"""Manual NVIDIA NIM API smoke test for Supru.

Requires NVIDIA_API_KEY in the environment. Never prints the key.
"""
import os
import sys
from openai import OpenAI

BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"


def main() -> int:
    api_key = os.environ.get("NVIDIA_API_KEY", "").strip()
    if not api_key:
        print("ERROR: NVIDIA_API_KEY is not set. Add it as a GitHub Actions secret.", file=sys.stderr)
        return 2

    model = os.environ.get("NVIDIA_MODEL", DEFAULT_MODEL).strip()
    if not model:
        print("ERROR: NVIDIA_MODEL is empty.", file=sys.stderr)
        return 2

    try:
        client = OpenAI(base_url=BASE_URL, api_key=api_key, timeout=45.0, max_retries=1)
        result = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are testing NVIDIA NIM connectivity. Reply briefly in English.",
                },
                {"role": "user", "content": "Reply with: NVIDIA API connection successful."},
            ],
            temperature=0.2,
            max_tokens=96,
            stream=False,
        )
        answer = result.choices[0].message.content
        if not isinstance(answer, str) or not answer.strip():
            print(f"ERROR: NVIDIA model {model!r} returned no text.", file=sys.stderr)
            return 1
        print(f"PASS: NVIDIA API responded using model {model}.")
        print("Model response:")
        print(answer.strip())
        return 0
    except Exception as exc:
        # Provider exceptions can include request metadata; deliberately never print
        # environment variables or the client configuration.
        print(f"FAIL: NVIDIA API request failed for model {model}: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
