"""Thin pass-through proxy: the Emergent ingress sends /api/* to :8001; every request is forwarded
unchanged to the Next.js server (App Router route handlers) running on :3000. No business logic here."""
import os
import logging

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

NEXT_INTERNAL_URL = os.environ["NEXT_INTERNAL_URL"].rstrip("/")

logger = logging.getLogger("api-proxy")
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
client = httpx.AsyncClient(base_url=NEXT_INTERNAL_URL, timeout=httpx.Timeout(120.0, connect=5.0), follow_redirects=False)

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers",
    "transfer-encoding", "upgrade", "content-length", "content-encoding",
}


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


@app.api_route("/api/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"])
async def proxy(path: str, request: Request):
    headers = [(k, v) for k, v in request.headers.items() if k.lower() not in HOP_BY_HOP and k.lower() != "accept-encoding"]
    host = request.headers.get("host", "")
    if "x-forwarded-host" not in request.headers and host:
        headers.append(("x-forwarded-host", host))
    if "x-forwarded-proto" not in request.headers:
        headers.append(("x-forwarded-proto", request.url.scheme))
    headers.append(("accept-encoding", "identity"))
    body = await request.body()
    url = f"/api/{path}"
    if request.url.query:
        url += f"?{request.url.query}"
    try:
        upstream = await client.request(request.method, url, headers=headers, content=body)
    except httpx.HTTPError as exc:
        logger.error("Next.js upstream unavailable: %s", exc)
        return JSONResponse({"error": "Servicio no disponible temporalmente."}, status_code=503)

    if upstream.status_code >= 500 and not mongo_reachable():
        return JSONResponse({"error": "Base de datos no disponible temporalmente."}, status_code=503)

    out = Response(content=upstream.content, status_code=upstream.status_code)
    for k, v in upstream.headers.multi_items():
        if k.lower() not in HOP_BY_HOP:
            out.headers.append(k, v)
    return out


@app.on_event("shutdown")
async def shutdown():
    await client.aclose()
