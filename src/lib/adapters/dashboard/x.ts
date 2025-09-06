// Client adapter for Dashboard X integration.
// Wraps /api/x/* with typed responses and consistent error mapping.

export type RequestCtx = {
  devUserId?: string;
  csrf?: string;
  credentials?: RequestCredentials; // default 'include'
};

export class ApiError extends Error {
  code:
    | "UNAUTH"
    | "FORBIDDEN"
    | "RATE_LIMIT"
    | "DISABLED"
    | "BAD_REQUEST"
    | "SERVER"
    | "NETWORK";
  status?: number;
  details?: unknown;

  constructor(code: ApiError["code"], message: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function headers(ctx?: RequestCtx, contentType?: "json"): HeadersInit {
  const h: Record<string, string> = {};
  if (contentType === "json") h["content-type"] = "application/json";
  if (ctx?.devUserId) h["x-user-id"] = ctx.devUserId;
  if (ctx?.csrf) h["x-csrf-token"] = ctx.csrf;
  return h;
}

async function toJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function mapError(res: Response, body: any): ApiError {
  const msg =
    (body && (body.error || body.message)) ||
    (res.status === 503 ? "X integration disabled" : `Request failed (${res.status})`);
  if (res.status === 401) return new ApiError("UNAUTH", msg, res.status, body);
  if (res.status === 403) return new ApiError("FORBIDDEN", msg, res.status, body);
  if (res.status === 429) return new ApiError("RATE_LIMIT", msg, res.status, body);
  if (res.status === 503) return new ApiError("DISABLED", msg, res.status, body);
  if (res.status >= 400 && res.status < 500) return new ApiError("BAD_REQUEST", msg, res.status, body);
  return new ApiError("SERVER", msg, res.status, body);
}

function creds(ctx?: RequestCtx): RequestCredentials {
  return ctx?.credentials ?? "include";
}

// Types
export type XStatus = {
  connected: boolean;
  handle?: string;
  tokenExpiresAt?: string;
  scopeWarning?: string;
};

export type XHistoryItem = {
  id: string;
  status: string;
  scheduledFor: string | null;
  postedAt: string | null;
  errorMsg: string | null;
  tweetId?: string | null;
  tweetUrl?: string | null;
};

export type PostNowResult = {
  ok: boolean;
  tweet?: { id: string; text: string };
};

export type ScheduleResult = {
  ok: boolean;
  id: string;
  scheduledFor: string | null;
  status: string; // "scheduled"
};

export type RetryResult = {
  ok: boolean;
  id: string;
  status: string;
  scheduledFor: string | null;
};

export type XPrefs = {
  autoShareBlogToX: boolean;
};

// Adapter API

export async function fetchCsrf(): Promise<string | undefined> {
  try {
    const res = await fetch("/api/csrf", { credentials: "include" });
    const j = await toJson(res);
    if (!res.ok) return undefined;
    return typeof j?.token === "string" ? j.token : undefined;
  } catch {
    return undefined;
  }
}

export async function getStatus(ctx?: RequestCtx): Promise<XStatus> {
  try {
    const res = await fetch("/api/x/status", {
      method: "GET",
      credentials: creds(ctx),
      headers: headers(ctx),
      cache: "no-store",
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    return {
      connected: !!j.connected,
      handle: j.handle,
      tokenExpiresAt: j.tokenExpiresAt,
      scopeWarning: j.scopeWarning,
    };
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function getHistory(ctx?: RequestCtx): Promise<XHistoryItem[]> {
  try {
    const res = await fetch("/api/x/history", {
      method: "GET",
      credentials: creds(ctx),
      headers: headers(ctx),
      cache: "no-store",
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    return Array.isArray(j?.items) ? (j.items as XHistoryItem[]) : [];
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function disconnect(ctx?: RequestCtx): Promise<void> {
  try {
    const res = await fetch("/api/x/disconnect", {
      method: "POST",
      credentials: creds(ctx),
      headers: headers(ctx),
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function getAuthUrl(ctx?: RequestCtx): Promise<string> {
  try {
    const res = await fetch("/api/x/auth-url", {
      method: "GET",
      credentials: creds(ctx),
      headers: headers(ctx),
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    const url = String(j?.url || "");
    if (!url) throw new ApiError("SERVER", "Missing auth url in response", res.status);
    return url;
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function postNow(
  args: { text: string; file?: File | Blob | null },
  ctx?: RequestCtx,
): Promise<PostNowResult> {
  const { text, file } = args;
  try {
    let res: Response;
    if (file) {
      const fd = new FormData();
      fd.append("text", text);
      fd.append("file", file);
      res = await fetch("/api/x/post", {
        method: "POST",
        credentials: creds(ctx),
        headers: headers(ctx), // do not set content-type when using FormData
        body: fd,
      });
    } else {
      res = await fetch("/api/x/post", {
        method: "POST",
        credentials: creds(ctx),
        headers: headers(ctx, "json"),
        body: JSON.stringify({ text }),
      });
    }
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    // API returns: { ok: true, tweet: { id, text } }
    return { ok: !!j.ok, tweet: j?.tweet };
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function schedule(
  args: { text: string; scheduledFor?: string },
  ctx?: RequestCtx,
): Promise<ScheduleResult> {
  try {
    const res = await fetch("/api/x/schedule", {
      method: "POST",
      credentials: creds(ctx),
      headers: headers(ctx, "json"),
      body: JSON.stringify(args),
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    return {
      ok: !!j.ok,
      id: String(j.id),
      scheduledFor: j.scheduledFor ? String(j.scheduledFor) : null,
      status: String(j.status),
    };
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function retry(id: string, ctx?: RequestCtx): Promise<RetryResult> {
  try {
    const res = await fetch("/api/x/retry", {
      method: "POST",
      credentials: creds(ctx),
      headers: headers(ctx, "json"),
      body: JSON.stringify({ id }),
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    return {
      ok: !!j.ok,
      id: String(j.id),
      status: String(j.status),
      scheduledFor: j.scheduledFor ? String(j.scheduledFor) : null,
    };
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function getPrefs(ctx?: RequestCtx): Promise<XPrefs> {
  try {
    const res = await fetch("/api/x/prefs", {
      method: "GET",
      credentials: creds(ctx),
      headers: headers(ctx),
      cache: "no-store",
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    return { autoShareBlogToX: !!j.autoShareBlogToX };
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}

export async function setPrefs(next: boolean, ctx?: RequestCtx): Promise<XPrefs> {
  try {
    const res = await fetch("/api/x/prefs", {
      method: "PATCH",
      credentials: creds(ctx),
      headers: headers(ctx, "json"),
      body: JSON.stringify({ autoShareBlogToX: next }),
    });
    const j = await toJson(res);
    if (!res.ok) throw mapError(res, j);
    return { autoShareBlogToX: !!j.autoShareBlogToX };
  } catch (e: any) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("NETWORK", e?.message ?? "Network error");
  }
}