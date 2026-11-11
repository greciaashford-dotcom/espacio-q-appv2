"""Thin pass-through proxy in front of the Next.js server (pages, server actions, /api route handlers).

- Preview: supervisor runs Next.js on NEXT_INTERNAL_URL (:3000); the ingress sends /api/* here.
- Production container (nginx :8080 -> :8001, no Next.js process): if NEXT_INTERNAL_URL stays unreachable,
  this process starts the Next.js standalone server itself on 127.0.0.1:3100 and proxies every path to it.
No business logic here. /health answers immediately and never depends on Next.js or MongoDB.
"""
import asyncio
import logging
import os
import shutil
import subprocess
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from pymongo import MongoClient

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

logging.basicConfig(level=logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logger = logging.getLogger("next-proxy")

PRIMARY_URL = (os.environ.get("NEXT_INTERNAL_URL") or "").rstrip("/")
FALLBACK_PORT = 3100
FALLBACK_URL = f"http://127.0.0.1:{FALLBACK_PORT}"
STANDALONE_DIR = Path(__file__).resolve().parent.parent / "frontend" / ".next" / "standalone"
SPAWN_GRACE_SECONDS = 20

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers",
    "transfer-encoding", "upgrade", "content-length", "content-encoding",
}

state = {"upstream": PRIMARY_URL or None, "child": None}
client = httpx.AsyncClient(timeout=httpx.Timeout(120.0, connect=5.0), follow_redirects=False)


async def reachable(base: str) -> bool:
    try:
        return (await client.get(f"{base}/health", timeout=2.0)).status_code < 500
    except httpx.HTTPError:
        return False


def spawn_next() -> subprocess.Popen | None:
    server_js = STANDALONE_DIR / "server.js"
    node = shutil.which("node")
    if not node or not server_js.exists():
        logger.error("Cannot start Next.js: node=%s, server.js exists=%s (run `yarn build` in /app/frontend)", node, server_js.exists())
        return None
    env = {**os.environ, "PORT": str(FALLBACK_PORT), "HOSTNAME": "127.0.0.1", "NODE_ENV": "production"}
    logger.info("Starting Next.js standalone server on %s", FALLBACK_URL)
    return subprocess.Popen([node, str(server_js)], cwd=str(STANDALONE_DIR), env=env)


def stop_child():
    child = state["child"]
    if child and child.poll() is None:
        child.terminate()
    state["child"] = None


async def supervise_next():
    """Prefers the externally managed Next.js; otherwise keeps an own standalone server alive."""
    unreachable_since = asyncio.get_running_loop().time()
    while True:
        now = asyncio.get_running_loop().time()
        if PRIMARY_URL and await reachable(PRIMARY_URL):
            unreachable_since = now
            if state["upstream"] != PRIMARY_URL:
                logger.info("Using Next.js at %s", PRIMARY_URL)
            state["upstream"] = PRIMARY_URL
            stop_child()
        elif not PRIMARY_URL or now - unreachable_since >= SPAWN_GRACE_SECONDS:
            child = state["child"]
            if child is None or child.poll() is not None:
                state["child"] = await asyncio.to_thread(spawn_next)
            if await reachable(FALLBACK_URL):
                state["upstream"] = FALLBACK_URL
        await asyncio.sleep(2 if state["upstream"] is None else 5)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = asyncio.create_task(supervise_next())
    yield
    task.cancel()
    stop_child()
    await client.aclose()


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


def mongo_reachable() -> bool:
    url = os.environ.get("MONGO_URL")
    if not url:
        return False
    try:
        with MongoClient(url, serverSelectionTimeoutMS=1500) as mc:
            mc.admin.command("ping")
        return True
    except Exception:
        return False


@app.get("/health")
@app.get("/api/health")
async def health():
    return {"status": "ok", "next": state["upstream"] is not None}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy(path: str, request: Request):
    upstream_base = state["upstream"]
    if not upstream_base:
        return JSONResponse({"error": "Servicio iniciándose, inténtalo de nuevo en unos segundos."}, status_code=503)
    headers = [(k, v) for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP and k.lower() != "accept-encoding"]
    host = request.headers.get("host", "")
    if "x-forwarded-host" not in request.headers and host:
        headers.append(("x-forwarded-host", host))
    if "x-forwarded-proto" not in request.headers:
        headers.append(("x-forwarded-proto", request.url.scheme))
    headers.append(("accept-encoding", "identity"))
    body = await request.body()
    url = f"{upstream_base}/{path}"
    if request.url.query:
        url += f"?{request.url.query}"
    try:
        upstream = await client.request(request.method, url, headers=headers, content=body)
    except httpx.HTTPError as exc:
        logger.error("Next.js upstream unavailable: %s", exc)
        return JSONResponse({"error": "Servicio no disponible temporalmente."}, status_code=503)

    if upstream.status_code >= 500 and path.startswith("api/") and not await asyncio.to_thread(mongo_reachable):
        return JSONResponse({"error": "Base de datos no disponible temporalmente."}, status_code=503)

    out = Response(content=upstream.content, status_code=upstream.status_code)
    for k, v in upstream.headers.multi_items():
        if k.lower() not in HOP_BY_HOP:
            out.headers.append(k, v)
    return out
