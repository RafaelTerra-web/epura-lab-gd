/**
 * Cálculo 1 Studio Episode Audio Builder (Gemini 3.8 Flash TTS · Voz Masculina "Charon")
 *
 * Gera cada cena separadamente em PCM 24kHz mono, remove artefatos finais de respiração/tail,
 * costura em um único WAV contínuo (public/audio/calc-video/<epId>.wav) com pausas naturais de 0.32s,
 * e grava public/audio/calc-video/timings.json para sincronia 100% exata frame a frame!
 */

import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

function pcm16ToWav(pcmBuffer, sampleRate = 24000, channels = 1) {
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

function stripWavHeaderIfNeeded(buf) {
  if (buf.length > 44 && buf.toString("ascii", 0, 4) === "RIFF") {
    return buf.subarray(44);
  }
  return buf;
}

function cleanGeminiTtsPcm(pcmBuffer, sampleRate = 24000) {
  const totalSamples = Math.floor(pcmBuffer.length / 2);
  if (totalSamples < sampleRate * 0.25) return pcmBuffer;

  const win = Math.floor(0.02 * sampleRate);
  const checkStart = Math.max(0, totalSamples - Math.floor(0.95 * sampleRate));
  const windows = [];

  for (let s = checkStart; s + win <= totalSamples; s += win) {
    let sumSq = 0;
    for (let i = s; i < s + win; i++) {
      const v = pcmBuffer.readInt16LE(i * 2) / 32768;
      sumSq += v * v;
    }
    windows.push({ s, rms: Math.sqrt(sumSq / win) });
  }

  let cutSample = totalSamples;
  for (let i = windows.length - 1; i >= 3; i--) {
    const tFromEnd = (totalSamples - windows[i].s) / sampleRate;
    if (tFromEnd <= 0.5 && windows[i].rms > 0.05) {
      let j = i - 1;
      while (j >= 0 && windows[j].rms > 0.018) j--;
      const gapEnd = j;
      while (j >= 0 && windows[j].rms <= 0.018) j--;
      if (gapEnd - j >= 2) {
        cutSample = Math.min(
          totalSamples,
          windows[j + 1].s + Math.floor(0.06 * sampleRate)
        );
        break;
      }
    }
  }

  const out = Buffer.from(pcmBuffer.subarray(0, cutSample * 2));
  const nSamples = Math.floor(out.length / 2);
  const fadeIn = Math.min(nSamples, Math.floor(0.01 * sampleRate));
  for (let i = 0; i < fadeIn; i++) {
    out.writeInt16LE(Math.round(out.readInt16LE(i * 2) * (i / fadeIn)), i * 2);
  }
  const fadeOut = Math.min(nSamples, Math.floor(0.03 * sampleRate));
  for (let i = 0; i < fadeOut; i++) {
    const idx = nSamples - fadeOut + i;
    const g = 0.5 * (1 + Math.cos((Math.PI * i) / fadeOut));
    out.writeInt16LE(Math.round(out.readInt16LE(idx * 2) * g), idx * 2);
  }
  return out;
}

const EPISODES = [
  {
    id: "calc-ep01-conjuntos",
    scenes: [
      {
        id: "intro",
        label: "Por que Cálculo vive em ℝ?",
        subtitle:
          "Cálculo I estuda o comportamento de funções reais com valores reais — precisamos de uma reta contínua sem buracos.",
        script:
          "Fala pessoal! Bem-vindos ao episódio um de Cálculo Um e Pré-Cálculo na UERJ! Antes de derivar ou integrar, o professor sempre faz a pergunta fundamental: o que é um número real? Cálculo estuda funções reais com valores reais, e para isso a nossa reta numérica precisa ser contínua, sem nenhum buraco invisível!",
      },
      {
        id: "hierarchy",
        label: "Hierarquia ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ",
        subtitle:
          "ℕ = {1,2,3...} ⊂ ℤ (inteiros) ⊂ ℚ = {a/b | a,b ∈ ℤ, b ≠ 0} (frações!). Atenção: frações moram em ℚ, não em ℤ!",
        script:
          "Olha a hierarquia na tela: começamos nos Naturais N, um, dois, três, quatro. Adicionamos o zero e os negativos para formar os Inteiros Z. Quando dividimos dois inteiros a sobre b, com b diferente de zero, nascem os Racionais Q! Muita atenção aqui: toda fração como meio mora em Q, de quociente, e nunca em Z!",
      },
      {
        id: "irrationals",
        label: "Irracionais 𝕀 & Aproximação",
        subtitle:
          "ℝ = ℚ ∪ 𝕀: números como √2 e π não viram fração a/b, mas podem ser aproximados por racionais com precisão infinita.",
        script:
          "Mesmo colocando todas as frações na reta, ainda sobram lacunas infinitas! Quem preenche essas lacunas são os Irracionais I, como raiz de dois e pi. Eles não podem ser escritos como fração exata, mas a gente sempre consegue aproximar qualquer irracional por números racionais cada vez mais pertinho! Juntando Q união I, nasce o conjunto dos Reais R!",
      },
      {
        id: "conventions",
        label: "Notação Oficial do Caderno",
        subtitle:
          "Conjuntos levam letra MAIÚSCULA (A, B, X, Y); elementos levam minúscula (x, y, p); '⇔' significa 'se e somente se'.",
        script:
          "Para fechar o episódio, guarde três convenções de ouro da aula: conjuntos sempre levam letra maiúscula, como A, B, X e Y; elementos dentro deles levam letra minúscula, como x, y e p; e a seta dupla significa se e somente se! No próximo episódio, vamos construir intervalos e resolver desigualdades!",
      },
    ],
  },
  {
    id: "calc-ep02-intervalos",
    scenes: [
      {
        id: "types",
        label: "Fechado ● vs Aberto ○ & Ilimitados",
        subtitle:
          "[a, b] inclui os extremos (●); ]a, b[ exclui (○). Ilimitados: ]−∞, a] e [a, +∞[ sempre abertos no infinito!",
        script:
          "No episódio dois, vamos dominar intervalos de reta e desigualdades, exatamente como na aula do dia vinte e quatro de novembro! No intervalo fechado a, b, o colchete abraça os extremos com bolinha fechada: a menor ou igual a x menor ou igual a b. No aberto, o colchete vira para fora com bolinha aberta e exclui as pontas. Também existem os semiabertos e os ilimitados até mais ou menos infinito — onde o colchete é sempre aberto!",
      },
      {
        id: "venn",
        label: "Blocos Construtores & Venn",
        subtitle:
          "União X ∪ Y (p ∈ X OU p ∈ Y) junta tudo; Interseção X ∩ Y (p ∈ X E p ∈ Y) pega só a região comum.",
        script:
          "Os intervalos funcionam como blocos construtores de conjuntos na reta real! Olhando o diagrama de Venn animado na tela: a união X união Y reúne todo elemento que está em X OU em Y. Já a interseção X inter Y recorta somente a faixa comum onde o elemento pertence a X E a Y ao mesmo tempo!",
      },
      {
        id: "ineq-linear",
        label: "Ex 1 Caderno: 2x − 1 ≤ 0",
        subtitle:
          "2x − 1 ≤ 0 ⇔ 2x ≤ 1 ⇔ x ≤ 1/2 ⇒ A = ]−∞, 1/2]. E atenção: dividir por número negativo INVERTE o sinal!",
        script:
          "Agora vamos resolver as duas desigualdades do caderno! Primeiro exemplo: dois x menos um menor ou igual a zero. Passando o um para lá, dois x menor ou igual a um; dividindo por dois, x menor ou igual a meio, ou seja, de menos infinito aberto até meio fechado! E lembre: se você dividir por um número negativo, o sinal da desigualdade inverte na hora!",
      },
      {
        id: "ineq-quad",
        label: "Ex 2 Caderno: x² + x − 2 ≥ 0",
        subtitle:
          "Fatorando: (x + 2)(x − 1) ≥ 0. Pelo quadro de sinais, (−)·(−) = (+) para x ≤ −2 e (+)·(+) = (+) para x ≥ 1!",
        script:
          "Segundo exemplo, campeão de prova: x ao quadrado mais x menos dois maior ou igual a zero! Primeiro fatoramos como x mais dois vezes x menos um. Agora observe o quadro de sinais na tela: antes do menos dois, os dois fatores são negativos, e menos vezes menos dá MAIS! Entre menos dois e um, um é positivo e o outro negativo, dando menos. Depois do um, ambos são positivos!",
      },
      {
        id: "takeaway",
        label: "Solução Final na Reta",
        subtitle:
          "B = ]−∞, −2] ∪ [1, +∞[ — união de dois intervalos ilimitados construídos pelos sinais dos fatores!",
        script:
          "Como queremos o produto maior ou igual a zero, juntamos as duas regiões positivas: B igual a menos infinito até menos dois fechado, união um fechado até mais infinito! Clique no botão aqui embaixo do vídeo para brincar ao vivo com esse quadro de sinais no laboratório!",
      },
    ],
  },
  {
    id: "calc-ep03-funcoes",
    scenes: [
      {
        id: "arrows",
        label: "Domínio, Contradomínio & Regra",
        subtitle:
          "f: A → B exige que TODO x ∈ A dispare exatamente UMA flecha. Imagem Im_f = { y ∈ B / ∃ x ∈ D_f t.q. f(x) = y }.",
        script:
          "No episódio três, chegamos ao coração do Pré-Cálculo: o que define uma função? Uma função f de A em B precisa de três ingredientes: o domínio D f, que é de onde sai; o contradomínio B, para onde vai; e a regra f de x. Todo elemento de A precisa disparar exatamente uma única flecha! E o conjunto dos valores de B que realmente recebem flecha é chamado de Imagem Im f.",
      },
      {
        id: "graph-test",
        label: "Gráfico Gr_f & Reta Vertical",
        subtitle:
          "Gr_f = { (x, y) ∈ ℝ² / y = f(x), x ∈ A }. Toda reta vertical corta o gráfico de uma função no máximo 1 vez!",
        script:
          "Quando jogamos cada par x, f de x no plano cartesiano, nasce o gráfico da função, G r f! Olha a reta vertical varrendo a tela: como cada x só pode ter uma única saída y, o teste da reta vertical garante que nenhuma linha vertical pode cortar o gráfico de uma função em dois pontos diferentes!",
      },
      {
        id: "dom-sqrt",
        label: "Domínio Natural · Ex 1: √x",
        subtitle:
          "Domínio Natural é o maior subconjunto de ℝ onde f faz sentido. Para f(x) = √x, exigimos x ≥ 0 ⇒ D_f = [0, +∞[.",
        script:
          "Muitas vezes o enunciado dá só a fórmula sem escrever o domínio. Aí entra o Domínio Natural: o maior subconjunto dos reais onde a conta faz sentido! Exemplo um do seu caderno: f de x igual a raiz quadrada de x. Como não existe raiz real de número negativo, exigimos x maior ou igual a zero, logo o domínio natural é de zero fechado até mais infinito!",
      },
      {
        id: "dom-rat",
        label: "Domínio Natural · Ex 2: 1/(x−1)",
        subtitle:
          "Denominador não pode zerar! Em f(x) = 1/(x−1), x ≠ 1 ⇒ D_f = ]−∞, 1[ ∪ ]1, +∞[ (assíntota vertical em x = 1).",
        script:
          "Exemplo dois do caderno: f de x igual a um sobre x menos um! Qual é o único número que quebra essa fração? X igual a um, porque um menos um dá zero no denominador, e jamais podemos dividir por zero! Logo, o domínio natural exclui apenas o um: menos infinito até um aberto, união um aberto até mais infinito!",
      },
      {
        id: "roots",
        label: "O que é a Raiz de uma Função?",
        subtitle:
          "Raiz (ou zero) é todo x que faz f(x) = 0 — exatamente onde a curva atravessa o eixo horizontal X!",
        script:
          "E respondendo à outra pergunta famosa do seu caderno: o que é a raiz de uma função? A raiz, ou zero, é todo valor de x que zera a saída, isto é, f de x igual a zero! No gráfico, basta olhar onde a curva acende e atravessa o eixo horizontal X. Simples, visual e inesquecível!",
      },
    ],
  },
  {
    id: "calc-ep04-elementares",
    scenes: [
      {
        id: "constant",
        label: "0) Função Constante: f(x) = c",
        subtitle:
          "f: ℝ → ℝ levando todo x na mesma constante c. Gráfico é uma reta horizontal com D_f = ℝ e Im_f = { c }.",
        script:
          "No episódio quatro, vamos percorrer as Funções Elementares exatamente na ordem do seu caderno! Item zero: a Função Constante, f de x igual a c. Não importa qual número real você coloque em x, a saída é sempre a mesma altura c! O gráfico é uma reta horizontal perfeita, com domínio igual a todos os reais e imagem sendo o conjunto unitário formado só pelo número c.",
      },
      {
        id: "afim-slope",
        label: "1) Função Afim · tg α = Δy/Δx = a",
        subtitle:
          "f(x) = ax + b (a ≠ 0). O coeficiente a mede a inclinação: tg α = Δy/Δx = a (a > 0 sobe; a < 0 desce)!",
        script:
          "Item um: a Função Afim, f de x igual a ax mais b, com a diferente de zero! O gráfico é sempre uma reta inclinada. Veja o triângulo retângulo nascendo embaixo da reta: a razão delta y sobre delta x é igual à tangente do ângulo alfa, e vale exatamente a! Por isso, se a for positivo a reta sobe; se a for negativo, a reta desce!",
      },
      {
        id: "afim-proof",
        label: "Raiz x = −b/a & Prova Im_f = ℝ",
        subtitle:
          "Zerando y = 0 achamos a raiz x = −b/a. E dado qualquer y ∈ ℝ, x = (y−b)/a garante f((y−b)/a) = y ⇒ Im_f = ℝ!",
        script:
          "Para achar a raiz da função afim, fazemos ax mais b igual a zero e encontramos x igual a menos b sobre a. E como provamos formalmente que a imagem da função afim é toda a reta real? Dado qualquer y real, isolamos x igual a y menos b sobre a — o que funciona porque a é diferente de zero! Substituindo de volta em f, obtemos exatamente y!",
      },
      {
        id: "composed",
        label: "Função Composta (f ∘ g)(x)",
        subtitle:
          "Na composição f(g(x)), a saída da primeira máquina g alimenta a segunda máquina f — base da Regra da Cadeia!",
        script:
          "Além das funções básicas, na ementa de Cálculo Um combinamos funções em cadeia! Na função composta f bola g de x, a saída da primeira máquina g entra direto como combustível dentro da função f. Guardar essa estrutura de dentro para fora vai deixar a Regra da Cadeia da P2 muito mais fácil!",
      },
      {
        id: "inverse",
        label: "Inversa f⁻¹: Espelho em y = x",
        subtitle:
          "Trocar x ↔ y reflete o gráfico na diagonal y = x: e^x e ln(x) são espelhos perfeitos um do outro!",
        script:
          "E quando uma função é injetora, podemos inverter a regra e achar f a menos um de x! No plano cartesiano, basta colocar um espelho na diagonal y igual a x: o gráfico da exponencial e elevado a x reflete perfeitamente no logaritmo natural ln de x! Teste esse espelho ao vivo no Lab de Funções!",
      },
    ],
  },
  {
    id: "calc-ep05-calc-preview",
    scenes: [
      {
        id: "limits",
        label: "P1 · Limite 0/0 (Buraco) & TVI",
        subtitle:
          "Em (x²−1)/(x−1), f(1) não existe (buraco aberto!), mas pela esquerda e direita a altura tende a L = 2!",
        script:
          "No episódio cinco, vamos fazer o mapa panorâmico do resto do seu semestre com o professor Mateus Spezia! Ainda na P1, chegamos em Limites e Continuidade. Olha a função x ao quadrado menos um sobre x menos um: em x igual a um dá zero sobre zero, um buraco aberto! Mas quando x chega bem pertinho de um pela esquerda e pela direita, a altura caminha exatamente para dois!",
      },
      {
        id: "deriv-secant",
        label: "P2 · Derivada: Secante → Tangente",
        subtitle:
          "Quando o passo h encolhe até zero, a reta secante gira e vira a reta tangente com inclinação f'(x₀)!",
        script:
          "Na Unidade dois, rumo à P2, nasce a Derivada! Trace uma reta secante ligando dois pontos separados por uma distância h. Agora observe a animação mágica: conforme h encolhe até zero, a secante gira suavemente até encostar num único ponto e virar a reta tangente! A inclinação dessa tangente é a derivada f linha de x zero — na física, a velocidade instantânea!",
      },
      {
        id: "deriv-apps",
        label: "P2 · Máximos, Mínimos & Inflexão",
        subtitle:
          "f'(x) = 0 revela picos e vales (otimização); f''(x) revela concavidade (∪ ou ∩) e o ponto de inflexão!",
        script:
          "Na Unidade três, usamos a derivada como superpoder: onde f linha zera, a tangente fica horizontal e revela os pontos críticos de máximo e mínimo, perfeitos para problemas de otimização! Já a segunda derivada f duas linhas mostra se a curva sorri para cima ou para baixo e encontra o ponto de inflexão, além da regra de L'Hôpital!",
      },
      {
        id: "integrals",
        label: "P3 · Integral Indefinida F(x) + C",
        subtitle:
          "Integrar desfaz a derivada: ∫ f(x) dx = F(x) + C cria uma família infinita de curvas deslocadas por +C!",
        script:
          "E na P3, Unidade quatro, fazemos o caminho inverso com a Integração Indefinida! Integrar f de x é encontrar a família de primitivas F de x mais C cuja derivada devolve f de x. Veja na tela as curvas subindo e descendo em paralelo conforme a constante C muda — por isso nunca esqueça do mais C na prova!",
      },
      {
        id: "uerj-roadmap",
        label: "Estratégia UERJ · Prof. Mateus Spezia",
        subtitle:
          "MP = (P1+P2+P3)/3 ≥ 7 aprova direto! Presença ≥ 75% obrigatória; PR 13/04/2027 e PF 20/04/2027.",
        script:
          "Para fechar com chave de ouro: sua média parcial é a média das três provas P1, P2 e P3, com presença mínima de setenta e cinco por cento! Média sete ou mais passa direto sem prova final! Use o Lab de Funções, a aba Praticar e o Simulador de Notas aqui no ExatasLab para gabaritar Cálculo Um na UERJ!",
      },
    ],
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchScenePcm(apiKey, scriptText, model) {
  const prompt = `Leia em português do Brasil com voz masculina jovem, didática, natural e entusiasmada de professor universitário de Cálculo I (UERJ), em ritmo fluido e claro, sem pausas longas no fim:\n\n${scriptText}`;

  for (let attempt = 1; attempt <= 6; attempt++) {
    const activeModel =
      attempt >= 4 ? "gemini-3.8-flash-lite-tts" : model;
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: "Charon" },
              },
            },
          },
        }),
      }
    );

    if (res.status === 429 || res.status === 503) {
      const waitMs = 12000 + attempt * 8000;
      console.log(
        `   ⏳ Rate limit (${res.status}) em ${activeModel}, aguardando ${Math.round(waitMs / 1000)}s...`
      );
      await sleep(waitMs);
      continue;
    }
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 260)}`);
    }
    const j = await res.json();
    const inline = j.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    )?.inlineData;
    if (!inline?.data) throw new Error("Empty audio payload");
    const raw = Buffer.from(inline.data, "base64");
    return cleanGeminiTtsPcm(stripWavHeaderIfNeeded(raw));
  }
  throw new Error("Exceeded retry attempts after HTTP 429/503");
}

async function main() {
  loadEnvLocal();
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in .env.local");
    process.exitCode = 1;
    return;
  }

  const model = "gemini-3.8-flash-tts";
  const sampleRate = 24000;
  const bytesPerSec = sampleRate * 2;
  const pauseBuf = Buffer.alloc(Math.round(0.32 * bytesPerSec));

  const outDir = path.resolve(process.cwd(), "public", "audio", "calc-video");
  fs.mkdirSync(outDir, { recursive: true });

  const timingsPath = path.join(outDir, "timings.json");
  const timings = fs.existsSync(timingsPath)
    ? JSON.parse(fs.readFileSync(timingsPath, "utf8"))
    : {};

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyId = onlyArg ? onlyArg.split("=")[1] : null;
  const force = process.argv.includes("--force");

  for (const ep of EPISODES) {
    if (onlyId && ep.id !== onlyId) continue;
    const outWav = path.join(outDir, `${ep.id}.wav`);
    if (!force && fs.existsSync(outWav) && timings[ep.id]) {
      console.log(`• ${ep.id} já existe (${timings[ep.id].duration}s)`);
      continue;
    }

    console.log(
      `\n🎬 Gerando ${ep.id} (${ep.scenes.length} cenas · Gemini 3.8 TTS Charon)...`
    );
    const pcmChunks = [];
    const sceneCues = [];
    let cursorSec = 0;

    for (let i = 0; i < ep.scenes.length; i++) {
      const sc = ep.scenes[i];
      const pcm = await fetchScenePcm(apiKey, sc.script, model);
      await sleep(3200);
      const scDur = pcm.length / bytesPerSec;
      const startSec = Number(cursorSec.toFixed(3));
      cursorSec += scDur;
      pcmChunks.push(pcm);

      if (i < ep.scenes.length - 1) {
        pcmChunks.push(pauseBuf);
        cursorSec += pauseBuf.length / bytesPerSec;
      }

      const endSec = Number(cursorSec.toFixed(3));
      sceneCues.push({
        id: sc.id,
        label: sc.label,
        subtitle: sc.subtitle,
        startSec,
        endSec,
      });
      console.log(
        `   ✓ [${i + 1}/${ep.scenes.length}] ${sc.id}: ${startSec.toFixed(2)}s → ${endSec.toFixed(2)}s (${scDur.toFixed(1)}s)`
      );
    }

    const totalPcm = Buffer.concat(pcmChunks);
    const wav = pcm16ToWav(totalPcm, sampleRate, 1);
    fs.writeFileSync(outWav, wav);

    const totalDuration = Number((totalPcm.length / bytesPerSec).toFixed(2));
    timings[ep.id] = {
      audioSrc: `/audio/calc-video/${ep.id}.wav`,
      duration: totalDuration,
      scenes: sceneCues,
    };
    fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 2) + "\n");
    console.log(
      `✅ ${ep.id}.wav salvo (${Math.round(wav.length / 1024)} KB · ${totalDuration}s exatos!)`
    );
  }

  console.log("\n🎉 Todos os 5 episódios de Cálculo 1 foram gerados com timestamps exatos!");
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exitCode = 1;
});
