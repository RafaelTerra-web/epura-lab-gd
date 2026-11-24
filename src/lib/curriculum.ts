import { GDPoint, GDSegment } from "./gd-math";

export interface LessonChapter {
  id: string;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  duration: string;
  professor: "monge" | "epura";
  voiceScript: string;
  keyTakeaways: string[];
  mnemonic?: {
    title: string;
    body: string;
  };
  xyzNote?: {
    title: string;
    body: string;
  };
  interactivePreset: {
    points: GDPoint[];
    segments: GDSegment[];
    defaultFold: number; // 0 to 90
    showBisectors?: boolean;
    showXYZ?: boolean;
    ctaLabel: string;
  };
  sections: Array<{
    heading: string;
    paragraphs: string[];
    callout?: string;
  }>;
  references: string[];
}

export const LESSON_CHAPTERS: LessonChapter[] = [
  {
    id: "01-problema-monge",
    number: "01",
    tag: "Fundamento",
    title: "Por que projetar 3D em 2D?",
    subtitle: "A ideia genial de Gaspard Monge que fundou a Geometria Descritiva",
    duration: "4 min",
    professor: "monge",
    voiceScript:
      "Bem-vindo à nossa primeira aula! Imagine que você quer explicar com precisão absoluta onde uma mosca está voando dentro de uma sala, usando apenas uma folha de papel plana. Se você só desenhar a sombra dela no chão, ninguém sabe a altura! Por isso, Gaspard Monge teve uma ideia brilhante: projetar o ponto em dois planos perpendiculares, o chão horizontal pi e a parede vertical pi linha. Com essas duas sombras ortogonais, o ponto no espaço fica 100 por cento determinado!",
    keyTakeaways: [
      "Uma única projeção 2D perde a profundidade (vários pontos diferentes geram a mesma sombra).",
      "Monge resolve isso usando DOIS planos perpendiculares: Plano Horizontal (π) e Plano Vertical (π').",
      "As projeções são ortogonais (raios projetantes a 90° dos planos), preservando medidas reais.",
      "A interseção entre π e π' forma a Linha de Terra (LT), nossa dobradiça de referência.",
    ],
    mnemonic: {
      title: "Analogia do Quarto",
      body: "Pense no Plano Horizontal (π) como o CHÃO e no Plano Vertical (π') como a PAREDE à sua frente. O rodapé onde o chão encontra a parede é a Linha de Terra (LT)!",
    },
    interactivePreset: {
      points: [{ id: "m1", label: "A", x: 1, y: 4, z: 3, color: "#1E56A0" }],
      segments: [],
      defaultFold: 0,
      showXYZ: false,
      ctaLabel: "Abrir no Lab 3D",
    },
    sections: [
      {
        heading: "O desafio da Aula 1",
        paragraphs: [
          "Exatamente como você anotou na primeira aula na UERJ: o coração da Geometria Descritiva é representar um ponto (e depois retas, planos e sólidos) do espaço 3D em uma folha 2D — de modo que qualquer engenheiro ou arquiteto consiga reconstruir exatamente o objeto original.",
          "Se projetarmos o ponto (A) apenas no chão (π), sabemos o quanto ele está para frente e para o lado, mas perdemos sua altura. Se projetarmos apenas na parede (π'), sabemos a altura e o lado, mas perdemos a distância até a parede.",
        ],
        callout:
          "Regra de ouro: 1 ponto no espaço (A) ⇄ 2 projeções na folha (A no plano horizontal π e A' no plano vertical π'), sempre ligadas por uma mesma Linha de Chamada perpendicular à LT.",
      },
      {
        heading: "Notação Clássica adotada na UERJ",
        paragraphs: [
          "Na tradição brasileira (seguindo Alfredo dos Reis Príncipe Júnior, Álvaro Rodrigues e Virgílio Athayde Pinheiro, muito usada no Rio de Janeiro e na UERJ), escrevemos o ponto no espaço entre parênteses: (A).",
          "Sua projeção horizontal (no chão π) é escrita sem parênteses: A (ou A₁ em alguns livros). Já sua projeção vertical (na parede π') leva um apóstrofo: A' (ou A₂). Você pode alternar entre os dois estilos aqui no app!",
        ],
      },
    ],
    references: [
      "PRÍNCIPE JÚNIOR, Alfredo dos Reis. Noções de Geometria Descritiva, Vol. 1. Nobel.",
      "PINHEIRO, Virgílio Athayde. Noções de Geometria Descritiva (Sistema Mongeano).",
      "MONGE, Gaspard. Géométrie Descriptive (1799).",
    ],
  },
  {
    id: "02-coordenadas-xyz",
    number: "02",
    tag: "Convenção UERJ",
    title: "Abscissa, Afastamento, Cota & XYZ",
    subtitle: "A ordem sagrada dos números — e onde mora a pegadinha com (x, y, z)",
    duration: "5 min",
    professor: "epura",
    voiceScript:
      "Essa é a dúvida mais inteligente da aula um: associar x, y e z ajuda ou confunde? A resposta é: ajuda muito na ordem, desde que você conheça uma única pegadinha! Na convenção brasileira, a ordem é sempre alfabética: primeiro a Abscissa, que é o x ao longo da Linha de Terra; segundo o Afastamento, que é o y, a distância até a parede vertical; e terceiro a Cota, que é o z, a altura em relação ao chão. A pegadinha acontece só na épura 2D: como o chão rebate para baixo, afastamento positivo vai para BAIXO da Linha de Terra!",
    keyTakeaways: [
      "Ordem padrão brasileira (sempre alfabética!): (Abscissa; Afastamento; Cota) = (x; y; z).",
      "Abscissa (x): posição ao longo da Linha de Terra (+ à direita, − à esquerda da origem).",
      "Afastamento (y): distância ao Plano Vertical π' (+ na frente, − atrás). Define a projeção A.",
      "Cota (z): distância ao Plano Horizontal π (+ acima, − abaixo). Define a projeção A'.",
    ],
    mnemonic: {
      title: "Truque Infalível para Nunca Trocar a Ordem",
      body: "ABSCISSA → AFASTAMENTO → COTA está em ORDEM ALFABÉTICA (AB · AF · CO) e também em ordem XYZ! Para lembrar quem gera quem: AFASTAMENTO tem A → projeção A (sem linha). COTA parece 'teto/altura' → projeção A' (com linha lá em cima!).",
    },
    xyzNote: {
      title: "Associar (x, y, z) confunde? Veja a verdade:",
      body: "Associar (x, y, z) É ÓTIMO para nunca errar a sequência dos três números: (A)(+2; +5; +3) significa x=+2, y=+5, z=+3. Só NÃO confunda o plano 2D da épura com o plano cartesiano do Ensino Médio! Na épura, o eixo vertical carrega DUAS informações ao mesmo tempo: a Cota (z) segue normal (+ para cima, − para baixo), mas o Afastamento (y) fica INVERTIDO (+ para baixo, − para cima) porque o piso frontal girou para baixo!",
    },
    interactivePreset: {
      points: [{ id: "c1", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" }],
      segments: [],
      defaultFold: 35,
      showXYZ: true,
      ctaLabel: "Testar com Eixos XYZ",
    },
    sections: [
      {
        heading: "Lendo (A)(+2; +5; +3) sem hesitar",
        paragraphs: [
          "Olhe o ponto (A)(+2; +5; +3) do seu Exercício 1 da UERJ:",
          "1º número (+2) = Abscissa (x): ande 2 unidades para a direita da origem sobre a Linha de Terra e trace a Linha de Chamada vertical bem fininha (grafite HB 0.5).",
          "2º número (+5) = Afastamento (y): o ponto está 5 unidades À FRENTE da parede π'. Na épura, marque A exatamente 5 unidades ABAIXO da LT!",
          "3º número (+3) = Cota (z): o ponto está 3 unidades ACIMA do chão π. Na épura, marque A' exatamente 3 unidades ACIMA da LT!",
        ],
        callout:
          "Resumo de bolso: Abscissa anda na LT · Cota (z) posiciona A' (+ sobe, − desce) · Afastamento (y) posiciona A (+ DESCE, − SOBE).",
      },
    ],
    references: [
      "RODRIGUES, Álvaro José. Geometria Descritiva: Operações Fundamentais e Poliedros. Ao Livro Técnico (RJ).",
      "MACHADO, Ardevan. Geometria Descritiva: Teoria e Exercícios.",
    ],
  },
  {
    id: "03-quatro-diedros",
    number: "03",
    tag: "Visualização Espacial",
    title: "Os 4 Diedros e a Bússola de Sinais",
    subtitle: "Como os dois planos dividem o espaço em 4 regiões numeradas no sentido anti-horário",
    duration: "5 min",
    professor: "monge",
    voiceScript:
      "Os planos horizontal e vertical se cruzam formando quatro regiões infinitas chamadas Diedros, numeradas no sentido anti-horário exatamente como os quadrantes da trigonometria! O primeiro diedro é onde nós estamos: na frente e em cima, afastamento positivo e cota positiva. O segundo fica atrás da parede e em cima. O terceiro fica atrás e embaixo. E o quarto fica na frente e embaixo. Olhe o comparativo dos quatro pontos no laboratório!",
    keyTakeaways: [
      "1º Diedro (+ ; +): à frente e acima → na épura, A' ACIMA e A ABAIXO da LT.",
      "2º Diedro (− ; +): atrás e acima → na épura, A' e A AMBOS ACIMA da LT.",
      "3º Diedro (− ; −): atrás e abaixo → na épura, A ACIMA e A' ABAIXO da LT (oposto ao 1º).",
      "4º Diedro (+ ; −): à frente e abaixo → na épura, A' e A AMBOS ABAIXO da LT.",
    ],
    mnemonic: {
      title: "Regra dos Pares e Ímpares na Épura",
      body: "Diedros ÍMPARES (1º e 3º): projeções em LADOS OPOSTOS da Linha de Terra (uma acima, outra abaixo). Diedros PARES (2º e 4º): projeções do MESMO LADO da LT (2º ambas acima; 4º ambas abaixo)!",
    },
    interactivePreset: {
      points: [
        { id: "q1", label: "A", x: -3, y: 3, z: 4, color: "#1E56A0" },
        { id: "q2", label: "B", x: -1, y: -3, z: 4, color: "#0F766E" },
        { id: "q3", label: "C", x: 1, y: -3, z: -4, color: "#C94032" },
        { id: "q4", label: "D", x: 3, y: 3, z: -4, color: "#B45309" },
      ],
      segments: [],
      defaultFold: 0,
      showXYZ: true,
      ctaLabel: "Comparar os 4 Diedros",
    },
    sections: [
      {
        heading: "Por que a numeração é anti-horária?",
        paragraphs: [
          "Olhando o sistema de perfil (com a Linha de Terra entrando na folha), o 1º Diedro fica no canto superior direito (onde o observador enxerga tanto a parede frontal quanto o piso), o 2º no superior esquerdo, o 3º no inferior esquerdo e o 4º no inferior direito.",
          "Repare na simetria poderosa: o 1º e o 3º Diedros são opostos pela LT, assim como o 2º e o 4º! É por isso que no Exercício 1 da UERJ, (A)(+2; +5; +3) está no 1º Diedro e (B)(-2; -5; -3) cai direto no 3º Diedro.",
        ],
      },
    ],
    references: [
      "PRÍNCIPE JÚNIOR, Alfredo dos Reis. Noções de Geometria Descritiva, Cap. II — Estudo do Ponto.",
    ],
  },
  {
    id: "04-rebatimento-epura",
    number: "04",
    tag: "O Momento A-HA!",
    title: "O Segredo da Épura: Rebatimento de 90°",
    subtitle: "Veja o chão girar 90° em torno da Linha de Terra até virar a folha 2D",
    duration: "4 min",
    professor: "epura",
    voiceScript:
      "Chegou a hora de destravar a épura de uma vez por todas! Como transformar dois planos que fazem noventa graus no espaço em uma única folha de papel? Nós mantemos o plano vertical parado e giramos o plano horizontal noventa graus no sentido horário em torno da Linha de Terra! A metade da frente do chão desce e encosta na parede de baixo. A metade de trás do chão sobe e encosta na parede de cima. Arraste o controle de rebatimento de zero a noventa graus e veja a mágica acontecer!",
    keyTakeaways: [
      "O Plano Vertical (π') fica fixo; o Plano Horizontal (π) gira 90° no sentido horário em torno da LT.",
      "Semiplano Horizontal Anterior (πA, afastamento +) desce e coincide com π'I (abaixo da LT).",
      "Semiplano Horizontal Posterior (πP, afastamento −) sobe e coincide com π'S (acima da LT).",
      "A Linha de Chamada une A e A' sempre perpendicularmente à LT, mantendo a mesma abscissa x.",
    ],
    interactivePreset: {
      points: [
        { id: "r1", label: "A", x: -2, y: 4, z: 3, color: "#1E56A0" },
        { id: "r2", label: "B", x: 2, y: -3, z: 4, color: "#0F766E" },
      ],
      segments: [],
      defaultFold: 90,
      showXYZ: true,
      ctaLabel: "Animar Rebatimento 0° → 90°",
    },
    sections: [
      {
        heading: "A Linha de Chamada é o elo sagrado",
        paragraphs: [
          "Quando o plano horizontal gira 90° em torno da LT, a distância do ponto A até a LT permanece intacta — ela apenas gira como a página de um caderno espiral! Por isso, na épura final, A e A' SEMPRE caem sobre a mesma reta vertical perpendicular à Linha de Terra.",
          "Na folha física, desenhamos a Linha de Chamada fina e leve (lapiseira 0.5 HB) ou tracejada suave, apenas para mostrar que A e A' pertencem ao mesmo ponto (A).",
        ],
      },
    ],
    references: [
      "LACOURT, Helena. Noções e Fundamentos de Geometria Descritiva. LTC (Rio de Janeiro).",
    ],
  },
  {
    id: "05-casos-especiais-bissetores",
    number: "05",
    tag: "Nível Prova",
    title: "Planos de Projeção & Bissetores (β₁₃ e β₂₄)",
    subtitle: "Quando uma coordenada zera ou quando afastamento e cota empatam",
    duration: "5 min",
    professor: "monge",
    voiceScript:
      "Duas famílias de casos especiais caem o tempo todo nas provas de Geometria Descritiva. Primeiro, quando uma coordenada é zero: se a cota é zero, o ponto está no chão e A linha cai em cima da Linha de Terra. Se o afastamento é zero, o ponto está na parede e A cai em cima da Linha de Terra. Segundo, os planos bissetores, que cortam os diedros ao meio a quarenta e cinco graus! No primeiro bissetor, afastamento e cota são iguais e as projeções ficam simétricas. No segundo bissetor, têm sinais opostos e A e A linha caem exatamente no mesmo ponto!",
    keyTakeaways: [
      "Cota = 0 → ponto sobre o Plano Horizontal π (A' fica na LT).",
      "Afastamento = 0 → ponto sobre o Plano Vertical π' (A fica na LT).",
      "1º Bissetor (β₁₃): corta 1º e 3º diedros, afastamento = cota → projeções simétricas em relação à LT.",
      "2º Bissetor (β₂₄): corta 2º e 4º diedros, afastamento = −cota → projeções COINCIDENTES (A ≡ A')!",
    ],
    interactivePreset: {
      points: [
        { id: "sp1", label: "A", x: -3, y: 3, z: 3, color: "#1E56A0" },
        { id: "sp2", label: "B", x: 0, y: -3, z: 3, color: "#B45309" },
        { id: "sp3", label: "C", x: 3, y: 4, z: 0, color: "#0F766E" },
      ],
      segments: [],
      defaultFold: 0,
      showBisectors: true,
      ctaLabel: "Explorar Bissetores em 3D",
    },
    sections: [
      {
        heading: "Por que β₂₄ faz A e A' coincidirem?",
        paragraphs: [
          "Pegue o ponto (B)(0; −3; +3). A cota é +3, então B' fica 3 unidades ACIMA da LT. O afastamento é −3; como afastamento negativo também sobe no rebatimento, B também fica 3 unidades ACIMA da LT! Resultado: B e B' caem exatamente um em cima do outro (escrevemos B ≡ B').",
        ],
        callout:
          "Dica de prova: se na épura você vir A ≡ A' fora da LT, pode cravar sem medo que o ponto pertence ao 2º Bissetor (β₂₄)!",
      },
    ],
    references: [
      "PRÍNCIPE JÚNIOR, Alfredo dos Reis. Noções de Geometria Descritiva — Alfabeto do Ponto.",
    ],
  },
  {
    id: "06-uerj-aula1-resolucao",
    number: "06",
    tag: "Sua Aula 1 · UERJ",
    title: "Resolução Guiada: Exercícios 1 e 2 da UERJ",
    subtitle: "Passo a passo animado dos dois exercícios fotografados na sua aula",
    duration: "6 min",
    professor: "epura",
    voiceScript:
      "Aqui vamos resolver juntos, passo a passo, exatamente os dois exercícios do slide da sua primeira aula na UERJ! No Exercício 1, ligamos A no primeiro diedro com B no terceiro diedro e descobrimos que a reta r fura a Linha de Terra exatamente na origem zero, zero, zero. E no Exercício 2, o professor colocou uma surpresa genial: os três pontos A, B e C não formam um triângulo, eles estão perfeitamente alinhados formando uma única reta paralela ao primeiro bissetor!",
    keyTakeaways: [
      "Exercício 1: (A)(+2; +5; +3) no 1ºD e (B)(-2; -5; -3) no 3ºD são simétricos em relação à origem O(0; 0; 0).",
      "Na épura do Ex. 1, as projeções r (ligando A a B) e r' (ligando A' a B') cruzam a LT no mesmo ponto x = 0.",
      "Exercício 2: (A)(+1; +2; +3), (B)(+2; +3; +4), (C)(+3; +4; +5) variam (+1; +1; +1) entre si → são COLINEARES!",
      "Na épura do Ex. 2, A'-B'-C' formam uma reta a +45° acima da LT e A-B-C uma reta a −45° abaixo da LT (paralela a β₁₃).",
    ],
    interactivePreset: {
      points: [
        { id: "a", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" },
        { id: "b", label: "B", x: -2, y: -5, z: -3, color: "#C94032" },
      ],
      segments: [{ id: "r", fromId: "a", toId: "b", label: "r", extendLine: true }],
      defaultFold: 0,
      showXYZ: true,
      ctaLabel: "Abrir Exercício 1 no Lab",
    },
    sections: [
      {
        heading: "Exercício 1: (A)(+2; +5; +3) e (B)(-2; -5; -3)",
        paragraphs: [
          "1. Representação espacial: (A) está no 1º Diedro (2 à direita, 5 à frente, 3 acima) e (B) no 3º Diedro (2 à esquerda, 5 atrás, 3 abaixo).",
          "2. Unindo (A) e (B): como todas as coordenadas de (B) são o oposto exato de (A), o ponto médio é O(0; 0; 0)! O segmento atravessa a Linha de Terra exatamente na origem, saindo do 1º Diedro direto para o 3º Diedro sem passar pelo 2º nem pelo 4º.",
          "3. Reta (r) e suas projeções: prolongando o segmento além de (A) e (B), obtemos a reta (r). Sua projeção horizontal r une A e B; sua projeção vertical r' une A' e B'.",
          "4. Épura: marque x=+2 com A' em +3 (acima) e A em 5 (abaixo); marque x=−2 com B' em 3 (abaixo) e B em 5 (acima). Ao ligar A'–B' (reta r') e A–B (reta r), ambas se cruzam exatamente na origem O sobre a LT!",
        ],
      },
      {
        heading: "Exercício 2: (A)(+1; +2; +3), (B)(+2; +3; +4) e (C)(+3; +4; +5)",
        paragraphs: [
          "1. Representação espacial: todos têm afastamento e cota positivos → os três estão no 1º Diedro, subindo como degraus uniformes.",
          "2. Unindo os pontos — a interpretação: calcule a diferença entre pontos consecutivos: B − A = (+1; +1; +1) e C − B = (+1; +1; +1). Como os vetores são idênticos, os três pontos são COLINEARES! A 'figura formada' NÃO é um triângulo — é um segmento de reta (A)(C) contendo (B) exatamente no meio!",
          "3. Na épura: em x=+1,+2,+3, as projeções verticais A'(+3), B'(+4), C'(+5) formam uma linha reta inclinada a 45° acima da LT; as horizontais A(−2), B(−3), C(−4) formam uma linha reta inclinada a −45° abaixo da LT. Como cota − afastamento = +1 sempre constante, a reta é paralela ao 1º Bissetor (β₁₃)!",
        ],
        callout:
          "Na aba 'Praticar', há um módulo dedicado com checklist interativo passo a passo para os Exercícios 1 e 2 da sua folha!",
      },
    ],
    references: [
      "Slides da Aula 1 — Geometria Descritiva · UERJ (Exercícios Propostos 1 e 2).",
    ],
  },
];

export const DRAWING_KIT_ITEMS = [
  {
    id: "esquadros",
    name: "Par de Esquadros",
    spec: "45°/45°/90° + 30°/60°/90°",
    summary:
      "Combinados e deslizados um sobre o outro, permitem traçar retas paralelas, perpendiculares (Linhas de Chamada!) e todos os ângulos múltiplos de 15° (15°, 30°, 45°, 60°, 75°, 90°, 105°, 120°, 135°, 150°, 165°).",
    uerjTip:
      "Para traçar Linhas de Chamada perfeitamente a 90° da Linha de Terra, apoie um esquadro firme na LT (esquadro-guia) e deslize o outro sobre ele!",
  },
  {
    id: "lapiseiras",
    name: "Lapiseiras 0.5 mm e 0.7 mm",
    spec: "0.5 mm HB (linhas finas) · 0.7 mm 2B (linhas grossas)",
    summary:
      "A hierarquia de traços é o que deixa uma épura legível: linhas de chamada e linhas auxiliares sempre finas e suaves (0.5 HB); Linha de Terra, segmentos finais e resposta em destaque firme (0.7 2B).",
    uerjTip:
      "Nunca apague as linhas de chamada! Elas provam como você construiu a épura — basta fazê-las bem fininhas com a 0.5 HB.",
  },
  {
    id: "grafites",
    name: "Grafites (H vs B) e Borracha",
    spec: "H = duro/claro (mais argila) · B = macio/escuro (mais grafite)",
    summary:
      "Quanto maior o número antes do H (2H, 4H), mais duro e claro é o traço (ótimo para construções auxiliares). Quanto maior o B (2B, 4B), mais macio e preto (ótimo para destaque final). Use borracha macia branca para limpar sem borrar o papel.",
    uerjTip:
      "Limpe os esquadros com pano seco antes de desenhar para não arrastar pó do grafite 2B sobre a folha!",
  },
  {
    id: "compasso",
    name: "Compasso Técnico",
    spec: "Arcos, circunferências e transporte de medidas",
    summary:
      "Além de desenhar circunferências, em GD o compasso é a ferramenta oficial para transportar medidas com precisão (como rebater planos e girar pontos até a Linha de Terra!).",
    uerjTip:
      "Mantenha a ponta de grafite do compasso chanfrada em bisel e na mesma altura da ponta seca metálica.",
  },
  {
    id: "transferidor",
    name: "Transferidor",
    spec: "Escala circular (360°) ou semicircular (180°)",
    summary:
      "Funciona como uma régua de ângulos para medir ou marcar inclinações fora dos múltiplos de 15° dos esquadros.",
    uerjTip:
      "Alinhe sempre o centro de mira do transferidor exatamente sobre o vértice do ângulo e o zero sobre a reta de referência.",
  },
  {
    id: "folhas",
    name: "Folhas A4 e A3 com Legenda",
    spec: "ABNT NBR 10068 · Legenda no canto inferior direito",
    summary:
      "Formatos padronizados A4 (210 × 297 mm) e A3 (297 × 420 mm), com margens técnicas (esquerda 25 mm para encadernação; demais 7 mm no A4 / 10 mm no A3) e legenda (carimbo) sempre no canto inferior direito.",
    uerjTip:
      "Na legenda sempre constam: instituição (UERJ), disciplina (Geometria Descritiva), título da prancha, nome do aluno, escala, data e número da folha.",
  },
];

export const SET_SQUARE_ANGLES = [
  { angle: 15, formula: "45° − 30° (ou 60° − 45°)", combo: "45° apoiado invertido sobre 30°" },
  { angle: 30, formula: "30° direto", combo: "Esquadro 30°/60°/90°" },
  { angle: 45, formula: "45° direto", combo: "Esquadro 45°/45°/90°" },
  { angle: 60, formula: "60° direto", combo: "Esquadro 30°/60°/90°" },
  { angle: 75, formula: "45° + 30°", combo: "Soma do ângulo de 45° com o de 30°" },
  { angle: 90, formula: "90° direto", combo: "Qualquer esquadro (Linhas de Chamada!)" },
  { angle: 105, formula: "60° + 45°", combo: "Soma do ângulo de 60° com o de 45°" },
  { angle: 120, formula: "90° + 30°", combo: "Ângulo reto + 30°" },
  { angle: 135, formula: "90° + 45°", combo: "Ângulo reto + 45°" },
  { angle: 150, formula: "90° + 60°", combo: "Ângulo reto + 60°" },
  { angle: 165, formula: "180° − 15° (90° + 45° + 30°)", combo: "Suplementar de 15°" },
];
