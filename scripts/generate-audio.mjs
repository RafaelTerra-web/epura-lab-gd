/**
 * Gera em lote todas as falas em áudio WAV do ÉpuraLab usando Gemini 3.8 Flash TTS
 * (incluindo diálogo multi-voz Prof. Monge + Profa. Épura).
 *
 * Uso:
 *   npm run generate:audio
 *   (lê GEMINI_API_KEY do ambiente ou de .env.local; aceita --model=gemini-3.8-flash-lite-tts)
 */

import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
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

const SCRIPTS = [
  {
    id: "anatomy-lt",
    professor: "monge",
    text: "A Linha de Terra é o rodapé onde a parede vertical encontra o chão horizontal! Ela funciona como a dobradiça de um caderno aberto. Na épura 2D, desenhamos a Linha de Terra bem firme com dois tracinhos embaixo das pontas, porque todas as alturas e afastamentos são medidos a partir dela!",
  },
  {
    id: "anatomy-abscissa",
    professor: "epura",
    text: "A Abscissa é sempre o primeiro número das coordenadas, o nosso eixo X! Ela diz o quanto você desliza para a direita ou para a esquerda em cima da Linha de Terra. Assim que você marca a abscissa na régua, sobe e desce uma linha bem fininha chamada Linha de Chamada. As duas projeções A e A linha moram obrigatoriamente nessa mesma coluna!",
  },
  {
    id: "anatomy-afastamento",
    professor: "monge",
    text: "Preste atenção máxima no Afastamento, o segundo número! Ele mede a distância do ponto até a parede vertical: positivo quando está na frente, negativo quando está atrás. Agora veja a mágica na animação: quando rebatemos o chão em noventa graus para baixo, o afastamento positivo gira para BAIXO da Linha de Terra, enquanto o negativo gira para CIMA!",
  },
  {
    id: "anatomy-cota",
    professor: "epura",
    text: "A Cota é o terceiro número e representa a altura do ponto em relação ao chão! Como a parede vertical fica parada durante o rebatimento, a Cota é super intuitiva na épura: cota positiva sobe acima da Linha de Terra e marca A linha; cota negativa desce abaixo da Linha de Terra!",
  },
  {
    id: "anatomy-diedros",
    professor: "monge",
    text: "Os dois planos se cruzam formando quatro regiões infinitas chamadas Diedros, contadas no sentido anti-horário! O primeiro diedro é onde nós estamos: na frente e em cima. O segundo fica atrás e em cima. O terceiro fica atrás e embaixo. E o quarto na frente e embaixo. Clique em cada um dos quatro quadrantes no desenho para ver o rebatimento acontecendo ao vivo!",
  },
  {
    id: "parallel-yup-zup",
    professor: "dialogue",
    text: `Prof. Monge: Essa sua sacada é brilhante! Na computação gráfica, como Unity, Three.js e OpenGL, a altura costuma ser o eixo Y. Mas na Academia, na Geometria Descritiva da UERJ, na Arquitetura e até no Blender, a altura é o eixo Z, chamada de Cota!
Profa. Épura: Isso acontece porque no papel da engenharia a gente começa pela planta baixa no chão, com X e Y planos, e depois sobe as paredes na vertical no eixo Z! Já nas telas de computador, X e Y já eram a largura e a altura da tela, então empurraram o Z para a profundidade!
Prof. Monge: E no fundo, traduzir de um mundo para o outro é moleza: o X continua igual, e você só troca Y com Z! Por isso o ponto A mais dois, mais cinco, mais três da sua aula vira Vector3 dois, três, cinco em Three.js!`,
  },
  {
    id: "lesson-01-problema-monge",
    professor: "monge",
    text: "Bem-vindo à nossa primeira aula! Imagine que você quer explicar com precisão absoluta onde uma mosca está voando dentro de uma sala, usando apenas uma folha de papel plana. Se você só desenhar a sombra dela no chão, ninguém sabe a altura! Por isso, Gaspard Monge teve uma ideia brilhante: projetar o ponto em dois planos perpendiculares, o chão horizontal pi e a parede vertical pi linha. Com essas duas sombras ortogonais, o ponto no espaço fica 100 por cento determinado!",
  },
  {
    id: "lesson-02-coordenadas-xyz",
    professor: "epura",
    text: "Essa é a dúvida mais inteligente da aula um: associar x, y e z ajuda ou confunde? A resposta é: ajuda muito na ordem, desde que você conheça uma única pegadinha! Na convenção brasileira, a ordem é sempre alfabética: primeiro a Abscissa, que é o x ao longo da Linha de Terra; segundo o Afastamento, que é o y, a distância até a parede vertical; e terceiro a Cota, que é o z, a altura em relação ao chão. A pegadinha acontece só na épura 2D: como o chão rebate para baixo, afastamento positivo vai para BAIXO da Linha de Terra!",
  },
  {
    id: "lesson-03-quatro-diedros",
    professor: "monge",
    text: "Os planos horizontal e vertical se cruzam formando quatro regiões infinitas chamadas Diedros, numeradas no sentido anti-horário exatamente como os quadrantes da trigonometria! O primeiro diedro é onde nós estamos: na frente e em cima, afastamento positivo e cota positiva. O segundo fica atrás da parede e em cima. O terceiro fica atrás e embaixo. E o quarto fica na frente e embaixo.",
  },
  {
    id: "lesson-04-rebatimento-epura",
    professor: "epura",
    text: "Chegou a hora de destravar a épura de uma vez por todas! Como transformar dois planos que fazem noventa graus no espaço em uma única folha de papel? Nós mantemos o plano vertical parado e giramos o plano horizontal noventa graus no sentido horário em torno da Linha de Terra! A metade da frente do chão desce e encosta na parede de baixo. A metade de trás do chão sobe e encosta na parede de cima.",
  },
  {
    id: "lesson-05-casos-especiais-bissetores",
    professor: "monge",
    text: "Duas famílias de casos especiais caem o tempo todo nas provas de Geometria Descritiva. Primeiro, quando uma coordenada é zero: se a cota é zero, o ponto está no chão e A linha cai em cima da Linha de Terra. Se o afastamento é zero, o ponto está na parede e A cai em cima da Linha de Terra. Segundo, os planos bissetores, que cortam os diedros ao meio a quarenta e cinco graus! No primeiro bissetor, afastamento e cota são iguais e as projeções ficam simétricas. No segundo bissetor, têm sinais opostos e A e A linha caem exatamente no mesmo ponto!",
  },
  {
    id: "lesson-06-uerj-aula1-resolucao",
    professor: "epura",
    text: "Aqui vamos resolver juntos, passo a passo, exatamente os dois exercícios do slide da sua primeira aula na UERJ! No Exercício 1, ligamos A no primeiro diedro com B no terceiro diedro e descobrimos que a reta r fura a Linha de Terra exatamente na origem zero, zero, zero. E no Exercício 2, o professor colocou uma surpresa genial: os três pontos A, B e C não formam um triângulo, eles estão perfeitamente alinhados formando uma única reta paralela ao primeiro bissetor!",
  },
  {
    id: "uerj-ex1",
    professor: "epura",
    text: "Vamos conferir o Exercício 1 da sua folha! Primeiro, localize A no primeiro diedro e B no terceiro diedro. Ao ligar A e B, note a simetria perfeita: a reta passa bem pela origem zero, zero, zero na Linha de Terra! Na épura, A linha fica 3 acima e A fica 5 abaixo; B linha fica 3 abaixo e B fica 5 acima. Quando você traça r linha e r com a régua, as duas linhas se cruzam exatamente no zero da Linha de Terra!",
  },
  {
    id: "uerj-ex2",
    professor: "epura",
    text: "Agora o Exercício 2 da sua folha! Todos os três pontos estão no primeiro diedro, e repare na diferença entre eles: de A para B somamos um em cada coordenada, e de B para C somamos um de novo! Por isso, ao unir os três pontos, eles não formam um triângulo — eles são perfeitamente colineares! Na épura, a projeção vertical sobe a 45 graus acima da Linha de Terra e a projeção horizontal desce a 45 graus abaixo, mostrando que essa reta é paralela ao primeiro bissetor!",
  },
  {
    id: "kit-desenho",
    professor: "epura",
    text: "O kit da sua primeira aula na UERJ foi escolhido para dar precisão cirúrgica às suas épuras! Com o par de esquadros de quarenta e cinco e trinta sessenta graus combinados, você traça qualquer ângulo de quinze em quinze graus e faz linhas de chamada perfeitamente perpendiculares à Linha de Terra. E lembre da dupla dinâmica de lapiseiras: zero ponto cinco com grafite HB para linhas finas auxiliares, e zero ponto sete com grafite dois B para destacar a Linha de Terra e a resposta final!",
  },
];

async function main() {
  loadEnvLocal();
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey) {
    console.error("Erro: defina GEMINI_API_KEY em .env.local ou no ambiente.");
    process.exit(1);
  }

  const modelArg = process.argv.find((a) => a.startsWith("--model="));
  const model = modelArg
    ? modelArg.split("=")[1]
    : "gemini-3.8-flash-tts";

  const outDir = path.resolve(process.cwd(), "public", "audio");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Gerando ${SCRIPTS.length} áudios com ${model} em public/audio/...`);

  const generatedIds = [];
  for (const item of SCRIPTS) {
    const outPath = path.join(outDir, `${item.id}.wav`);
    const isDialogue = item.professor === "dialogue";

    const speechConfig = isDialogue
      ? {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: "Prof. Monge",
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
              },
              {
                speaker: "Profa. Épura",
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
              },
            ],
          },
        }
      : {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: item.professor === "epura" ? "Kore" : "Charon",
            },
          },
        };

    const promptText = isDialogue
      ? `Faça uma aula em diálogo natural, empolgante e didática em português do Brasil entre Prof. Monge e Profa. Épura:\n\n${item.text}`
      : `Fale em português do Brasil com entonação calorosa, expressiva e didática de professor universitário:\n\n${item.text}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`Falha em ${item.id} (HTTP ${res.status}):`, err.slice(0, 300));
      if (res.status === 402 || res.status === 401 || res.status === 403) {
        console.error(
          "\nVerifique créditos/faturamento da chave em https://ai.studio/projects e rode novamente: npm run generate:audio"
        );
        process.exit(1);
      }
      continue;
    }

    const json = await res.json();
    const inline = json.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData?.data
    )?.inlineData;

    if (!inline?.data) {
      console.warn(`Sem payload de áudio em ${item.id}`);
      continue;
    }

    const raw = Buffer.from(inline.data, "base64");
    const mime = inline.mimeType || "audio/L16;rate=24000";
    let wav = raw;
    if (mime.toLowerCase().includes("l16") || mime.toLowerCase().includes("pcm")) {
      const rateMatch = mime.match(/rate=(\d+)/i);
      wav = pcm16ToWav(raw, rateMatch ? Number(rateMatch[1]) : 24000, 1);
    }

    fs.writeFileSync(outPath, wav);
    generatedIds.push(item.id);
    console.log(`✓ ${item.id}.wav (${Math.round(wav.length / 1024)} KB)`);
  }

  fs.writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(generatedIds, null, 2) + "\n"
  );
  console.log("\nConcluído! Manifest e arquivos WAV em public/audio/ já são carregados automaticamente pelo app.");
}

main();
