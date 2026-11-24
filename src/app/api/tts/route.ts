import { NextRequest, NextResponse } from "next/server";

function pcm16ToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

type TtsTier = "gemini-3.8-flash-tts" | "gemini-3.8-flash-lite-tts";

function sanitizeForSpeech(input: string): string {
  return input
    .replace(/β₁₃/g, "primeiro bissetor")
    .replace(/β₂₄/g, "segundo bissetor")
    .replace(/π'/g, "pi linha")
    .replace(/πA/g, "pi anterior")
    .replace(/πP/g, "pi posterior")
    .replace(/π/g, "pi")
    .replace(/≡/g, " coincide com ")
    .replace(/\b([A-Za-z])'/g, "$1 linha")
    .replace(/\bLT\b/g, "Linha de Terra")
    .replace(/−(\d)/g, "menos $1")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      professor?: "monge" | "epura" | "dialogue";
      modelTier?: TtsTier;
      customApiKey?: string;
    };

    const text = (body.text ?? "").trim().slice(0, 1400);
    if (!text) {
      return NextResponse.json({ error: "Texto vazio" }, { status: 400 });
    }

    const apiKey = (body.customApiKey || process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) {
      return NextResponse.json(
        { fallback: true, reason: "no_api_key" },
        { status: 200 }
      );
    }

    const preferredTier: TtsTier =
      body.modelTier === "gemini-3.8-flash-lite-tts"
        ? "gemini-3.8-flash-lite-tts"
        : "gemini-3.8-flash-tts";

    const modelsToTry =
      preferredTier === "gemini-3.8-flash-lite-tts"
        ? ["gemini-3.8-flash-lite-tts", "gemini-3.8-flash-tts"]
        : ["gemini-3.8-flash-tts", "gemini-3.8-flash-lite-tts"];

    const isDialogue = body.professor === "dialogue";

    const speechConfig = isDialogue
      ? {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Prof. Monge",
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Charon" },
                },
              },
              {
                speaker: "Profa. Épura",
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: "Kore" },
                },
              },
            ],
          },
        }
      : {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: body.professor === "epura" ? "Kore" : "Charon",
            },
          },
        };

    const parts = isDialogue
      ? text
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean)
          .map((line) => {
            if (/^profa\.?\s*[eé]pura\s*:/i.test(line)) {
              return {
                text: sanitizeForSpeech(
                  line.replace(/^profa\.?\s*[eé]pura\s*:/i, "")
                ),
                speechMetadata: { speaker: "Profa. Épura" },
              };
            }
            return {
              text: sanitizeForSpeech(
                line.replace(/^prof\.?\s*monge\s*:/i, "")
              ),
              speechMetadata: { speaker: "Prof. Monge" },
            };
          })
      : [
          {
            text: sanitizeForSpeech(text),
          },
        ];

    let lastStatus = 0;
    let lastDetail = "";

    for (const model of modelsToTry) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig,
          },
        }),
      });

      if (!res.ok) {
        lastStatus = res.status;
        lastDetail = (await res.text().catch(() => "")).slice(0, 220);
        // If credits depleted (402) or invalid key (400/401/403), don't retry further models
        if (res.status === 402 || res.status === 401 || res.status === 403) {
          break;
        }
        continue;
      }

      const json = (await res.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: { data?: string; mimeType?: string };
            }>;
          };
        }>;
      };

      const inline = json.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData?.data
      )?.inlineData;

      if (!inline?.data) continue;

      const rawBytes = Buffer.from(inline.data, "base64");
      const mime = inline.mimeType || "audio/L16;rate=24000";

      let outBuffer: Buffer = rawBytes;
      let outMime = mime;
      if (
        mime.toLowerCase().includes("l16") ||
        mime.toLowerCase().includes("pcm")
      ) {
        const rateMatch = mime.match(/rate=(\d+)/i);
        const rate = rateMatch ? Number(rateMatch[1]) : 24000;
        outBuffer = pcm16ToWav(rawBytes, rate, 1);
        outMime = "audio/wav";
      }

      return NextResponse.json({
        fallback: false,
        audioBase64: outBuffer.toString("base64"),
        mimeType: outMime,
        modelUsed: model,
        voiceName: isDialogue
          ? "Charon + Kore"
          : body.professor === "epura"
            ? "Kore"
            : "Charon",
      });
    }

    return NextResponse.json(
      {
        fallback: true,
        reason:
          lastStatus === 402
            ? "credits_depleted"
            : lastStatus
              ? `gemini_http_${lastStatus}`
              : "empty_audio_payload",
        detail: lastDetail,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        fallback: true,
        reason: err instanceof Error ? err.message : "unknown_error",
      },
      { status: 200 }
    );
  }
}
