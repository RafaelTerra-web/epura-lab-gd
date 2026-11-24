import { GDPoint, GDSegment } from "./gd-math";

export interface VideoSceneCue {
  id: string;
  startSec: number;
  endSec: number;
  label: string;
  subtitle: string;
}

export interface VideoEpisode {
  id: string;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  audioSrc: string;
  durationHint: string;
  themeAccent: string;
  scenes: VideoSceneCue[];
  labPreset: {
    points: GDPoint[];
    segments: GDSegment[];
    foldAngle: number;
    showBisectors?: boolean;
    showXYZ?: boolean;
  };
}

export interface EpisodeTimingEntry {
  audioSrc: string;
  duration: number;
  scenes: VideoSceneCue[];
}

export type EpisodeTimingsMap = Record<string, EpisodeTimingEntry>;

export const VIDEO_EPISODES: VideoEpisode[] = [
  {
    id: "ep01-monge",
    number: "EP. 01",
    tag: "Fundamento",
    title: "Por que projetar 3D em 2D?",
    subtitle:
      "O problema da mosca na sala, os 2 planos a 90° de Monge, Linha de Terra e notação UERJ",
    audioSrc: "/audio/video/ep01-monge.wav",
    durationHint: "1:35",
    themeAccent: "#38BDF8",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 20,
        label: "O Desafio 3D → 2D",
        subtitle:
          "Como representar um ponto do espaço 3D em uma folha 2D sem perder nenhuma informação de posição?",
      },
      {
        id: "ambiguous-shadow",
        startSec: 20,
        endSec: 40,
        label: "Por que 1 plano falha?",
        subtitle:
          "Com apenas o chão (π), pontos em alturas diferentes produzem exatamente a mesma sombra!",
      },
      {
        id: "two-planes",
        startSec: 40,
        endSec: 60,
        label: "Os 2 Planos de Monge (90°)",
        subtitle:
          "Gaspard Monge resolve o problema usando DOIS planos perpendiculares: chão (π) e parede (π').",
      },
      {
        id: "lt-and-notation",
        startSec: 60,
        endSec: 80,
        label: "Linha de Terra & Notação",
        subtitle:
          "A interseção de π e π' é a Linha de Terra (LT). Notação UERJ: (A) no espaço, A no chão, A' na parede.",
      },
      {
        id: "takeaway",
        startSec: 80,
        endSec: 95,
        label: "Resumo do Episódio 01",
        subtitle:
          "1 ponto no espaço (A) ⇄ 2 projeções ortogonais (A em π e A' em π') = posição 100% única!",
      },
    ],
    labPreset: {
      points: [{ id: "m1", label: "A", x: 1, y: 4, z: 3, color: "#1E56A0" }],
      segments: [],
      foldAngle: 0,
      showXYZ: false,
    },
  },
  {
    id: "ep02-coordenadas",
    number: "EP. 02",
    tag: "Ordem UERJ",
    title: "Abscissa, Afastamento, Cota & XYZ",
    subtitle:
      "Cada coordenada em detalhe, ordem alfabética (x; y; z) e a pegadinha do +Y na épura",
    audioSrc: "/audio/video/ep02-coordenadas.wav",
    durationHint: "1:45",
    themeAccent: "#F87171",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 20,
        label: "A Ordem Sagrada (X; Y; Z)",
        subtitle:
          "Na convenção brasileira (UERJ), as 3 coordenadas seguem sempre a ordem alfabética: Abscissa, Afastamento e Cota.",
      },
      {
        id: "abscissa",
        startSec: 20,
        endSec: 40,
        label: "1º · Abscissa (X)",
        subtitle:
          "Abscissa (X): deslocamento para direita (+) ou esquerda (−) ao longo da Linha de Terra.",
      },
      {
        id: "afastamento",
        startSec: 40,
        endSec: 60,
        label: "2º · Afastamento (Y)",
        subtitle:
          "Afastamento (Y): distância do ponto até a parede vertical π' (+ à frente, − atrás). Define A.",
      },
      {
        id: "cota",
        startSec: 60,
        endSec: 80,
        label: "3º · Cota (Z)",
        subtitle:
          "Cota (Z): altura do ponto em relação ao chão horizontal π (+ acima, − abaixo). Define A'.",
      },
      {
        id: "trap-y",
        startSec: 80,
        endSec: 105,
        label: "⚡ A Pegadinha do +Y na Épura!",
        subtitle:
          "Na épura 2D, Cota (+) sobe para A', mas Afastamento (+) DESCE abaixo da LT para A!",
      },
    ],
    labPreset: {
      points: [{ id: "c1", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" }],
      segments: [],
      foldAngle: 90,
      showXYZ: true,
    },
  },
  {
    id: "ep03-diedros",
    number: "EP. 03",
    tag: "4 Regiões",
    title: "Os 4 Diedros e a Bússola de Sinais",
    subtitle:
      "Tour completo pelo 1º, 2º, 3º e 4º Diedro + regra infalível dos pares e ímpares",
    audioSrc: "/audio/video/ep03-diedros.wav",
    durationHint: "1:45",
    themeAccent: "#F59E0B",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 20,
        label: "Os 4 Cômodos do Espaço",
        subtitle:
          "O cruzamento de π e π' divide o espaço em 4 Diedros numerados no sentido anti-horário.",
      },
      {
        id: "d1",
        startSec: 20,
        endSec: 40,
        label: "1º Diedro (+ ; +)",
        subtitle:
          "1º Diedro: à frente de π' (+afast.) e acima de π (+cota). Na épura: A' ACIMA e A ABAIXO da LT.",
      },
      {
        id: "d2",
        startSec: 40,
        endSec: 60,
        label: "2º Diedro (− ; +)",
        subtitle:
          "2º Diedro: atrás de π' (−afast.) e acima de π (+cota). Na épura: AMBAS (A' e A) ACIMA da LT!",
      },
      {
        id: "d3",
        startSec: 60,
        endSec: 80,
        label: "3º Diedro (− ; −)",
        subtitle:
          "3º Diedro: atrás de π' (−afast.) e abaixo de π (−cota). Inverte o 1º: A ACIMA e A' ABAIXO da LT!",
      },
      {
        id: "d4-rule",
        startSec: 80,
        endSec: 105,
        label: "4º Diedro (+ ; −) & Regra de Ouro",
        subtitle:
          "4º Diedro: ambos ABAIXO da LT. Regra: ÍMPARES (1º, 3º) = lados opostos · PARES (2º, 4º) = mesmo lado!",
      },
    ],
    labPreset: {
      points: [
        { id: "d1", label: "A", x: -3, y: 3, z: 4, color: "#1E56A0" },
        { id: "d2", label: "B", x: -1, y: -3, z: 4, color: "#0F766E" },
        { id: "d3", label: "C", x: 1, y: -3, z: -4, color: "#C94032" },
        { id: "d4", label: "D", x: 3, y: 3, z: -4, color: "#B45309" },
      ],
      segments: [],
      foldAngle: 0,
      showXYZ: true,
    },
  },
  {
    id: "ep04-rebatimento",
    number: "EP. 04",
    tag: "Momento A-HA!",
    title: "O Segredo da Épura: Rebatimento 90°",
    subtitle:
      "A dobradiça da LT, piso frontal descendo, piso traseiro subindo e a Linha de Chamada",
    audioSrc: "/audio/video/ep04-rebatimento.wav",
    durationHint: "1:40",
    themeAccent: "#2DD4BF",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 20,
        label: "O Problema da Folha Plana",
        subtitle:
          "No espaço, π e π' formam 90°. Como transformar dois planos ortogonais em um único desenho 2D?",
      },
      {
        id: "hinge",
        startSec: 20,
        endSec: 40,
        label: "A Dobradiça na Linha de Terra",
        subtitle:
          "Mantemos a parede π' parada e usamos a Linha de Terra (LT) como dobradiça para girar o chão π.",
      },
      {
        id: "front-down",
        startSec: 40,
        endSec: 60,
        label: "Piso Frontal (πA) Desce 90°",
        subtitle:
          "A metade anterior (afastamento +) gira 90° para BAIXO, coincidindo com π' inferior (abaixo da LT).",
      },
      {
        id: "back-up",
        startSec: 60,
        endSec: 80,
        label: "Piso Traseiro (πP) Sobe 90°",
        subtitle:
          "Ao mesmo tempo, a metade posterior (afastamento −) gira 90° para CIMA, coincidindo com π' superior!",
      },
      {
        id: "chamada",
        startSec: 80,
        endSec: 100,
        label: "A Linha de Chamada Final",
        subtitle:
          "Como o giro preserva a abscissa X, A e A' terminam sempre alinhados na mesma perpendicular à LT!",
      },
    ],
    labPreset: {
      points: [
        { id: "r1", label: "A", x: -2, y: 4, z: 3, color: "#1E56A0" },
        { id: "r2", label: "B", x: 2, y: -3, z: 4, color: "#0F766E" },
      ],
      segments: [],
      foldAngle: 90,
      showXYZ: true,
    },
  },
  {
    id: "ep05-bissetores",
    number: "EP. 05",
    tag: "Nível Prova",
    title: "Planos de Projeção & Bissetores",
    subtitle:
      "Alfabeto do ponto: coordenadas zero, 1º Bissetor (simetria) e 2º Bissetor (coincidência)",
    audioSrc: "/audio/video/ep05-bissetores.wav",
    durationHint: "1:45",
    themeAccent: "#A78BFA",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 20,
        label: "O Alfabeto do Ponto",
        subtitle:
          "Além dos 4 diedros, um ponto pode estar sobre os planos de projeção, na LT ou nos bissetores!",
      },
      {
        id: "zero-cota",
        startSec: 20,
        endSec: 40,
        label: "Cota = 0 ou Afastamento = 0",
        subtitle:
          "Cota = 0 → ponto apoiado no chão π (A' cai na LT). Afastamento = 0 → encostado na parede π' (A cai na LT).",
      },
      {
        id: "bisectors-intro",
        startSec: 40,
        endSec: 60,
        label: "Os Planos Bissetores (45°)",
        subtitle:
          "Dois planos inclinados a 45° dividem os 4 diedros exatamente ao meio: β₁₃ e β₂₄.",
      },
      {
        id: "b13",
        startSec: 60,
        endSec: 80,
        label: "1º Bissetor (β₁₃): Simetria!",
        subtitle:
          "β₁₃ corta 1º e 3º diedros: afastamento = cota (ex: +3 e +3) → A' e A simétricos em relação à LT!",
      },
      {
        id: "b24",
        startSec: 80,
        endSec: 105,
        label: "2º Bissetor (β₂₄): Coincidência!",
        subtitle:
          "β₂₄ corta 2º e 4º diedros: afastamento = −cota (ex: −3 e +3) → projeções COINCIDEM (B ≡ B')!",
      },
    ],
    labPreset: {
      points: [
        { id: "sp1", label: "A", x: -3, y: 3, z: 3, color: "#1E56A0" },
        { id: "sp2", label: "B", x: 0, y: -3, z: 3, color: "#B45309" },
      ],
      segments: [],
      foldAngle: 90,
      showBisectors: true,
    },
  },
  {
    id: "ep06-uerj",
    number: "EP. 06",
    tag: "Aula 1 · UERJ",
    title: "Resolução Completa: Ex. 1 e Ex. 2 UERJ",
    subtitle:
      "Passo a passo dos dois exercícios da sua folha: reta pela Origem O(0;0;0) e colinearidade!",
    audioSrc: "/audio/video/ep06-uerj.wav",
    durationHint: "1:50",
    themeAccent: "#FB7185",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 20,
        label: "Resolução da Aula 1 · UERJ",
        subtitle:
          "Vamos resolver passo a passo os dois exercícios fotografados no slide da sua Aula 1!",
      },
      {
        id: "ex1-points",
        startSec: 20,
        endSec: 40,
        label: "Ex. 1 · Pontos (A) e (B)",
        subtitle:
          "(A)(+2; +5; +3) no 1º Diedro e (B)(−2; −5; −3) no 3º Diedro: simetria total de sinais!",
      },
      {
        id: "ex1-line",
        startSec: 40,
        endSec: 65,
        label: "Ex. 1 · Reta (r) pela Origem!",
        subtitle:
          "Ao unir (A) e (B), o segmento e a reta (r) furam a LT exatamente na origem O(0; 0; 0)!",
      },
      {
        id: "ex2-points",
        startSec: 65,
        endSec: 88,
        label: "Ex. 2 · Os 3 Pontos no 1º Diedro",
        subtitle:
          "(A)(+1; +2; +3), (B)(+2; +3; +4) e (C)(+3; +4; +5): todos no 1º Diedro, crescendo (+1; +1; +1)!",
      },
      {
        id: "ex2-collinear",
        startSec: 88,
        endSec: 110,
        label: "Ex. 2 · Plot Twist: Colineares!",
        subtitle:
          "NÃO formam triângulo! São 3 pontos COLINEARES sobre uma única reta paralela ao 1º Bissetor (β₁₃)!",
      },
    ],
    labPreset: {
      points: [
        { id: "a", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" },
        { id: "b", label: "B", x: -2, y: -5, z: -3, color: "#C94032" },
      ],
      segments: [
        { id: "r", fromId: "a", toId: "b", label: "r", extendLine: true },
      ],
      foldAngle: 0,
      showXYZ: true,
    },
  },
  {
    id: "ep07-yup-zup",
    number: "EP. 07",
    tag: "Computação ⇄ GD",
    title: "3D da Computação (Y-Up) ⇄ GD (Z-Up)",
    subtitle:
      "Por que a altura muda de Y para Z na Academia e como traduzir Unity/Three.js ↔ UERJ",
    audioSrc: "/audio/video/ep07-yup-zup.wav",
    durationHint: "1:30",
    themeAccent: "#34D399",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 22,
        label: "Por que a Altura muda de Y para Z?",
        subtitle:
          "Na Computação 3D (Unity, Three.js, OpenGL) a altura é Y. Na Academia (UERJ, Monge, CAD) a altura é Z!",
      },
      {
        id: "cg-origin",
        startSec: 22,
        endSec: 45,
        label: "Mundo Monitor: Y-Up (Games & WebGL)",
        subtitle:
          "Telas 2D já tinham X horizontal e Y vertical — ao virar 3D, empurraram Z para a profundidade!",
      },
      {
        id: "gd-origin",
        startSec: 45,
        endSec: 68,
        label: "Mundo Prancheta: Z-Up (UERJ, CAD & Blender)",
        subtitle:
          "Na Engenharia e Arquitetura, a planta baixa no chão já usa X e Y — então as paredes sobem em Z!",
      },
      {
        id: "translator",
        startSec: 68,
        endSec: 92,
        label: "Tradução Instantânea: Troque Y ⇄ Z!",
        subtitle:
          "GD (A)(+2; +5; +3) [X, Afast., Cota]  ⟹  Three.js Vector3(+2, +3, +5) [X, Altura, Profund.]!",
      },
    ],
    labPreset: {
      points: [{ id: "a", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" }],
      segments: [],
      foldAngle: 0,
      showXYZ: true,
    },
  },
];
