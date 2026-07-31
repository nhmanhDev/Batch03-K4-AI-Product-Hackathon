/**
 * Hạ tầng gọi AI dùng chung cho mọi endpoint (tutor / flashcards / mindmap).
 *
 * Tách ra từ api/tutor/route.ts để 3 endpoint không lặp lại chuỗi fallback,
 * cấu hình model và rate limit. Mỗi endpoint chỉ còn khác nhau ở đúng thứ
 * đáng khác: system prompt + JSON schema của riêng nó.
 */

export const MODELS = {
  gemini: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  deepseek: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
  openai: process.env.OPENAI_MODEL || "o4-mini",
};

/** Rate limit in-memory theo IP — xem ghi chú giới hạn ở api/tutor/route.ts. */
const RATE_LIMIT_WINDOW_MS = 60_000;
const requestLog = new Map<string, number[]>();

export function checkRateLimit(key: string, max: number): { ok: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const hits = (requestLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= max) {
    return { ok: false, retryAfterSec: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  requestLog.set(key, hits);
  return { ok: true };
}

export function clientKeyOf(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

async function callGemini(system: string, user: string, schema: object): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 180)}`);
  const j = await res.json();
  const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("không có nội dung trả về");
  return text;
}

/** DeepSeek và OpenAI đều dùng giao thức /chat/completions. */
async function callChatCompletions(
  baseUrl: string,
  key: string,
  model: string,
  system: string,
  user: string,
  reasoning: boolean
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      // Dòng reasoning (o4-mini) không nhận temperature và dùng max_completion_tokens
      ...(reasoning ? { max_completion_tokens: 2000 } : { temperature: 0.2, max_tokens: 2000 }),
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 180)}`);
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content;
  if (!text) throw new Error("không có nội dung trả về");
  return text;
}

/**
 * Chuỗi provider theo thứ tự ưu tiên. `systemForJsonText` là bản system prompt
 * có mô tả JSON bằng chữ — dành cho 2 provider không nhận schema qua API.
 */
export function providerChain(
  system: string,
  systemForJsonText: string,
  user: string,
  schema: object
) {
  const chain: Array<{ name: string; model: string; run: () => Promise<string> }> = [];
  if (process.env.GEMINI_API_KEY)
    chain.push({ name: "gemini", model: MODELS.gemini, run: () => callGemini(system, user, schema) });
  if (process.env.DEEPSEEK_API_KEY)
    chain.push({
      name: "deepseek",
      model: MODELS.deepseek,
      run: () =>
        callChatCompletions(
          "https://api.deepseek.com",
          process.env.DEEPSEEK_API_KEY!,
          MODELS.deepseek,
          systemForJsonText,
          user,
          false
        ),
    });
  if (process.env.OPENAI_API_KEY)
    chain.push({
      name: "openai",
      model: MODELS.openai,
      run: () =>
        callChatCompletions(
          "https://api.openai.com/v1",
          process.env.OPENAI_API_KEY!,
          MODELS.openai,
          systemForJsonText,
          user,
          true
        ),
    });
  return chain;
}

/** Chạy lần lượt chuỗi provider, trả về kết quả đầu tiên parse được. */
export async function runChain<T>(
  chain: ReturnType<typeof providerChain>,
  parse: (raw: string) => T
): Promise<{ data: T; provider: string; model: string; latencyMs: number; fellBackFrom: string[] }> {
  const started = Date.now();
  const fellBackFrom: string[] = [];
  let lastErr = "không có provider nào khả dụng";

  for (const p of chain) {
    try {
      const data = parse(await p.run());
      return {
        data,
        provider: p.name,
        model: p.model,
        latencyMs: Date.now() - started,
        fellBackFrom,
      };
    } catch (e) {
      lastErr = (e as Error).message;
      fellBackFrom.push(p.name);
    }
  }
  throw new Error(lastErr);
}
