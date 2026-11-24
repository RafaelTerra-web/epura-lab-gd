/**
 * Studio Episode Audio Builder (Gemini 3.8 Flash TTS · Voz Masculina "Charon")
 *
 * Gera CADA CENA separadamente, mede a duração EXATA em milissegundos a partir dos bytes PCM,
 * costura tudo em um único WAV contínuo (public/audio/video/<epId>.wav) com pausas naturais de 0.35s,
 * e escreve public/audio/video/timings.json para sincronia 100% exata frame a frame no MotionVideoPlayer!
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

const EPISODES = [
  {
    id: "ep01-monge",
    scenes: [
      {
        id: "intro",
        label: "O Desafio 3D → 2D",
        subtitle:
          "Como representar um ponto do espaço 3D em uma folha 2D sem perder nenhuma informação de posição?",
        script:
          "Fala pessoal! Bem-vindos ao episódio um de Geometria Descritiva! Na sua primeira aula na UERJ, o grande objetivo é responder uma pergunta que desafiou engenheiros por séculos: como desenhar um objeto tridimensional em uma folha plana de papel de um jeito tão preciso que qualquer pessoa consiga reconstruir exatamente onde cada ponto está no espaço?",
      },
      {
        id: "ambiguous-shadow",
        label: "Por que 1 plano falha?",
        subtitle:
          "Com apenas o chão (π), pontos em alturas diferentes produzem exatamente a mesma sombra!",
        script:
          "Imagine uma mosca parada voando no meio de uma sala. Se você iluminar lá de cima com raios verticais e marcar apenas a sombra dela no chão, que chamamos de plano horizontal pi, olha o problema que acontece na tela: uma mosca baixinha a um metro do chão e outra mosca alta a três metros do chão produzem exatamente a mesma sombra! Uma única projeção perde a altura.",
      },
      {
        id: "two-planes",
        label: "Os 2 Planos de Monge (90°)",
        subtitle:
          "Gaspard Monge resolve o problema usando DOIS planos perpendiculares: chão (π) e parede (π').",
        script:
          "Foi aí que o matemático francês Gaspard Monge teve uma ideia genial! Em vez de usar um único plano, ele colocou uma parede vertical perpendicular ao chão, formando exatamente noventa graus: o plano vertical pi linha! Agora nós lançamos dois raios projetantes ortogonais saindo do ponto espacial A. Um cai no chão e gera a projeção horizontal A. O outro bate na parede e gera a projeção vertical A linha.",
      },
      {
        id: "lt-and-notation",
        label: "Linha de Terra & Notação",
        subtitle:
          "A interseção de π e π' é a Linha de Terra (LT). Notação UERJ: (A) no espaço, A no chão, A' na parede.",
        script:
          "O encontro entre o chão e a parede cria uma reta fundamental chamada Linha de Terra, nossa referência central, como se fosse o rodapé da sala. E guarde já a notação clássica da UERJ: o ponto solto no espaço leva parênteses, A entre parênteses. A projeção no chão fica sem parênteses, apenas A. E a projeção na parede ganha um apóstrofo, A linha!",
      },
      {
        id: "takeaway",
        label: "Resumo do Episódio 01",
        subtitle:
          "1 ponto no espaço (A) ⇄ 2 projeções ortogonais (A em π e A' em π') = posição 100% única!",
        script:
          "Com essas duas projeções juntas, não existe mais nenhuma dúvida! A projeção A diz o quanto o ponto avançou para frente e para o lado; e A linha trava a altura exata. Um ponto no espaço equivale sempre a um par único de projeções. No próximo episódio, vamos dar números para essas distâncias!",
      },
    ],
  },
  {
    id: "ep02-coordenadas",
    scenes: [
      {
        id: "intro",
        label: "A Ordem Sagrada (X; Y; Z)",
        subtitle:
          "Na convenção brasileira (UERJ), as 3 coordenadas seguem sempre a ordem alfabética: Abscissa, Afastamento e Cota.",
        script:
          "No episódio dois, vamos dominar de uma vez por todas o sistema de coordenadas da Geometria Descritiva! Quando o professor escreve um ponto como A mais dois, ponto e vírgula, mais cinco, ponto e vírgula, mais três, o que significa cada número? Existe uma ordem sagrada na convenção brasileira, e ela é super fácil de gravar porque está em ordem alfabética: primeiro Abscissa, segundo Afastamento e terceiro Cota!",
      },
      {
        id: "abscissa",
        label: "1º · Abscissa (X)",
        subtitle:
          "Abscissa (X): deslocamento para direita (+) ou esquerda (−) ao longo da Linha de Terra.",
        script:
          "Vamos dissecar o primeiro número: a Abscissa, que corresponde ao eixo X. Ela é medida diretamente em cima da Linha de Terra, a partir de um ponto zero chamado origem. Se a abscissa é positiva, como mais dois, você anda duas unidades para a direita. Se for negativa, anda para a esquerda. É na abscissa que você traça a Linha de Chamada vertical, bem fininha com a lapiseira zero ponto cinco!",
      },
      {
        id: "afastamento",
        label: "2º · Afastamento (Y)",
        subtitle:
          "Afastamento (Y): distância do ponto até a parede vertical π' (+ à frente, − atrás). Define A.",
        script:
          "O segundo número é o Afastamento, o nosso eixo Y. Atenção no próprio nome: afastamento é o quanto o ponto se afasta da parede vertical pi linha! Se o afastamento for positivo, como mais cinco, o ponto está cinco unidades à frente da parede, na direção do observador. Se for negativo, está atrás da parede. E é o afastamento que determina onde nasce a projeção horizontal A!",
      },
      {
        id: "cota",
        label: "3º · Cota (Z)",
        subtitle:
          "Cota (Z): altura do ponto em relação ao chão horizontal π (+ acima, − abaixo). Define A'.",
        script:
          "O terceiro número é a Cota, o eixo Z. Cota significa altitude, ou seja, a altura do ponto em relação ao chão horizontal pi! Cota positiva, como mais três, quer dizer três unidades acima do chão. Cota negativa quer dizer abaixo do chão, como um subsolo. É a cota que posiciona a projeção vertical A linha na parede!",
      },
      {
        id: "trap-y",
        label: "⚡ A Pegadinha do +Y na Épura!",
        subtitle:
          "Na épura 2D, Cota (+) sobe para A', mas Afastamento (+) DESCE abaixo da LT para A!",
        script:
          "Agora pare tudo e olhe para a tela, porque aqui mora a pegadinha número um da matéria! Associar X, Y e Z ajuda muito para lembrar a sequência dos três números. Porém, quando você vai desenhar na épura em duas dimensões, o chão gira para baixo! Por isso, a Cota positiva mais três sobe normalmente acima da Linha de Terra para marcar A linha; mas o Afastamento positivo mais cinco DESCE abaixo da Linha de Terra para marcar A! Gravou? Cota positiva sobe, afastamento positivo desce!",
      },
    ],
  },
  {
    id: "ep03-diedros",
    scenes: [
      {
        id: "intro",
        label: "Os 4 Cômodos do Espaço",
        subtitle:
          "O cruzamento de π e π' divide o espaço em 4 Diedros numerados no sentido anti-horário.",
        script:
          "No episódio três, vamos explorar os quatro Diedros! Quando o plano horizontal pi e o plano vertical pi linha se atravessam perpendicularmente, eles não param na Linha de Terra: eles continuam infinitamente para trás e para baixo! Com isso, o espaço inteiro fica dividido em quatro grandes regiões chamadas Diedros, numeradas no sentido anti-horário, igualzinho aos quadrantes da trigonometria.",
      },
      {
        id: "d1",
        label: "1º Diedro (+ ; +)",
        subtitle:
          "1º Diedro: à frente de π' (+afast.) e acima de π (+cota). Na épura: A' ACIMA e A ABAIXO da LT.",
        script:
          "Olhando o sistema de perfil aqui na tela, o primeiro diedro fica no canto superior direito: é onde nós, observadores, estamos! Nele, o ponto está à frente da parede e acima do chão, então tanto o afastamento quanto a cota são positivos. Quando rebatemos para a épura, a cota positiva joga A linha para cima da Linha de Terra, e o afastamento positivo joga A para baixo!",
      },
      {
        id: "d2",
        label: "2º Diedro (− ; +)",
        subtitle:
          "2º Diedro: atrás de π' (−afast.) e acima de π (+cota). Na épura: AMBAS (A' e A) ACIMA da LT!",
        script:
          "Girando no sentido anti-horário, chegamos ao segundo diedro, lá atrás da parede vertical, mas ainda acima do chão! Aqui o afastamento é negativo e a cota é positiva. Olha o que acontece na épura: a cota positiva mantém A linha acima da Linha de Terra, e como o piso de trás rebate para cima, o afastamento negativo também joga A para cima! No segundo diedro, as duas projeções ficam acima da Linha de Terra!",
      },
      {
        id: "d3",
        label: "3º Diedro (− ; −)",
        subtitle:
          "3º Diedro: atrás de π' (−afast.) e abaixo de π (−cota). Inverte o 1º: A ACIMA e A' ABAIXO da LT!",
        script:
          "Continuando no sentido anti-horário, descemos para o terceiro diedro: atrás da parede e abaixo do chão, com afastamento negativo e cota negativa. Ele é o espelho invertido do primeiro diedro! Na épura, o afastamento negativo faz a projeção A subir acima da Linha de Terra, enquanto a cota negativa faz A linha descer abaixo dela!",
      },
      {
        id: "d4-rule",
        label: "4º Diedro (+ ; −) & Regra de Ouro",
        subtitle:
          "4º Diedro: ambos ABAIXO da LT. Regra: ÍMPARES (1º, 3º) = lados opostos · PARES (2º, 4º) = mesmo lado!",
        script:
          "Por fim, o quarto diedro fica na frente da parede e abaixo do chão: afastamento positivo e cota negativa. Como os dois vão para baixo na épura, tanto A quanto A linha ficam abaixo da Linha de Terra! Agora guarde o macete infalível para provas: diedros ímpares, primeiro e terceiro, têm projeções em lados opostos da Linha de Terra. Diedros pares, segundo e quarto, têm as duas projeções do mesmo lado: segundo ambas acima, quarto ambas abaixo!",
      },
    ],
  },
  {
    id: "ep04-rebatimento",
    scenes: [
      {
        id: "intro",
        label: "O Problema da Folha Plana",
        subtitle:
          "No espaço, π e π' formam 90°. Como transformar dois planos ortogonais em um único desenho 2D?",
        script:
          "Chegou o episódio mais importante para destravar sua visão espacial: o segredo da Épura e do Rebatimento! No espaço tridimensional, o chão pi e a parede pi linha formam um ângulo reto de noventa graus. Só que a sua folha de desenho na UERJ é completamente plana! Como Monge colocou os dois planos sobre a mesma folha sem perder nenhuma medida?",
      },
      {
        id: "hinge",
        label: "A Dobradiça na Linha de Terra",
        subtitle:
          "Mantemos a parede π' parada e usamos a Linha de Terra (LT) como dobradiça para girar o chão π.",
        script:
          "A resposta é elegante e simples: nós deixamos a parede vertical pi linha completamente parada e usamos a Linha de Terra como uma dobradiça! Aí giramos o plano horizontal pi exatamente noventa graus no sentido horário até ele ficar totalmente alinhado e colado com o plano vertical, formando um único plano contínuo: a nossa Épura!",
      },
      {
        id: "front-down",
        label: "Piso Frontal (πA) Desce 90°",
        subtitle:
          "A metade anterior (afastamento +) gira 90° para BAIXO, coincidindo com π' inferior (abaixo da LT).",
        script:
          "Observe agora a animação girando bem devagar de zero até noventa graus! Acompanhe o arco de compasso azul: a metade da frente do chão, chamada semiplano horizontal anterior, onde moram todos os afastamentos positivos, gira noventa graus para baixo e encosta na parte inferior da parede. É exatamente por causa desse giro físico que o afastamento positivo cai abaixo da Linha de Terra!",
      },
      {
        id: "back-up",
        label: "Piso Traseiro (πP) Sobe 90°",
        subtitle:
          "Ao mesmo tempo, a metade posterior (afastamento −) gira 90° para CIMA, coincidindo com π' superior!",
        script:
          "E como o plano horizontal é uma prancha rígida inteiriça, enquanto a frente desce, a parte de trás sobe! O semiplano horizontal posterior, onde ficam os afastamentos negativos do segundo e terceiro diedros, gira noventa graus para cima e encosta na parte superior da parede. Por isso, na épura, qualquer afastamento negativo é marcado para cima da Linha de Terra!",
      },
      {
        id: "chamada",
        label: "A Linha de Chamada Final",
        subtitle:
          "Como o giro preserva a abscissa X, A e A' terminam sempre alinhados na mesma perpendicular à LT!",
        script:
          "E olha a consequência matemática maravilhosa desse rebatimento: durante o giro, a distância do ponto até a Linha de Terra não estica nem encolhe, e a abscissa continua travada no mesmo lugar! Por isso, na folha final, a projeção A e a projeção A linha sempre terminam ligadas por uma única reta vertical perfeitamente perpendicular à Linha de Terra, a famosa Linha de Chamada!",
      },
    ],
  },
  {
    id: "ep05-bissetores",
    scenes: [
      {
        id: "intro",
        label: "O Alfabeto do Ponto",
        subtitle:
          "Além dos 4 diedros, um ponto pode estar sobre os planos de projeção, na LT ou nos bissetores!",
        script:
          "No episódio cinco, vamos subir para o nível de prova da UERJ estudando os casos especiais do ponto! Nem todo ponto flutua no meio de um diedro. O que acontece quando uma das coordenadas vale zero, ou quando o afastamento e a cota têm exatamente o mesmo tamanho? Vamos visualizar cada caso agora!",
      },
      {
        id: "zero-cota",
        label: "Cota = 0 ou Afastamento = 0",
        subtitle:
          "Cota = 0 → ponto apoiado no chão π (A' cai na LT). Afastamento = 0 → encostado na parede π' (A cai na LT).",
        script:
          "Primeiro caso especial: coordenada zero! Se a Cota for zero, a altura é nula, então o ponto está encostado no chão horizontal pi — e na épura, a projeção A linha cai exatamente em cima da Linha de Terra! Já se o Afastamento for zero, o ponto está colado na parede vertical pi linha — então é a projeção A que cai sobre a Linha de Terra! E se os dois forem zero, o ponto está na própria Linha de Terra!",
      },
      {
        id: "bisectors-intro",
        label: "Os Planos Bissetores (45°)",
        subtitle:
          "Dois planos inclinados a 45° dividem os 4 diedros exatamente ao meio: β₁₃ e β₂₄.",
        script:
          "Segundo caso especial que cai muito em prova: os planos bissetores! Eles são dois planos diagonais inclinados exatamente a quarenta e cinco graus que cortam os diedros perfeitamente ao meio. Todo ponto que pertence a um bissetor tem distância igual até o chão e até a parede, ou seja, o módulo do afastamento é igual ao módulo da cota!",
      },
      {
        id: "b13",
        label: "1º Bissetor (β₁₃): Simetria!",
        subtitle:
          "β₁₃ corta 1º e 3º diedros: afastamento = cota (ex: +3 e +3) → A' e A simétricos em relação à LT!",
        script:
          "O primeiro bissetor, chamado beta um três, corta ao meio o primeiro e o terceiro diedros. Nele, afastamento e cota são iguais e com o mesmo sinal, por exemplo mais três e mais três! Na épura, A linha sobe três unidades e A desce três unidades: as projeções ficam perfeitamente simétricas em relação à Linha de Terra!",
      },
      {
        id: "b24",
        label: "2º Bissetor (β₂₄): Coincidência!",
        subtitle:
          "β₂₄ corta 2º e 4º diedros: afastamento = −cota (ex: −3 e +3) → projeções COINCIDEM (B ≡ B')!",
        script:
          "Agora olha a mágica do segundo bissetor, o beta dois quatro, que atravessa o segundo e o quarto diedros! Nele, afastamento e cota têm sinais opostos, como menos três e mais três. Na épura, a cota mais três joga B linha três unidades para cima, e o afastamento menos três também rebate B três unidades para cima! Resultado: B e B linha caem exatamente um em cima do outro, coincidentes! Viu projeções coincidentes fora da Linha de Terra? Pode cravar que é segundo bissetor!",
      },
    ],
  },
  {
    id: "ep06-uerj",
    scenes: [
      {
        id: "intro",
        label: "Resolução da Aula 1 · UERJ",
        subtitle:
          "Vamos resolver passo a passo os dois exercícios fotografados no slide da sua Aula 1!",
        script:
          "Agora vamos aplicar tudo o que aprendemos diretamente nos dois exercícios propostos no slide da sua primeira aula na UERJ! Pegue suas anotações e confira cada passo da representação espacial, da interpretação geométrica e da épura!",
      },
      {
        id: "ex1-points",
        label: "Ex. 1 · Pontos (A) e (B)",
        subtitle:
          "(A)(+2; +5; +3) no 1º Diedro e (B)(−2; −5; −3) no 3º Diedro: simetria total de sinais!",
        script:
          "No Exercício um, temos dois pontos: A em mais dois, mais cinco e mais três, localizado no primeiro diedro; e B em menos dois, menos cinco e menos três, localizado no terceiro diedro. Repare imediatamente na beleza matemática desses números: todas as três coordenadas de B são exatamente o oposto de A! Isso quer dizer que A e B são perfeitamente simétricos em relação à origem zero, zero, zero!",
      },
      {
        id: "ex1-line",
        label: "Ex. 1 · Reta (r) pela Origem!",
        subtitle:
          "Ao unir (A) e (B), o segmento e a reta (r) furam a LT exatamente na origem O(0; 0; 0)!",
        script:
          "Quando você une A e B no espaço para criar a reta r, essa reta sai do primeiro diedro, perfura exatamente a origem zero, zero, zero sobre a Linha de Terra, e entra direto no terceiro diedro, sem jamais passar pelo segundo nem pelo quarto! Na épura, marque x mais dois com A linha subindo três e A descendo cinco; em x menos dois, B linha descendo três e B subindo cinco. Ao ligar A linha com B linha e A com B, as duas projeções r linha e r se cruzam exatamente no zero da Linha de Terra!",
      },
      {
        id: "ex2-points",
        label: "Ex. 2 · Os 3 Pontos no 1º Diedro",
        subtitle:
          "(A)(+1; +2; +3), (B)(+2; +3; +4) e (C)(+3; +4; +5): todos no 1º Diedro, crescendo (+1; +1; +1)!",
        script:
          "Agora olha o Exercício dois: o professor deu três pontos, A em um, dois, três; B em dois, três, quatro; e C em três, quatro, cinco. Como todos têm afastamento e cota positivos, os três flutuam no primeiro diedro. A maioria dos alunos vê três pontos e espera desenhar um triângulo... mas olhe para a diferença entre eles: de A para B somamos mais um em cada coordenada, e de B para C somamos mais um de novo!",
      },
      {
        id: "ex2-collinear",
        label: "Ex. 2 · Plot Twist: Colineares!",
        subtitle:
          "NÃO formam triângulo! São 3 pontos COLINEARES sobre uma única reta paralela ao 1º Bissetor (β₁₃)!",
        script:
          "Aí está a grande interpretação que o exercício pediu: esses três pontos NÃO formam um triângulo! Eles são perfeitamente colineares, formando um único segmento de reta com o ponto B exatamente no meio! Na épura, A linha, B linha e C linha ficam alinhados numa reta a quarenta e cinco graus acima da Linha de Terra, e A, B e C ficam numa reta a menos quarenta e cinco graus abaixo. E vai um bônus para impressionar na aula: como a cota é sempre uma unidade maior que o afastamento, essa reta é paralela ao primeiro bissetor!",
      },
    ],
  },
  {
    id: "ep07-yup-zup",
    scenes: [
      {
        id: "intro",
        label: "Por que a Altura muda de Y para Z?",
        subtitle:
          "Na Computação 3D (Unity, Three.js, OpenGL) a altura é Y. Na Academia (UERJ, Monge, CAD) a altura é Z!",
        script:
          "Este episódio especial responde uma dúvida genial para quem já mexe com computação gráfica ou programação três D! Se você usa Unity, Three JS, OpenGL ou jogos, você acostumou que o eixo Y aponta para cima, sendo a altura. Aí chega na aula de Geometria Descritiva na UERJ e descobre que a altura, chamada de Cota, mudou para o eixo Z! Por que isso acontece?",
      },
      {
        id: "cg-origin",
        label: "Mundo Monitor: Y-Up (Games & WebGL)",
        subtitle:
          "Telas 2D já tinham X horizontal e Y vertical — ao virar 3D, empurraram Z para a profundidade!",
        script:
          "Olha a lógica histórica dos dois mundos! Na computação gráfica de telas e jogos, tudo começou com monitores bidimensionais: a largura da tela era X e a altura da tela era Y. Quando os computadores evoluíram para gráficos três D, mantiveram X e Y na frente da tela e criaram o novo eixo Z apontando para dentro e para fora do monitor como profundidade. Assim nasceu o padrão Y-Up!",
      },
      {
        id: "gd-origin",
        label: "Mundo Prancheta: Z-Up (UERJ, CAD & Blender)",
        subtitle:
          "Na Engenharia e Arquitetura, a planta baixa no chão já usa X e Y — então as paredes sobem em Z!",
        script:
          "Já na Arquitetura, na Engenharia e na Geometria Descritiva de Monge, o raciocínio nasce em cima da mesa de desenho! Primeiro desenhamos a planta baixa horizontal no chão, usando X para a direita e Y para frente. Na hora de erguer as paredes e medir altitudes, o terceiro eixo só podia apontar para o céu: o eixo Z, a nossa Cota! É por isso que Blender, AutoCAD, Revit, Unreal e a UERJ adotam o padrão acadêmico Z-Up!",
      },
      {
        id: "translator",
        label: "Tradução Instantânea: Troque Y ⇄ Z!",
        subtitle:
          "GD (A)(+2; +5; +3) [X, Afast., Cota]  ⟹  Three.js Vector3(+2, +3, +5) [X, Altura, Profund.]!",
        script:
          "E a melhor notícia é que traduzir entre os dois sistemas é ridiculamente simples: o eixo X continua exatamente igual, e você só troca o Y com o Z! Veja o ponto A mais dois, mais cinco e mais três do Exercício um da UERJ: em Geometria Descritiva o cinco é o afastamento e o três é a altura. No motor Three JS deste próprio site, esse mesmo ponto entra como Vector3 dois, três, cinco! Nunca mais você vai confundir os dois mundos!",
      },
    ],
  },
];

function cleanGeminiTtsPcm(pcm, sampleRate = 24000) {
  const totalSamples = Math.floor(pcm.length / 2);
  if (totalSamples < sampleRate * 0.25) return pcm;
  const win = Math.floor(0.02 * sampleRate);
  const checkStart = Math.max(0, totalSamples - Math.floor(0.95 * sampleRate));
  const windows = [];
  for (let s = checkStart; s + win <= totalSamples; s += win) {
    let sumSq = 0;
    for (let i = s; i < s + win; i++) {
      const v = pcm.readInt16LE(i * 2) / 32768;
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
        cutSample = Math.min(totalSamples, windows[j + 1].s + Math.floor(0.06 * sampleRate));
        break;
      }
    }
  }
  const out = Buffer.from(pcm.subarray(0, cutSample * 2));
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchScenePcm(apiKey, text, model) {
  const modelsToTry = [model, "gemini-3.8-flash-lite-tts"];
  for (let attempt = 0; attempt < 5; attempt++) {
    const activeModel = attempt >= 3 ? modelsToTry[1] : modelsToTry[0];
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text }] }],
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
      const waitMs = 15000 + attempt * 10000;
      console.log(`   ⏳ Rate limit (${res.status}) em ${activeModel}, aguardando ${Math.round(waitMs / 1000)}s...`);
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
    console.error("Missing GEMINI_API_KEY");
    process.exitCode = 1;
    return;
  }

  const model = "gemini-3.8-flash-tts";
  const sampleRate = 24000;
  const bytesPerSec = sampleRate * 2; // 16-bit mono
  const pauseBuf = Buffer.alloc(Math.round(0.32 * bytesPerSec)); // 0.32s studio pause

  const outDir = path.resolve(process.cwd(), "public", "audio", "video");
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

    console.log(`\n🎬 Gerando ${ep.id} (${ep.scenes.length} cenas · voz masculina Charon)...`);
    const pcmChunks = [];
    const sceneCues = [];
    let cursorSec = 0;

    for (let i = 0; i < ep.scenes.length; i++) {
      const sc = ep.scenes[i];
      const pcm = await fetchScenePcm(apiKey, sc.script, model);
      await sleep(4500); // Smooth RPM pacing to avoid 429 bursts
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
      audioSrc: `/audio/video/${ep.id}.wav`,
      duration: totalDuration,
      scenes: sceneCues,
    };
    fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 2) + "\n");
    console.log(
      `✅ ${ep.id}.wav salvo (${Math.round(wav.length / 1024)} KB · ${totalDuration}s exatos!)`
    );
  }

  console.log("\n🎉 Todos os episódios em vídeo foram gerados com timestamps exatos!");
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exitCode = 1;
});
