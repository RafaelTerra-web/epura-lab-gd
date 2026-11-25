import { NextRequest, NextResponse } from "next/server";
import { classifyPoint, formatPointCoords, formatSigned } from "@/lib/gd-math";
import {
  SpotlightTarget,
  TutorApiResponse,
  TutorDirectorCommand,
} from "@/lib/director";

interface ContextPoint {
  label: string;
  x: number;
  y: number;
  z: number;
}

function clampCoord(n: number): number {
  return Math.max(-5, Math.min(5, Math.round(n * 2) / 2));
}

function extractPointFromText(text: string): ContextPoint | null {
  // Matches: (A)(+2; -3; +4) or A(2, -3, 4) or ponto (2; 5; 3)
  const named = text.match(
    /\(?([A-Za-z])\)?\s*\(\s*([+-]?\d+(?:[.,]\d+)?)\s*[;,]\s*([+-]?\d+(?:[.,]\d+)?)\s*[;,]\s*([+-]?\d+(?:[.,]\d+)?)\s*\)/
  );
  if (named) {
    return {
      label: named[1].toUpperCase(),
      x: clampCoord(Number(named[2].replace(",", "."))),
      y: clampCoord(Number(named[3].replace(",", "."))),
      z: clampCoord(Number(named[4].replace(",", "."))),
    };
  }
  const unnamed = text.match(
    /\(\s*([+-]?\d+(?:[.,]\d+)?)\s*[;,]\s*([+-]?\d+(?:[.,]\d+)?)\s*[;,]\s*([+-]?\d+(?:[.,]\d+)?)\s*\)/
  );
  if (unnamed) {
    return {
      label: "A",
      x: clampCoord(Number(unnamed[1].replace(",", "."))),
      y: clampCoord(Number(unnamed[2].replace(",", "."))),
      z: clampCoord(Number(unnamed[3].replace(",", "."))),
    };
  }
  return null;
}

function buildLocalDirectorResponse(
  question: string,
  contextPoints?: ContextPoint[]
): TutorApiResponse {
  const q = question.toLowerCase();
  const primary = contextPoints?.[0] ?? { label: "A", x: 2, y: 4, z: 3 };

  // 1. Custom coordinates explicitly typed by the student!
  const parsed = extractPointFromText(question);
  if (parsed) {
    const info = classifyPoint(parsed.x, parsed.y, parsed.z, parsed.label);
    let target: SpotlightTarget = "point_space";
    let caption = `${formatPointCoords(parsed.label, parsed.x, parsed.y, parsed.z)} · ${info.shortBadge}`;
    if (q.includes("afast")) {
      target = "afastamento";
      caption = `Afastamento ${formatSigned(parsed.y)} (${parsed.y >= 0 ? "desce" : "sobe"} na LT!)`;
    } else if (q.includes("cota")) {
      target = "cota";
      caption = `Cota ${formatSigned(parsed.z)} (${parsed.z >= 0 ? "sobe" : "desce"} p/ ${parsed.label}')`;
    } else if (q.includes("absciss") || q.includes("chamada")) {
      target = "abscissa";
      caption = `Linha de Chamada em x = ${formatSigned(parsed.x)}`;
    } else if (info.bisector === "B24") {
      target = "coincident";
      caption = `2º Bissetor: ${parsed.label} ≡ ${parsed.label}' coincidem!`;
    }

    const wantFold = q.includes("épur") || q.includes("epur") || q.includes("rebat");
    return {
      professor: "monge",
      source: "local-monge",
      answer: `Coloquei ${formatPointCoords(parsed.label, parsed.x, parsed.y, parsed.z)} ao vivo no laboratório e destaquei para você! Ele está em ${info.title}. ${info.spatialDescription} ${info.epuraDescription}`,
      director: {
        points: [parsed],
        connectLine: false,
        foldAngle: wantFold ? 90 : 0,
        showXYZ: true,
        showBisectors: Boolean(info.bisector),
        cameraPreset: wantFold ? "front" : "iso",
        spotlight: {
          target,
          pointLabel: parsed.label,
          caption,
          professor: "monge",
        },
      },
    };
  }

  // 2. Exercício 1 da UERJ
  if (
    q.includes("exercício 1") ||
    q.includes("exercicio 1") ||
    q.includes("ex 1") ||
    q.includes("ex. 1") ||
    q.includes("origem")
  ) {
    return {
      professor: "epura",
      source: "local-monge",
      answer:
        "Carreguei o Exercício 1 da sua Aula 1 da UERJ e circulei a Origem O(0; 0; 0)! Repare que (A)(+2; +5; +3) está no 1º Diedro e (B)(−2; −5; −3) está no 3º Diedro com todos os sinais opostos. Por isso a reta (r) atravessa a Linha de Terra exatamente na origem — na épura, r e r' se cruzam sobre a LT em x = 0!",
      director: {
        presetId: "uerj-ex1",
        foldAngle: q.includes("épur") || q.includes("epur") ? 90 : 0,
        cameraPreset: q.includes("épur") || q.includes("epur") ? "front" : "iso",
        showXYZ: true,
        spotlight: {
          target: "origin",
          caption: "Origem O(0;0;0): r e r' cruzam a LT aqui!",
          professor: "epura",
        },
      },
    };
  }

  // 3. Exercício 2 da UERJ (Colinearidade!)
  if (
    q.includes("exercício 2") ||
    q.includes("exercicio 2") ||
    q.includes("ex 2") ||
    q.includes("ex. 2") ||
    q.includes("colinear") ||
    q.includes("triângulo") ||
    q.includes("triangulo")
  ) {
    return {
      professor: "epura",
      source: "local-monge",
      answer:
        "Olha o Exercício 2 da UERJ destacado no laboratório! Acendi também o 1º Bissetor (β₁₃). Muita gente acha que 3 pontos viram triângulo, mas de (A) para (B) e de (B) para (C) cada coordenada sobe exatamente +1. Eles são COLINEARES — formam uma única reta no 1º Diedro paralela a β₁₃!",
      director: {
        presetId: "uerj-ex2",
        showBisectors: true,
        showXYZ: true,
        foldAngle: q.includes("épur") || q.includes("epur") ? 90 : 0,
        spotlight: {
          target: "line",
          caption: "3 pontos COLINEARES paralelos a β₁₃!",
          professor: "epura",
        },
      },
    };
  }

  // 4. Paralelo 3D Computação (Y-Up) vs GD (Z-Up)
  if (
    q.includes("y-up") ||
    q.includes("z-up") ||
    q.includes("unity") ||
    q.includes("three") ||
    q.includes("computa") ||
    q.includes("blender") ||
    q.includes("altura")
  ) {
    return {
      professor: "monge",
      source: "local-monge",
      answer:
        "Exatamente! Na computação gráfica de jogos e WebGL (Three.js, Unity, OpenGL), a altura é Y (Y-Up). Já na Geometria Descritiva da UERJ, Engenharia e Blender/CAD usa-se Z-Up: X é Abscissa, Y é Afastamento (frente/trás) e Z é Cota (altura — circulada agora no Lab!). Para converter GD (x; y; z) para Three.js, troque Y com Z: Vector3(x, z, y)!",
      director: {
        showXYZ: true,
        foldAngle: 0,
        cameraPreset: "iso",
        spotlight: {
          target: "cota",
          pointLabel: primary.label,
          caption: "Em GD (Z-Up), Altura = Cota (+Z)!",
          professor: "monge",
        },
      },
    };
  }

  // 5. Linha de Terra
  if (q.includes("linha de terra") || /\blt\b/.test(q)) {
    return {
      professor: "monge",
      source: "local-monge",
      answer:
        "Circulei a Linha de Terra (LT) no espaço 3D e na Épura 2D! Ela é a reta de interseção entre o chão horizontal (π) e a parede vertical (π') — a dobradiça em torno da qual o plano horizontal gira 90° para formar a épura. Toda medida de cota e afastamento parte perpendicularmente dela!",
      director: {
        foldAngle: 0,
        showXYZ: true,
        spotlight: {
          target: "lt",
          caption: "Linha de Terra (LT): dobradiça de π e π'",
          professor: "monge",
        },
      },
    };
  }

  // 6. Afastamento (e por que +Y desce na épura!)
  if (q.includes("afastamento") || q.includes("desce") || q.includes("invert")) {
    const fold = q.includes("3d") ? 0 : 90;
    return {
      professor: "monge",
      source: "local-monge",
      answer: `Destaquei o Afastamento do ponto (${primary.label}) e rebati a épura para você ver ao vivo! Afastamento é a distância até a parede vertical π' (2ª coordenada Y). Como o piso frontal gira 90° no sentido horário para baixo da LT, afastamento positivo (${formatSigned(primary.y)}) vai para ${primary.y >= 0 ? "ABAIXO" : "ACIMA"} da Linha de Terra!`,
      director: {
        foldAngle: fold,
        cameraPreset: fold >= 85 ? "front" : "iso",
        showXYZ: true,
        spotlight: {
          target: "afastamento",
          pointLabel: primary.label,
          caption: `Afastamento (${formatSigned(primary.y)}): +Y DESCE na LT!`,
          professor: "monge",
        },
      },
    };
  }

  // 7. Cota
  if (q.includes("cota")) {
    return {
      professor: "epura",
      source: "local-monge",
      answer: `Circulei a Cota de (${primary.label}) em destaque! A Cota é a 3ª coordenada (eixo Z): mede a altura do ponto em relação ao Plano Horizontal π. Como a parede vertical π' não gira no rebatimento, cota positiva sobe acima da LT (marcando ${primary.label}') e cota negativa desce abaixo da LT.`,
      director: {
        foldAngle: 0,
        showXYZ: true,
        spotlight: {
          target: "cota",
          pointLabel: primary.label,
          caption: `Cota (${formatSigned(primary.z)}): altura na parede π'`,
          professor: "epura",
        },
      },
    };
  }

  // 8. Abscissa / Linha de Chamada
  if (q.includes("abscissa") || q.includes("linha de chamada") || q.includes("chamada")) {
    return {
      professor: "epura",
      source: "local-monge",
      answer: `Circulei a Abscissa e a Linha de Chamada de (${primary.label})! A Abscissa é o 1º número (eixo X) medido sobre a Linha de Terra. Ela determina a coluna vertical perpendicular à LT onde ${primary.label}' e ${primary.label} ficam obrigatoriamente alinhados!`,
      director: {
        showXYZ: true,
        spotlight: {
          target: "abscissa",
          pointLabel: primary.label,
          caption: `Abscissa x=${formatSigned(primary.x)} · Linha de Chamada`,
          professor: "epura",
        },
      },
    };
  }

  // 9. Planos Bissetores (β₁₃ e β₂₄)
  if (q.includes("bissetor") || q.includes("coincid") || q.includes("simétr") || q.includes("simetr")) {
    const isB2 = q.includes("2") || q.includes("segundo") || q.includes("coincid");
    return {
      professor: "monge",
      source: "local-monge",
      answer: isB2
        ? "Acendi os planos bissetores e rebati para 90°! Olha o círculo sobre B ≡ B': no 2º Bissetor (β₂₄), o afastamento (−3) e a cota (+3) têm mesmo tamanho e sinais opostos. Quando o piso traseiro sobe no rebatimento, B cai exatamente em cima de B'!"
        : "Ativei os planos bissetores (a 45°) no laboratório! No 1º Bissetor (β₁₃), afastamento e cota são iguais (+3 e +3), deixando A' e A simétricos em relação à LT. Já no 2º Bissetor (β₂₄), B e B' coincidem no mesmo ponto!",
      director: {
        presetId: "bisectors",
        showBisectors: true,
        foldAngle: isB2 ? 90 : 0,
        cameraPreset: isB2 ? "front" : "iso",
        spotlight: {
          target: isB2 ? "coincident" : "point_space",
          pointLabel: isB2 ? "B" : "A",
          caption: isB2
            ? "2º Bissetor (β₂₄): B ≡ B' coincidem!"
            : "1º Bissetor (β₁₃): projeções simétricas!",
          professor: "monge",
        },
      },
    };
  }

  // 10. Specific Diedro requests (1º, 2º, 3º, 4º)
  if (q.includes("2º") || q.includes("segundo diedro") || q.includes("2o diedro")) {
    return {
      professor: "monge",
      source: "local-monge",
      answer:
        "Coloquei um ponto (A)(+1; −4; +3) no 2º Diedro (atrás da parede π' e acima do chão π) e destaquei o afastamento na épura! Repare que no 2º Diedro AMBAS as projeções A e A' ficam ACIMA da Linha de Terra porque o piso traseiro rebate para cima!",
      director: {
        points: [{ label: "A", x: 1, y: -4, z: 3 }],
        connectLine: false,
        foldAngle: 90,
        cameraPreset: "front",
        showXYZ: true,
        spotlight: {
          target: "afastamento",
          pointLabel: "A",
          caption: "2º Diedro (−;+): A e A' ficam ACIMA da LT!",
          professor: "monge",
        },
      },
    };
  }
  if (q.includes("3º") || q.includes("terceiro diedro") || q.includes("3o diedro")) {
    return {
      professor: "monge",
      source: "local-monge",
      answer:
        "Coloquei (A)(−1; −4; −3) no 3º Diedro (atrás de π' e abaixo de π)! Ele é o espelho exato do 1º Diedro: na épura, o afastamento negativo faz A subir ACIMA da LT e a cota negativa faz A' descer ABAIXO da LT!",
      director: {
        points: [{ label: "A", x: -1, y: -4, z: -3 }],
        connectLine: false,
        foldAngle: 90,
        cameraPreset: "front",
        showXYZ: true,
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "3º Diedro (−;−): A sobe e A' desce!",
          professor: "monge",
        },
      },
    };
  }
  if (q.includes("4º") || q.includes("quarto diedro") || q.includes("4o diedro")) {
    return {
      professor: "monge",
      source: "local-monge",
      answer:
        "Coloquei (A)(+2; +4; −3) no 4º Diedro (à frente de π' e abaixo de π)! Como tanto o afastamento positivo quanto a cota negativa vão para baixo da LT, AMBAS as projeções A e A' ficam ABAIXO da Linha de Terra!",
      director: {
        points: [{ label: "A", x: 2, y: 4, z: -3 }],
        connectLine: false,
        foldAngle: 90,
        cameraPreset: "front",
        showXYZ: true,
        spotlight: {
          target: "point_space",
          pointLabel: "A",
          caption: "4º Diedro (+;−): A e A' ficam ABAIXO da LT!",
          professor: "monge",
        },
      },
    };
  }
  if (q.includes("diedro")) {
    return {
      professor: "monge",
      source: "local-monge",
      answer:
        "Carreguei um ponto em cada um dos 4 Diedros e girei a câmera para o Perfil! Dica de ouro: nos diedros ÍMPARES (1º e 3º), as projeções ficam em lados OPOSTOS da LT; nos PARES (2º e 4º), ficam do MESMO lado (2º acima, 4º abaixo)!",
      director: {
        presetId: "four-diedros",
        foldAngle: 0,
        cameraPreset: "profile",
        showXYZ: true,
        spotlight: {
          target: "lt",
          caption: "4 Diedros no sentido anti-horário em torno da LT",
          professor: "monge",
        },
      },
    };
  }

  // 11. Épura / Rebatimento
  if (q.includes("épura") || q.includes("epura") || q.includes("rebat")) {
    return {
      professor: "epura",
      source: "local-monge",
      answer:
        "Acionei o rebatimento de 90° agora mesmo para você assistir o espaço virar papel! O plano vertical π' fica fixo enquanto o chão horizontal π gira no sentido horário em torno da Linha de Terra — levando o afastamento positivo para baixo e o negativo para cima!",
      director: {
        foldAngle: 90,
        cameraPreset: "front",
        spotlight: {
          target: "afastamento",
          pointLabel: primary.label,
          caption: "Rebatimento 90°: o chão π girou para virar 2D!",
          professor: "epura",
        },
      },
    };
  }

  // 12. Default: Inspect current point on the board!
  const info = classifyPoint(primary.x, primary.y, primary.z, primary.label);
  return {
    professor: "monge",
    source: "local-monge",
    answer: `Circulei o ponto atual ${formatPointCoords(primary.label, primary.x, primary.y, primary.z)} na sua prancheta! Ele está em ${info.title}. ${info.spatialDescription} ${info.epuraDescription} Se quiser, digite qualquer coordenada como (P)(+3; -2; +4) ou peça para eu circular a Linha de Terra, Cota ou Afastamento!`,
    director: {
      spotlight: {
        target: "point_space",
        pointLabel: primary.label,
        caption: `${formatPointCoords(primary.label, primary.x, primary.y, primary.z)} · ${info.shortBadge}`,
        professor: "monge",
      },
    },
  };
}

function buildLocalCalcResponse(question: string): TutorApiResponse {
  const q = question.toLowerCase();

  if (q.includes("domínio") || q.includes("dominio")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "Domínio natural é o maior subconjunto de ℝ onde a fórmula de f(x) faz sentido sem quebrar nenhuma regra matemática: (1) denominador diferente de zero, (2) dentro de raiz de índice par maior ou igual a zero (≥ 0) e (3) dentro de logaritmo estritamente maior que zero (> 0)! Abra o Lab de Funções na função Raiz √x ou ln(x) para ver o domínio iluminado direto no eixo X.",
    };
  }
  if (q.includes("raiz") || q.includes("zero")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "A raiz (ou zero) de uma função é todo valor x do domínio tal que f(x) = 0. Geometricamente, são os pontos exatos onde o gráfico y = f(x) corta o eixo horizontal X! Por exemplo, em f(x) = 0,5x² − 2, as raízes são x = −2 e x = +2.",
    };
  }
  if (q.includes("intervalo") || q.includes("[a") || q.includes("]a") || q.includes("desigualdade") || q.includes("inequa")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "No intervalo fechado [a, b] = { x ∈ ℝ / a ≤ x ≤ b } os extremos a e b ENTRAM (bolinha fechada ●). No aberto ]a, b[ = { x ∈ ℝ / a < x < b } eles FICAM FORA (bolinha aberta ○). E nas desigualdades, lembre sempre: ao multiplicar ou dividir por um número negativo, o sinal da desigualdade inverte!",
    };
  }
  if (q.includes("natural") || q.includes("raciona") || q.includes("inteiro") || q.includes("conjunto") || q.includes("número real") || q.includes("numero real")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "A hierarquia é ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ: Naturais ℕ = {1,2,3,...}; Inteiros ℤ = {...,−2,−1,0,1,2,...}; Racionais ℚ = {a/b | a,b ∈ ℤ e b ≠ 0} (frações!); e Irracionais 𝕀 (√2, π, e). Juntando ℚ ∪ 𝕀 formamos a reta real contínua ℝ, onde o Cálculo I acontece!",
    };
  }
  if (q.includes("limite") || q.includes("0/0") || q.includes("continuidade") || q.includes("tvi")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "O limite lim_{x→a} f(x) observa para onde a curva aponta perto de x = a, mesmo que exista um buraco aberto ali (como em (x²−1)/(x−1) onde 0/0 fatora para x + 1 → 2). Se o limite lateral esquerdo e direito batem com f(a), a função é contínua — e o TVI garante raiz sempre que uma função contínua em [a, b] troca de sinal!",
    };
  }
  if (q.includes("cadeia") || q.includes("derivad") || q.includes("tangente") || q.includes("secante") || q.includes("hôpital") || q.includes("hopital")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "A derivada f'(x₀) nasce quando o passo h da reta secante tende a zero e ela vira a reta tangente no ponto! Para funções compostas f(g(x)), a Regra da Cadeia diz: [f(g(x))]' = f'(g(x)) · g'(x) — derive de fora mantendo o recheio, depois multiplique pela derivada de dentro. No Lab de Funções você pode animar h → 0 ao vivo!",
    };
  }
  if (q.includes("integral") || q.includes("primitiva")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "A integral indefinida ∫ f(x) dx = F(x) + C busca toda família de primitivas cuja derivada devolve f(x). Nunca esqueça do '+ C', lembre que ∫ (1/x) dx = ln|x| + C, use Substituição (u) para inverter a Regra da Cadeia e Por Partes (∫ u dv = uv − ∫ v du) para produtos!",
    };
  }
  if (q.includes("nota") || q.includes("média") || q.includes("media") || q.includes("pf") || q.includes("prova") || q.includes("presen")) {
    return {
      professor: "monge",
      source: "local-calc",
      answer:
        "Pela regra do Prof. Mateus Spezia na UERJ: MP = (P1+P2+P3)/3 e presença mínima de 75%. Se MP ≥ 7 você passa direto; se MP < 3 reprova sem PF; se 3 < MP < 7 faz a PF (prevista p/ 20/04/2027) e precisa de MF = (MP+PF)/2 ≥ 5! Use o Simulador na aba Ementa & Notas para calcular na hora.",
    };
  }

  return {
    professor: "monge",
    source: "local-calc",
    answer:
      "Estou no modo Cálculo I (UERJ · Stewart & Guidorizzi)! Pode me perguntar sobre Pré-Cálculo (conjuntos ℕ⊂ℤ⊂ℚ⊂ℝ, intervalos [a,b], domínio natural, raiz de função), Limites 0/0, Derivadas, Regra da Cadeia, Integração Indefinida ou regras das provas P1/P2/P3/PF.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      question?: string;
      subject?: "gd" | "calc1";
      contextPoints?: ContextPoint[];
      customApiKey?: string;
    };
    const question = (body.question ?? "").trim();
    const subject = body.subject === "calc1" ? "calc1" : "gd";
    if (!question) {
      return NextResponse.json({ error: "Pergunta vazia" }, { status: 400 });
    }

    const apiKey = (body.customApiKey || process.env.GEMINI_API_KEY || "").trim();
    if (apiKey) {
      const pointsDesc = (body.contextPoints ?? [])
        .map((p) => formatPointCoords(p.label, p.x, p.y, p.z))
        .join(", ");

      const systemPrompt =
        subject === "calc1"
          ? `Você é o tutor interativo de Cálculo I e Pré-Cálculo da UERJ (baseado em Stewart Vol. 1, Guidorizzi Vol. 1 e ementa do Prof. Mateus Spezia: 1) Funções, Limites, Continuidade, TVI; 2) Derivadas, Cadeia, Aproximação Linear; 3) Aplicações, Máx/Mín, TVM, Concavidade, Otimização, L'Hôpital; 4) Integração Indefinida e Métodos).
Responda EXCLUSIVAMENTE em JSON válido:
{
  "answer": "Explicação calorosa, clara e didática em português do Brasil (2 a 4 frases), usando exemplos concretos e fáceis de visualizar.",
  "professor": "monge"
}
Dúvida do aluno: ${question}`
          : `Você é o Prof. Monge, professor interativo de Geometria Descritiva da UERJ com controle ao vivo de um Laboratório 3D + Épura 2D.
Convenção brasileira (Z-Up): ponto espacial (A)(abscissa; afastamento; cota) = (x; y; z). Projeção horizontal A em π, vertical A' em π'. No rebatimento (90° horário), cota + sobe (A') e afastamento + DESCE (A). Em Computação 3D (Three.js/Unity Y-Up), o mesmo ponto vira Vector3(x, z, y).

Responda EXCLUSIVAMENTE em JSON válido neste formato:
{
  "answer": "Explicação calorosa, didática e direta em português do Brasil (2 a 4 frases) referenciando o que você acabou de circular/destacar no Lab.",
  "professor": "monge" | "epura",
  "director": {
    "presetId": "opcional: uerj-ex1 | uerj-ex2 | four-diedros | bisectors | special-planes",
    "points": [{"label": "A", "x": 2, "y": -3, "z": 4}],
    "connectLine": false,
    "foldAngle": 0 ou 90,
    "cameraPreset": "iso" | "profile" | "front" | "top",
    "showBisectors": false,
    "showXYZ": true,
    "spotlight": {
      "target": "lt" | "abscissa" | "afastamento" | "cota" | "point_space" | "origin" | "coincident" | "line",
      "pointLabel": "A",
      "caption": "Rótulo curto (máx 34 caracteres) exibido no círculo de destaque"
    }
  }
}
Omitir "presetId" se usar "points" customizados, e omitir ambos se quiser destacar os pontos já presentes na prancheta. Coordenadas devem ficar entre -5 e +5.

Pontos atuais na prancheta: ${pointsDesc || "nenhum"}.
Dúvida do aluno: ${question}`;

      for (const model of ["gemini-3.8-flash", "gemini-2.5-flash"]) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (res.ok) {
          const data = (await res.json()) as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (raw) {
            try {
              const parsedJson = JSON.parse(raw) as {
                answer?: string;
                professor?: "monge" | "epura";
                director?: TutorDirectorCommand;
              };
              if (parsedJson.answer) {
                return NextResponse.json({
                  answer: parsedJson.answer,
                  professor: "monge",
                  director: subject === "gd" ? parsedJson.director : undefined,
                  source: model,
                } satisfies TutorApiResponse);
              }
            } catch {
              // fall through to local brain
            }
          }
        } else if (res.status === 402 || res.status === 401 || res.status === 403) {
          break;
        }
      }
    }

    return NextResponse.json(
      subject === "calc1"
        ? buildLocalCalcResponse(question)
        : buildLocalDirectorResponse(question, body.contextPoints)
    );
  } catch {
    return NextResponse.json(buildLocalDirectorResponse("epura"));
  }
}
