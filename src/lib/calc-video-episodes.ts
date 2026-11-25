import { CalcLabState, DEFAULT_CALC_LAB_STATE, getCalcPreset } from "./calc-math";
import type { VideoSound } from "./video-effects";

export interface CalcVideoSceneCue {
  id: string;
  startSec: number;
  endSec: number;
  label: string;
  subtitle: string;
  soundCue?: VideoSound;
  labExampleId?: string;
}

export interface CalcVideoLabExample {
  id: string;
  chipLabel: string;
  formulaLabel: string;
  labState: CalcLabState;
}

export interface CalcVideoEpisode {
  id: string;
  number: string;
  tag: string;
  title: string;
  subtitle: string;
  audioSrc: string;
  durationHint: string;
  themeAccent: string;
  scenes: CalcVideoSceneCue[];
  examples: CalcVideoLabExample[];
}

export interface CalcEpisodeTimingEntry {
  audioSrc: string;
  duration: number;
  scenes: Array<{
    id: string;
    label: string;
    subtitle: string;
    startSec: number;
    endSec: number;
  }>;
}

export type CalcEpisodeTimingsMap = Record<string, CalcEpisodeTimingEntry>;

export const CALC_VIDEO_EPISODES: CalcVideoEpisode[] = [
  {
    id: "calc-ep01-conjuntos",
    number: "EP. 01",
    tag: "Pré-Cálculo · Caderno",
    title: "Números Reais (ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ) & Conjuntos",
    subtitle:
      "Por que o Cálculo I vive na reta real, a diferença entre ℤ e ℚ, irracionais 𝕀 e notação da aula",
    audioSrc: "/audio/calc-video/calc-ep01-conjuntos.wav",
    durationHint: "1:15",
    themeAccent: "#38BDF8",
    scenes: [
      {
        id: "intro",
        startSec: 0,
        endSec: 18,
        label: "Por que Cálculo vive em ℝ?",
        subtitle:
          "Cálculo I estuda o comportamento de funções reais com valores reais — precisamos de uma reta contínua sem buracos.",
        soundCue: "quadrantChime",
        labExampleId: "c1-ex-sets",
      },
      {
        id: "hierarchy",
        startSec: 18,
        endSec: 40,
        label: "Hierarquia ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ",
        subtitle:
          "ℕ = {1,2,3...} ⊂ ℤ (inteiros) ⊂ ℚ = {a/b | a,b ∈ ℤ, b ≠ 0} (frações!). Atenção: frações moram em ℚ, não em ℤ!",
        soundCue: "compassPin",
        labExampleId: "c1-ex-sets",
      },
      {
        id: "irrationals",
        startSec: 40,
        endSec: 60,
        label: "Irracionais 𝕀 & Aproximação",
        subtitle:
          "ℝ = ℚ ∪ 𝕀: números como √2 e π não viram fração a/b, mas podem ser aproximados por racionais com precisão infinita.",
        soundCue: "lightRay",
        labExampleId: "c1-ex-sets",
      },
      {
        id: "conventions",
        startSec: 60,
        endSec: 75,
        label: "Notação Oficial do Caderno",
        subtitle:
          "Conjuntos levam letra MAIÚSCULA (A, B, X, Y); elementos levam minúscula (x, y, p); '⇔' significa 'se e somente se'.",
        soundCue: "resolve",
        labExampleId: "c1-ex-sets",
      },
    ],
    examples: [
      {
        id: "c1-ex-sets",
        chipLabel: "Classificador ℕ⊂ℤ⊂ℚ⊂ℝ",
        formulaLabel: "Testar 3, −4, 1/2, √2, π",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "intervals",
        },
      },
    ],
  },
  {
    id: "calc-ep02-intervalos",
    number: "EP. 02",
    tag: "Pré-Cálculo · Aula 24/11",
    title: "Intervalos de Reta, Venn & Desigualdades",
    subtitle:
      "Fechado [a,b], aberto ]a,b[, ilimitados, blocos construtores, 2x − 1 ≤ 0 e x² + x − 2 ≥ 0 com Quadro de Sinais",
    audioSrc: "/audio/calc-video/calc-ep02-intervalos.wav",
    durationHint: "1:35",
    themeAccent: "#2DD4BF",
    scenes: [
      {
        id: "types",
        startSec: 0,
        endSec: 20,
        label: "Fechado ● vs Aberto ○ & Ilimitados",
        subtitle:
          "[a, b] inclui os extremos (●); ]a, b[ exclui (○). Ilimitados: ]−∞, a] e [a, +∞[ sempre abertos no infinito!",
        soundCue: "rulerSlide",
        labExampleId: "c2-ex-inter",
      },
      {
        id: "venn",
        startSec: 20,
        endSec: 38,
        label: "Blocos Construtores & Venn",
        subtitle:
          "União X ∪ Y (p ∈ X OU p ∈ Y) junta tudo; Interseção X ∩ Y (p ∈ X E p ∈ Y) pega só a região comum.",
        soundCue: "mirrorGlass",
        labExampleId: "c2-ex-inter",
      },
      {
        id: "ineq-linear",
        startSec: 38,
        endSec: 56,
        label: "Ex 1 Caderno: 2x − 1 ≤ 0",
        subtitle:
          "2x − 1 ≤ 0 ⇔ 2x ≤ 1 ⇔ x ≤ 1/2 ⇒ A = ]−∞, 1/2]. E atenção: dividir por número negativo INVERTE o sinal!",
        soundCue: "pencil",
        labExampleId: "c2-ex-lin",
      },
      {
        id: "ineq-quad",
        startSec: 56,
        endSec: 82,
        label: "Ex 2 Caderno: x² + x − 2 ≥ 0",
        subtitle:
          "Fatorando: (x + 2)(x − 1) ≥ 0. Pelo quadro de sinais, (−)·(−) = (+) para x ≤ −2 e (+)·(+) = (+) para x ≥ 1!",
        soundCue: "squareClick",
        labExampleId: "c2-ex-quad",
      },
      {
        id: "takeaway",
        startSec: 82,
        endSec: 95,
        label: "Solução Final na Reta",
        subtitle:
          "B = ]−∞, −2] ∪ [1, +∞[ — união de dois intervalos ilimitados construídos pelos sinais dos fatores!",
        soundCue: "resolve",
        labExampleId: "c2-ex-quad",
      },
    ],
    examples: [
      {
        id: "c2-ex-inter",
        chipLabel: "Interseção & Venn",
        formulaLabel: "[−2, 3] ∩ ]0, 4] = ]0, 3]",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "intervals",
          intervalPreset: {
            a1: -2,
            b1: 3,
            closedA1: true,
            closedB1: true,
            a2: 0,
            b2: 4,
            closedA2: false,
            closedB2: true,
            op: "intersection",
          },
        },
      },
      {
        id: "c2-ex-lin",
        chipLabel: "Caderno: 2x − 1 ≤ 0",
        formulaLabel: "A = ]−∞, 1/2]",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "intervals",
          inequalityPreset: {
            mode: "linear",
            linA: 2,
            linB: -1,
            linSign: "<=",
          },
        },
      },
      {
        id: "c2-ex-quad",
        chipLabel: "Caderno: x² + x − 2 ≥ 0",
        formulaLabel: "B = ]−∞, −2] ∪ [1, +∞[",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "intervals",
          inequalityPreset: {
            mode: "quadratic",
            r1: -2,
            r2: 1,
            quadSign: ">=",
          },
        },
      },
    ],
  },
  {
    id: "calc-ep03-funcoes",
    number: "EP. 03",
    tag: "Pré-Cálculo · Caderno",
    title: "Definição de Função, Domínio Natural & Raiz",
    subtitle:
      "Diagrama A → B, Im_f ⊆ B, gráfico Gr_f, Ex 1 f(x) = √x, Ex 2 f(x) = 1/(x−1) e o que é a raiz f(x) = 0",
    audioSrc: "/audio/calc-video/calc-ep03-funcoes.wav",
    durationHint: "1:35",
    themeAccent: "#F59E0B",
    scenes: [
      {
        id: "arrows",
        startSec: 0,
        endSec: 22,
        label: "Domínio, Contradomínio & Regra",
        subtitle:
          "f: A → B exige que TODO x ∈ A dispare exatamente UMA flecha. Imagem Im_f = { y ∈ B / ∃ x ∈ D_f t.q. f(x) = y }.",
        soundCue: "compassPin",
        labExampleId: "c3-ex-arrows",
      },
      {
        id: "graph-test",
        startSec: 22,
        endSec: 40,
        label: "Gráfico Gr_f & Reta Vertical",
        subtitle:
          "Gr_f = { (x, y) ∈ ℝ² / y = f(x), x ∈ A }. Toda reta vertical corta o gráfico de uma função no máximo 1 vez!",
        soundCue: "rulerSlide",
        labExampleId: "c3-ex-sqrt",
      },
      {
        id: "dom-sqrt",
        startSec: 40,
        endSec: 60,
        label: "Domínio Natural · Ex 1: √x",
        subtitle:
          "Domínio Natural é o maior subconjunto de ℝ onde f faz sentido. Para f(x) = √x, exigimos x ≥ 0 ⇒ D_f = [0, +∞[.",
        soundCue: "pencil",
        labExampleId: "c3-ex-sqrt",
      },
      {
        id: "dom-rat",
        startSec: 60,
        endSec: 78,
        label: "Domínio Natural · Ex 2: 1/(x−1)",
        subtitle:
          "Denominador não pode zerar! Em f(x) = 1/(x−1), x ≠ 1 ⇒ D_f = ]−∞, 1[ ∪ ]1, +∞[ (assíntota vertical em x = 1).",
        soundCue: "stampAlert",
        labExampleId: "c3-ex-rat",
      },
      {
        id: "roots",
        startSec: 78,
        endSec: 95,
        label: "O que é a Raiz de uma Função?",
        subtitle:
          "Raiz (ou zero) é todo x que faz f(x) = 0 — exatamente onde a curva atravessa o eixo horizontal X!",
        soundCue: "resolve",
        labExampleId: "c3-ex-roots",
      },
    ],
    examples: [
      {
        id: "c3-ex-arrows",
        chipLabel: "Diagrama A → B",
        formulaLabel: "Testar unicidade e Im_f",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "arrows",
          arrowCaseId: "quadratic",
        },
      },
      {
        id: "c3-ex-sqrt",
        chipLabel: "Caderno Ex 1: √x",
        formulaLabel: "D_f = [0, +∞[",
        labState: getCalcPreset("caderno-ex1-sqrt"),
      },
      {
        id: "c3-ex-rat",
        chipLabel: "Caderno Ex 2: 1/(x−1)",
        formulaLabel: "D_f = ]−∞, 1[ ∪ ]1, +∞[",
        labState: getCalcPreset("caderno-ex2-rational"),
      },
      {
        id: "c3-ex-roots",
        chipLabel: "Raízes x² + x − 2",
        formulaLabel: "f(−2)=0 e f(1)=0",
        labState: getCalcPreset("caderno-ineq-quad"),
      },
    ],
  },
  {
    id: "calc-ep04-elementares",
    number: "EP. 04",
    tag: "Caderno · Ementa 1.2–1.3",
    title: "Funções Elementares: Constante, Afim & Inversa",
    subtitle:
      "0) Constante f(x)=c, 1) Afim f(x)=ax+b com tg α = Δy/Δx = a, raiz −b/a, prova Im_f = ℝ, composta e inversa",
    audioSrc: "/audio/calc-video/calc-ep04-elementares.wav",
    durationHint: "1:35",
    themeAccent: "#A855F7",
    scenes: [
      {
        id: "constant",
        startSec: 0,
        endSec: 18,
        label: "0) Função Constante: f(x) = c",
        subtitle:
          "f: ℝ → ℝ levando todo x na mesma constante c. Gráfico é uma reta horizontal com D_f = ℝ e Im_f = { c }.",
        soundCue: "rulerSlide",
        labExampleId: "c4-ex-const",
      },
      {
        id: "afim-slope",
        startSec: 18,
        endSec: 42,
        label: "1) Função Afim · tg α = Δy/Δx = a",
        subtitle:
          "f(x) = ax + b (a ≠ 0). O coeficiente a mede a inclinação: tg α = Δy/Δx = a (a > 0 sobe; a < 0 desce)!",
        soundCue: "squareClick",
        labExampleId: "c4-ex-afim",
      },
      {
        id: "afim-proof",
        startSec: 42,
        endSec: 62,
        label: "Raiz x = −b/a & Prova Im_f = ℝ",
        subtitle:
          "Zerando y = 0 achamos a raiz x = −b/a. E dado qualquer y ∈ ℝ, x = (y−b)/a garante f((y−b)/a) = y ⇒ Im_f = ℝ!",
        soundCue: "quadrantChime",
        labExampleId: "c4-ex-afim",
      },
      {
        id: "composed",
        startSec: 62,
        endSec: 78,
        label: "Função Composta (f ∘ g)(x)",
        subtitle:
          "Na composição f(g(x)), a saída da primeira máquina g alimenta a segunda máquina f — base da Regra da Cadeia!",
        soundCue: "cardFlip",
        labExampleId: "c4-ex-inv",
      },
      {
        id: "inverse",
        startSec: 78,
        endSec: 95,
        label: "Inversa f⁻¹: Espelho em y = x",
        subtitle:
          "Trocar x ↔ y reflete o gráfico na diagonal y = x: e^x e ln(x) são espelhos perfeitos um do outro!",
        soundCue: "mirrorGlass",
        labExampleId: "c4-ex-inv",
      },
    ],
    examples: [
      {
        id: "c4-ex-const",
        chipLabel: "0) Constante f(x) = 2",
        formulaLabel: "D_f = ℝ · Im_f = { 2 }",
        labState: getCalcPreset("caderno-constante"),
      },
      {
        id: "c4-ex-afim",
        chipLabel: "1) Afim (tg α = Δy/Δx)",
        formulaLabel: "f(x) = x + 1 · Raiz −1",
        labState: getCalcPreset("caderno-afim"),
      },
      {
        id: "c4-ex-inv",
        chipLabel: "Inversa e^x ⇄ ln(x)",
        formulaLabel: "Simetria em y = x",
        labState: getCalcPreset("precalc-inverse"),
      },
    ],
  },
  {
    id: "calc-ep05-calc-preview",
    number: "EP. 05",
    tag: "P1 → P2 → P3 · UERJ",
    title: "Mapa do Semestre: Limites, Derivadas & Integrais",
    subtitle:
      "Buraco 0/0 e TVI (P1), Secante → Tangente (h → 0) e Máx/Mín (P2), Integral +C (P3) e estratégia de notas MP/PF",
    audioSrc: "/audio/calc-video/calc-ep05-calc-preview.wav",
    durationHint: "1:40",
    themeAccent: "#EF4444",
    scenes: [
      {
        id: "limits",
        startSec: 0,
        endSec: 22,
        label: "P1 · Limite 0/0 (Buraco) & TVI",
        subtitle:
          "Em (x²−1)/(x−1), f(1) não existe (buraco aberto!), mas pela esquerda e direita a altura tende a L = 2!",
        soundCue: "lightRay",
        labExampleId: "c5-ex-limit",
      },
      {
        id: "deriv-secant",
        startSec: 22,
        endSec: 44,
        label: "P2 · Derivada: Secante → Tangente",
        subtitle:
          "Quando o passo h encolhe até zero, a reta secante gira e vira a reta tangente com inclinação f'(x₀)!",
        soundCue: "hingeFold",
        labExampleId: "c5-ex-secant",
      },
      {
        id: "deriv-apps",
        startSec: 44,
        endSec: 64,
        label: "P2 · Máximos, Mínimos & Inflexão",
        subtitle:
          "f'(x) = 0 revela picos e vales (otimização); f''(x) revela concavidade (∪ ou ∩) e o ponto de inflexão!",
        soundCue: "compassPin",
        labExampleId: "c5-ex-cubic",
      },
      {
        id: "integrals",
        startSec: 64,
        endSec: 84,
        label: "P3 · Integral Indefinida F(x) + C",
        subtitle:
          "Integrar desfaz a derivada: ∫ f(x) dx = F(x) + C cria uma família infinita de curvas deslocadas por +C!",
        soundCue: "axisGyro",
        labExampleId: "c5-ex-integral",
      },
      {
        id: "uerj-roadmap",
        startSec: 84,
        endSec: 100,
        label: "Estratégia UERJ · Prof. Mateus Spezia",
        subtitle:
          "MP = (P1+P2+P3)/3 ≥ 7 aprova direto! Presença ≥ 75% obrigatória; PR 13/04/2027 e PF 20/04/2027.",
        soundCue: "resolve",
        labExampleId: "c5-ex-integral",
      },
    ],
    examples: [
      {
        id: "c5-ex-limit",
        chipLabel: "Limite 0/0 (Buraco)",
        formulaLabel: "(x²−1)/(x−1) → 2",
        labState: getCalcPreset("u1-limit-hole"),
      },
      {
        id: "c5-ex-secant",
        chipLabel: "Animar Secante → Tangente",
        formulaLabel: "h → 0 · f'(x₀)",
        labState: getCalcPreset("u2-secant-tangent"),
      },
      {
        id: "c5-ex-cubic",
        chipLabel: "Cúbica: Máx/Mín/Inflexão",
        formulaLabel: "f'(x)=0 · f''(x)=0",
        labState: getCalcPreset("u3-extrema-inflection"),
      },
      {
        id: "c5-ex-integral",
        chipLabel: "Integral Indefinida + C",
        formulaLabel: "∫ x dx = 0.5x² + C",
        labState: getCalcPreset("u4-antideriv"),
      },
    ],
  },
];

export function resolveCalcVideoLabMoment(
  episode: CalcVideoEpisode,
  scene: CalcVideoSceneCue
): CalcVideoLabExample {
  if (scene.labExampleId) {
    const found = episode.examples.find((e) => e.id === scene.labExampleId);
    if (found) return found;
  }
  return episode.examples[0];
}
