import { NextRequest, NextResponse } from "next/server";
import { classifyPoint, formatPointCoords } from "@/lib/gd-math";

function buildLocalTutorAnswer(question: string, contextPoints?: Array<{ label: string; x: number; y: number; z: number }>) {
  const q = question.toLowerCase();

  if (q.includes("xyz") || q.includes("ordem") || q.includes("confund")) {
    return "Na convenção brasileira (UERJ / Monge), a ordem é sempre alfabética: (Abscissa; Afastamento; Cota) = (x; y; z). A única 'pegadinha' na épura 2D é que o Plano Horizontal rebate 90° para baixo: por isso, o afastamento positivo (+y) vai para BAIXO da Linha de Terra, enquanto a cota positiva (+z) continua para CIMA!";
  }
  if (q.includes("épura") || q.includes("epura") || q.includes("rebat")) {
    return "A épura nasce quando giramos o Plano Horizontal (π) em 90° no sentido horário em torno da Linha de Terra (LT), mantendo o Plano Vertical (π') parado. Assim, os dois planos viram uma única folha 2D: o piso da frente (afastamento +) desce abaixo da LT e o piso de trás (afastamento −) sobe acima da LT.";
  }
  if (q.includes("diedro")) {
    return "Resumo rápido dos 4 Diedros — 1º (+; +): A' acima, A abaixo | 2º (−; +): ambos acima | 3º (−; −): A acima, A' abaixo | 4º (+; −): ambos abaixo. Dica: diedros ÍMPARES (1º e 3º) têm projeções em lados opostos da LT; diedros PARES (2º e 4º) têm projeções do mesmo lado!";
  }
  if (q.includes("bissetor") || q.includes("coincid") || q.includes("simétr")) {
    return "O 1º Bissetor (β₁₃) corta o 1º e o 3º diedros a 45°: nele afastamento = cota, e as projeções A e A' ficam simétricas em relação à LT. Já no 2º Bissetor (β₂₄, 2º e 4º diedros), afastamento = −cota, fazendo A e A' coincidirem exatamente no mesmo ponto (A ≡ A')!";
  }
  if (q.includes("exercício 1") || q.includes("exercicio 1") || q.includes("origem")) {
    return "No Exercício 1 da UERJ, (A)(+2; +5; +3) está no 1º Diedro e (B)(-2; -5; -3) está no 3º Diedro. Como (B) = −(A), o segmento (A)(B) passa exatamente pela origem O(0; 0; 0) sobre a Linha de Terra! Na épura, as projeções r e r' se cruzam sobre a LT em x = 0.";
  }
  if (q.includes("exercício 2") || q.includes("exercicio 2") || q.includes("colinear") || q.includes("triângulo") || q.includes("triangulo")) {
    return "No Exercício 2 da UERJ, (A)(+1; +2; +3), (B)(+2; +3; +4) e (C)(+3; +4; +5) crescem sempre (+1; +1; +1) de um ponto para o outro. Por isso eles são COLINEARES (não formam triângulo, e sim um segmento de reta no 1º Diedro, paralelo ao 1º Bissetor β₁₃)!";
  }

  if (contextPoints && contextPoints.length > 0) {
    const p = contextPoints[0];
    const info = classifyPoint(p.x, p.y, p.z, p.label);
    return `Olhando o ponto atual ${formatPointCoords(p.label, p.x, p.y, p.z)} na sua prancheta: ele está em ${info.title}. ${info.spatialDescription} ${info.epuraDescription}`;
  }

  return "Ótima pergunta! Em Geometria Descritiva, pense sempre em três passos: (1) leia na ordem (Abscissa; Afastamento; Cota), (2) localize no espaço em relação à parede π' e ao chão π, e (3) lembre que ao rebater para a épura, a cota positiva sobe (A') e o afastamento positivo desce (A). Experimente arrastar um ponto no Lab 3D/2D!";
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      question?: string;
      contextPoints?: Array<{ label: string; x: number; y: number; z: number }>;
      customApiKey?: string;
    };
    const question = (body.question ?? "").trim();
    if (!question) {
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    }

    const apiKey = (body.customApiKey || process.env.GEMINI_API_KEY || "").trim();
    if (apiKey) {
      const pointsDesc = (body.contextPoints ?? [])
        .map((p) => formatPointCoords(p.label, p.x, p.y, p.z))
        .join(", ");

      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
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
                    text: `Você é o Prof. Monge, tutor de Geometria Descritiva da UERJ (convenção brasileira: (abscissa; afastamento; cota), ponto espacial (A), projeção horizontal A em π, projeção vertical A' em π', rebatimento horário de π de modo que afastamento + vai abaixo da LT e cota + vai acima da LT). Responda de forma calorosa, objetiva e didática em português do Brasil (máx. 4 frases).\nPontos atuais na prancheta do aluno: ${pointsDesc || "nenhum"}.\nPergunta do aluno: ${question}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return NextResponse.json({ answer: text, source: "gemini" });
        }
      }
    }

    return NextResponse.json({
      answer: buildLocalTutorAnswer(question, body.contextPoints),
      source: "local-monge",
    });
  } catch {
    return NextResponse.json({
      answer: buildLocalTutorAnswer("epura"),
      source: "local-monge",
    });
  }
}
