import { GDPoint, GDSegment } from "./gd-math";

export interface VideoSceneCue {
  id: string;
  start: number; // 0.0 to 1.0 normalized timeline
  end: number;
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

export const VIDEO_EPISODES: VideoEpisode[] = [
  {
    id: "ep01-monge",
    number: "EP. 01",
    tag: "Fundamento",
    title: "Por que projetar 3D em 2D?",
    subtitle: "O problema da mosca no quarto e a sacada genial de Gaspard Monge",
    audioSrc: "/audio/lesson-01-problema-monge.wav",
    durationHint: "0:29",
    themeAccent: "#38BDF8",
    scenes: [
      {
        id: "title",
        start: 0,
        end: 0.22,
        label: "Abertura",
        subtitle:
          "Como descrever com precisão absoluta um ponto no espaço 3D usando apenas uma folha plana?",
      },
      {
        id: "single-shadow",
        start: 0.22,
        end: 0.52,
        label: "1 Projeção não basta",
        subtitle:
          "Apenas a sombra no chão (π) esconde a altura — dois pontos diferentes geram a mesma sombra!",
      },
      {
        id: "two-planes",
        start: 0.52,
        end: 0.82,
        label: "2 Planos a 90°",
        subtitle:
          "Monge projeta (A) no chão horizontal (π) e na parede vertical (π') com raios ortogonais a 90°.",
      },
      {
        id: "summary",
        start: 0.82,
        end: 1.01,
        label: "Linha de Terra",
        subtitle:
          "Com A no chão e A' na parede, o ponto (A) no espaço fica 100% determinado!",
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
    subtitle: "A ordem alfabética (x; y; z) e a pegadinha do +Y na épura",
    audioSrc: "/audio/lesson-02-coordenadas-xyz.wav",
    durationHint: "0:35",
    themeAccent: "#F87171",
    scenes: [
      {
        id: "title",
        start: 0,
        end: 0.22,
        label: "XYZ ajuda?",
        subtitle:
          "Associar (x; y; z) ajuda MUITO na ordem — desde que você domine uma única pegadinha!",
      },
      {
        id: "order",
        start: 0.22,
        end: 0.58,
        label: "Ordem Alfabética",
        subtitle:
          "1º Abscissa (X na LT) · 2º Afastamento (Y até π') · 3º Cota (Z altura até π).",
      },
      {
        id: "trap",
        start: 0.58,
        end: 0.84,
        label: "A Pegadinha do +Y",
        subtitle:
          "Ao rebater o chão 90° para baixo, o Afastamento POSITIVO (+Y) desce abaixo da Linha de Terra!",
      },
      {
        id: "recap",
        start: 0.84,
        end: 1.01,
        label: "Resumo de Bolso",
        subtitle:
          "(A)(+2; +5; +3) → x = +2 na LT · A' sobe +3 (Cota) · A desce 5 (Afastamento).",
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
    subtitle: "Sentido anti-horário + regra dos pares e ímpares na épura",
    audioSrc: "/audio/lesson-03-quatro-diedros.wav",
    durationHint: "0:27",
    themeAccent: "#F59E0B",
    scenes: [
      {
        id: "title",
        start: 0,
        end: 0.24,
        label: "Cruzamento 90°",
        subtitle:
          "π e π' dividem todo o espaço em 4 Diedros numerados no sentido anti-horário.",
      },
      {
        id: "orbit",
        start: 0.24,
        end: 0.72,
        label: "Tour 1º → 4º Diedro",
        subtitle:
          "1º (+;+) frente/cima · 2º (−;+) trás/cima · 3º (−;−) trás/baixo · 4º (+;−) frente/baixo.",
      },
      {
        id: "rule",
        start: 0.72,
        end: 1.01,
        label: "Ímpares vs Pares",
        subtitle:
          "Diedros ÍMPARES (1º e 3º): lados opostos da LT. Diedros PARES (2º e 4º): mesmo lado da LT!",
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
    subtitle: "Veja o chão girar em câmera lenta até virar a folha 2D",
    audioSrc: "/audio/lesson-04-rebatimento-epura.wav",
    durationHint: "0:26",
    themeAccent: "#2DD4BF",
    scenes: [
      {
        id: "title",
        start: 0,
        end: 0.24,
        label: "De 3D para Folha 2D",
        subtitle:
          "Como colocar dois planos perpendiculares (90°) dentro de uma única folha de papel?",
      },
      {
        id: "fold",
        start: 0.24,
        end: 0.76,
        label: "Giro Horário 0° → 90°",
        subtitle:
          "Mantemos π' fixo e giramos π em 90° no sentido horário em torno da Linha de Terra!",
      },
      {
        id: "epura-final",
        start: 0.76,
        end: 1.01,
        label: "Linha de Chamada",
        subtitle:
          "A metade frontal do chão desce (abaixo da LT) e a traseira sobe (acima da LT), ligadas pela Linha de Chamada!",
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
    subtitle: "Coordenadas zero + planos a 45° (β₁₃ simétrico e β₂₄ coincidente)",
    audioSrc: "/audio/lesson-05-casos-especiais-bissetores.wav",
    durationHint: "0:35",
    themeAccent: "#A78BFA",
    scenes: [
      {
        id: "zeros",
        start: 0,
        end: 0.42,
        label: "Coordenada Zero",
        subtitle:
          "Cota = 0 → ponto no chão (A' cai na LT). Afastamento = 0 → ponto na parede (A cai na LT).",
      },
      {
        id: "b13",
        start: 0.42,
        end: 0.72,
        label: "1º Bissetor (β₁₃)",
        subtitle:
          "Corta 1º e 3º diedros a 45°: afastamento = cota → projeções A e A' simétricas em relação à LT!",
      },
      {
        id: "b24",
        start: 0.72,
        end: 1.01,
        label: "2º Bissetor (β₂₄)",
        subtitle:
          "Corta 2º e 4º diedros: afastamento = −cota → A e A' COINCIDEM exatamente no mesmo ponto (A ≡ A')!",
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
    title: "Resolução Animada: Ex. 1 e Ex. 2 UERJ",
    subtitle: "A reta pela Origem O(0;0;0) e o plot twist dos 3 pontos colineares!",
    audioSrc: "/audio/lesson-06-uerj-aula1-resolucao.wav",
    durationHint: "0:33",
    themeAccent: "#FB7185",
    scenes: [
      {
        id: "title",
        start: 0,
        end: 0.2,
        label: "Sua Folha UERJ",
        subtitle:
          "Resolvendo passo a passo os dois exercícios fotografados na sua primeira aula na UERJ!",
      },
      {
        id: "ex1",
        start: 0.2,
        end: 0.6,
        label: "Exercício 1 (Origem)",
        subtitle:
          "(A)(+2;+5;+3) e (B)(−2;−5;−3) são opostos: a reta (r) fura a LT exatamente na Origem O(0; 0; 0)!",
      },
      {
        id: "ex2",
        start: 0.6,
        end: 1.01,
        label: "Exercício 2 (Colinear!)",
        subtitle:
          "Plot Twist! (A), (B) e (C) crescem (+1;+1;+1): NÃO formam triângulo — são COLINEARES paralelos a β₁₃!",
      },
    ],
    labPreset: {
      points: [
        { id: "a", label: "A", x: 2, y: 5, z: 3, color: "#1E56A0" },
        { id: "b", label: "B", x: -2, y: -5, z: -3, color: "#C94032" },
      ],
      segments: [{ id: "r", fromId: "a", toId: "b", label: "r", extendLine: true }],
      foldAngle: 0,
      showXYZ: true,
    },
  },
  {
    id: "ep07-yup-zup",
    number: "EP. 07",
    tag: "Especial · 2 Vozes",
    title: "Computação 3D (Y-Up) ⇄ GD (Z-Up)",
    subtitle: "Diálogo multi-voz: por que a altura muda de Y para Z na Academia",
    audioSrc: "/audio/parallel-yup-zup.wav",
    durationHint: "0:52",
    themeAccent: "#34D399",
    scenes: [
      {
        id: "intro",
        start: 0,
        end: 0.34,
        label: "Y-Up vs Z-Up",
        subtitle:
          "Games & WebGL (Unity, Three.js): altura = Y. Academia, UERJ, Engenharia & Blender: altura = Z (Cota)!",
      },
      {
        id: "why",
        start: 0.34,
        end: 0.68,
        label: "Planta Baixa vs Tela",
        subtitle:
          "Na Engenharia o chão já era XY, então as paredes subiram em Z. Nos monitores a tela já era XY, então Z virou profundidade!",
      },
      {
        id: "convert",
        start: 0.68,
        end: 1.01,
        label: "Regra de Conversão",
        subtitle:
          "Para converter GD (x; y; z) em Three.js / Unity: mantenha X e troque Y ↔ Z → Vector3(x, z, y)!",
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
