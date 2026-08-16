import OpenAI from "openai";

const apiKey = process.env.POLLINATIONS_API_KEY || process.env.DEEPSEEK_API_KEY;
const baseURL = process.env.POLLINATIONS_BASE_URL || "https://gen.pollinations.ai/v1";

console.log("=== QURE AI: COMPREHENSIVE AI SUBSYSTEM DIAGNOSTIC ===");
console.log("Base URL:", baseURL);
console.log("API Key Present:", Boolean(apiKey));

const client = new OpenAI({
  apiKey,
  baseURL,
  defaultQuery: { key: apiKey },
  defaultHeaders: { Authorization: `Bearer ${apiKey}` },
  timeout: 25000,
});

async function main() {
  // 1. Test Text AI in Arabic
  console.log("\n[1/4] Testing Arabic Clinical Text Chat...");
  const t1Start = Date.now();
  const textRes = await client.chat.completions.create({
    model: "openai",
    messages: [
      { role: "system", content: "أنت Qure AI المستشار الطبي السريري." },
      { role: "user", content: "هل الباراسيتامول آمن للصداع الخفيف؟ أجب في جملة واحدة قاطعة." },
    ],
    temperature: 0.1,
    max_tokens: 100,
  });
  console.log("✓ Status: OK (Duration:", Date.now() - t1Start, "ms)");
  console.log("Output:", textRes.choices[0]?.message?.content?.trim());

  // 2. Test Real-time SSE Token Streaming
  console.log("\n[2/4] Testing Real-Time Token Streaming...");
  const t2Start = Date.now();
  const stream = await client.chat.completions.create({
    model: "openai",
    messages: [{ role: "user", content: "Say 'Qure AI is fully operational' word by word." }],
    stream: true,
    max_tokens: 30,
  });
  let collected = "";
  for await (const chunk of stream) {
    const token = chunk.choices?.[0]?.delta?.content || "";
    collected += token;
  }
  console.log("✓ Status: OK (Duration:", Date.now() - t2Start, "ms)");
  console.log("Streamed Output:", collected.trim());

  // 3. Test Vision / OCR
  console.log("\n[3/4] Testing Medical Vision & OCR Engine...");
  const t3Start = Date.now();
  const dummy1x1Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  const visionRes = await client.chat.completions.create({
    model: "openai",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What do you see in this image? Respond with a single short sentence." },
          { type: "image_url", image_url: { url: `data:image/png;base64,${dummy1x1Png}` } },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 50,
  });
  console.log("✓ Status: OK (Duration:", Date.now() - t3Start, "ms)");
  console.log("Vision Output:", visionRes.choices[0]?.message?.content?.trim());

  // 4. Test Llama Fallback Model
  console.log("\n[4/4] Testing Secondary Failover Model (Llama)...");
  const t4Start = Date.now();
  const llamaRes = await client.chat.completions.create({
    model: "llama",
    messages: [{ role: "user", content: "Respond with 'Llama failover ready'." }],
    max_tokens: 20,
  });
  console.log("✓ Status: OK (Duration:", Date.now() - t4Start, "ms)");
  console.log("Failover Output:", llamaRes.choices[0]?.message?.content?.trim());

  console.log("\n🎉 ALL 4 AI SUBSYSTEM TESTS COMPLETED WITH 100% SUCCESS!");
}

main().catch((err) => {
  console.error("\n❌ DIAGNOSTIC FAILURE:", err);
  process.exit(1);
});
