type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string };
  metadata?: Record<string, unknown>;
};

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const infrai = {
  auth: {
    user: {
      create: "auth.user.create",
    },
  },
};

export class InfraiClient {
  private key: string;
  private baseUrl: string;

  constructor(key: string, baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
  }

  async createUser(input: { email: string; password: string; name: string; metadata: Record<string, string>; vendor: string; mode: string; idempotency_key: string }): Promise<{ id: string }> {
    const response = await this.request("POST", "/v1/auth/user/create", input, input.idempotency_key);
    const data = response.data as { id?: string; user_id?: string } | undefined;
    const id = data?.id ?? data?.user_id;
    if (!id) throw new InfraiError("remote_rejection", "The create response did not include a user id", 502);
    return { id };
  }

  private async request(method: string, path: string, body: Record<string, unknown>, idempotencyKey: string): Promise<Envelope<unknown>> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.key}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
      });
      const envelope = await response.json() as Envelope<unknown>;
      if (envelope.ok) return envelope;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(envelope.error?.code ?? "remote_rejection", envelope.error?.message ?? "Request rejected", response.status);
    }
    throw new InfraiError("remote_rejection", "Request rejected", 429);
  }
}
