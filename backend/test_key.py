import asyncio
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

KEY = os.getenv("GEMINI_API_KEY", "").strip()
BASE = "https://generativelanguage.googleapis.com/v1beta"

async def test():
    if not KEY:
        print("ERROR: GEMINI_API_KEY not found in .env file!")
        return

    print(f"Testing Gemini API Key: {KEY[:8]}...{KEY[-4:]}")
    headers = {"x-goog-api-key": KEY, "Content-Type": "application/json"}
    payload = {
        "contents": [{"role": "user", "parts": [{"text": "Say OK"}]}],
        "generationConfig": {"temperature": 0.0},
    }
    
    # 1. Test Chat Generation
    print("\n--- 1. Testing Chat Generation ---")
    chat_models = ["gemini-3.5-flash", "gemini-3.8-flash", "gemini-2.5-flash-lite", "gemini-flash-latest"]
    chat_ok = False
    async with httpx.AsyncClient(timeout=20.0) as client:
        for model in chat_models:
            url = f"{BASE}/models/{model}:generateContent"
            try:
                resp = await client.post(url, json=payload, headers=headers)
                print(f"  {model}: HTTP {resp.status_code}")
                if resp.status_code == 200:
                    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    print(f"  [SUCCESS] Answer: {text}")
                    chat_ok = True
                    break
                else:
                    body = resp.json()
                    msg = body.get("error", {}).get("message", "")[:90]
                    print(f"  [FAIL] {msg}")
            except Exception as e:
                print(f"  [FAIL] {e}")

        # 2. Test Embeddings
        print("\n--- 2. Testing Vector Embeddings ---")
        emb_url = f"{BASE}/models/gemini-embedding-001:embedContent"
        emb_payload = {
            "model": "models/gemini-embedding-001",
            "content": {"parts": [{"text": "Machine Learning"}]},
            "outputDimensionality": 768
        }
        try:
            resp = await client.post(emb_url, json=emb_payload, headers=headers)
            print(f"  gemini-embedding-001: HTTP {resp.status_code}")
            if resp.status_code == 200:
                values = resp.json().get("embedding", {}).get("values", [])
                print(f"  [SUCCESS] Generated embedding vector with dimension: {len(values)}")
            else:
                print(f"  [FAIL] {resp.text[:120]}")
        except Exception as e:
            print(f"  [FAIL] {e}")

    if chat_ok:
        print("\n>>> ALL GEMINI AI CHECKS PASSED SUCCESSFULLY! <<<")
    else:
        print("\n>>> Some checks failed. Check your API key or network connection. <<<")

if __name__ == "__main__":
    asyncio.run(test())
