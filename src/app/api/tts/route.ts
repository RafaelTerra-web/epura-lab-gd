import { NextRequest, NextResponse } from "next/server";

function pcm16ToWav(pcmBuffer: Buffer, sampleRate = 24000, channels = 1): Buffer {
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcmBuffer.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([header, pcmBuffer]);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      text?: string;
      professor?: "monge" | "epura";
      customApiKey?: string;
    };
    const text = (body.text ?? "").trim().slice(0, 900);
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

    const voiceName = body.professor === "epura" ? "Kore" : "Puck";
    const endpoint =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Fale em português do Brasil com tom didático, caloroso e claro de professor universitário:\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          fallback: true,
          reason: res.status === 402 ? "credits_depleted" : `gemini_http_${res.status}`,
          detail: errText.slice(0, 200),
        },
        { status: 200 }
      );
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

    if (!inline?.data) {
      return NextResponse.json(
        { fallback: true, reason: "empty_audio_payload" },
        { status: 200 }
      );
    }

    const rawBytes = Buffer.from(inline.data, "base64");
    const mime = inline.mimeType || "audio/L16;rate=24000";

    let outBuffer: Buffer = rawBytes;
    let outMime = mime;
    if (mime.toLowerCase().includes("l16") || mime.toLowerCase().includes("pcm")) {
      const rateMatch = mime.match(/rate=(\d+)/i);
      const rate = rateMatch ? Number(rateMatch[1]) : 24000;
      outBuffer = pcm16ToWav(rawBytes, rate, 1);
      outMime = "audio/wav";
    }

    return NextResponse.json({
      fallback: false,
      audioBase64: outBuffer.toString("base64"),
      mimeType: outMime,
      voiceName,
    });
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
