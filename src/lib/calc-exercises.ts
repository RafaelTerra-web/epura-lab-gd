import { CalcLabState, DEFAULT_CALC_LAB_STATE, getCalcPreset } from "./calc-math";

export type CalcExerciseTrack =
  | "precalc_sets"
  | "precalc_func"
  | "calc_limits"
  | "calc_derivatives"
  | "calc_integrals";

export interface CalcExercise {
  id: string;
  track: CalcExerciseTrack;
  badge: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint: string;
  explanation: string;
  xp: number;
  labState?: CalcLabState;
}

export const CALC_EXERCISES: CalcExercise[] = [
  // ---- PRÉ-CÁLCULO: CONJUNTOS, INTERVALOS & DESIGUALDADES ----
  {
    id: "pc-s1",
    track: "precalc_sets",
    badge: "Pré-Cálculo · Conjuntos",
    prompt: "Qual conjunto numérico é formalmente definido por { a/b | a, b ∈ ℤ e b ≠ 0 }?",
    options: [
      "Conjunto dos Números Naturais (ℕ)",
      "Conjunto dos Números Inteiros (ℤ)",
      "Conjunto dos Números Racionais (ℚ)",
      "Conjunto dos Números Irracionais (𝕀)",
    ],
    correctIndex: 2,
    hint: "Pense na palavra 'quociente' (divisão de dois inteiros com denominador não nulo).",
    explanation:
      "ℚ (de 'quociente') é o conjunto dos números racionais: toda razão a/b entre inteiros com b ≠ 0. Já ℤ reúne apenas os inteiros sem fração (..., −2, −1, 0, 1, 2, ...).",
    xp: 20,
    labState: { ...DEFAULT_CALC_LAB_STATE, subMode: "intervals" },
  },
  {
    id: "pc-s2",
    track: "precalc_sets",
    badge: "Pré-Cálculo · Intervalos",
    prompt: "Qual alternativa descreve corretamente o intervalo aberto ]−2, 5[ na reta real?",
    options: [
      "{ x ∈ ℝ / −2 ≤ x ≤ 5 }",
      "{ x ∈ ℝ / −2 < x < 5 }",
      "{ x ∈ ℝ / −2 ≤ x < 5 }",
      "{ −1, 0, 1, 2, 3, 4 }",
    ],
    correctIndex: 1,
    hint: "Colchetes voltados para fora (ou parênteses) significam bolinha aberta ○ — os extremos ficam de fora, mas TODOS os reais no meio entram!",
    explanation:
      "O intervalo aberto ]−2, 5[ contém todos os infinitos números reais estritamente entre −2 e 5: { x ∈ ℝ / −2 < x < 5 }. Atenção: não são apenas os inteiros!",
    xp: 20,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "intervals",
      intervalPreset: {
        a1: -2,
        b1: 5,
        closedA1: false,
        closedB1: false,
        a2: 0,
        b2: 4,
        closedA2: true,
        closedB2: true,
        op: "intersection",
      },
    },
  },
  {
    id: "pc-s3",
    track: "precalc_sets",
    badge: "Pré-Cálculo · Interseção",
    prompt: "Se X = [−2, 3] e Y = ]0, 4], qual é o conjunto interseção X ∩ Y?",
    options: ["[−2, 4]", "]0, 3]", "[0, 3]", "]0, 3["],
    correctIndex: 1,
    hint: "Na interseção X ∩ Y, o número precisa pertencer aos DOIS intervalos ao mesmo tempo. O 0 está em Y?",
    explanation:
      "A sobreposição vai de 0 até 3. Como 0 NÃO pertence a Y = ]0, 4] (aberto em 0), ele fica fora; já 3 pertence tanto a X quanto a Y. Portanto, X ∩ Y = ]0, 3].",
    xp: 25,
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
    id: "pc-s4",
    track: "precalc_sets",
    badge: "Pré-Cálculo · Desigualdade",
    prompt: "Qual é o conjunto solução da inequação −2x + 6 ≥ 0 em ℝ?",
    options: ["[3, +∞[", "]−∞, 3]", "]−∞, −3]", "]3, +∞["],
    correctIndex: 1,
    hint: "Isole −2x ≥ −6 e lembre do que acontece com o sinal ≥ ao dividir por −2!",
    explanation:
      "−2x + 6 ≥ 0 ⇒ −2x ≥ −6. Ao dividir ambos os lados por −2 (negativo), invertemos o sinal da desigualdade: x ≤ 3, ou seja, ]−∞, 3].",
    xp: 25,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "linear",
      params: { a: -2, b: 6, c: 0 },
      x0: 3,
      showDomainImage: false,
      showRoots: true,
    },
  },
  {
    id: "pc-s5",
    track: "precalc_sets",
    badge: "Caderno 24/11 · Desigualdade 2º Grau",
    prompt: "Qual é o conjunto solução B = { x ∈ ℝ / x² + x − 2 ≥ 0 } fatorado como (x + 2)(x − 1) ≥ 0?",
    options: [
      "[−2, 1]",
      "]−∞, −2] ∪ [1, +∞[",
      "[1, +∞[",
      "]−∞, −2[ ∪ ]1, +∞[",
    ],
    correctIndex: 1,
    hint: "Monte o quadro de sinais dos fatores (x + 2) e (x − 1): quando AMBOS são negativos, o produto (−)·(−) dá POSITIVO!",
    explanation:
      "Fatorando x² + x − 2 = (x + 2)(x − 1). Para x ≤ −2 ambos os fatores são ≤ 0 (produto ≥ 0); entre −2 e 1 têm sinais opostos (produto < 0); para x ≥ 1 ambos são ≥ 0 (produto ≥ 0). Logo B = ]−∞, −2] ∪ [1, +∞[!",
    xp: 30,
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
  {
    id: "pc-s6",
    track: "precalc_sets",
    badge: "Caderno 24/11 · Intervalo Ilimitado",
    prompt: "Qual é a solução em notação de intervalo da desigualdade do caderno A = { x ∈ ℝ / 2x − 1 ≤ 0 }?",
    options: [
      "[1/2, +∞[",
      "]−∞, 1/2[",
      "]−∞, 1/2]",
      "[0, 1/2]",
    ],
    correctIndex: 2,
    hint: "Resolva 2x − 1 ≤ 0 ⇔ 2x ≤ 1 ⇔ x ≤ 1/2. O extremo 1/2 entra fechado, e −∞ é sempre aberto!",
    explanation:
      "2x − 1 ≤ 0 ⇔ 2x ≤ 1 ⇔ x ≤ 1/2. Em notação de intervalo ilimitado: ]−∞, 1/2] (bolinha fechada em 1/2 e colchete aberto no −∞).",
    xp: 20,
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

  // ---- PRÉ-CÁLCULO: FUNÇÕES, DOMÍNIO NATURAL & RAIZ ----
  {
    id: "pc-f1",
    track: "precalc_func",
    badge: "Pré-Cálculo · Definição",
    prompt: "Qual das situações abaixo IMPEDE uma relação de A em B de ser uma função?",
    options: [
      "Dois elementos diferentes de A apontarem para o mesmo elemento em B.",
      "Sobrar algum elemento no contradomínio B sem receber flecha.",
      "Um elemento do domínio A disparar duas flechas para valores distintos de B.",
      "A imagem Im(f) ser menor do que o contradomínio B.",
    ],
    correctIndex: 2,
    hint: "Lembre dos 2 testes da função no diagrama de flechas: todo x em A sai com 1 e SOMENTE 1 flecha.",
    explanation:
      "Na definição de função, cada x ∈ A deve ter uma ÚNICA imagem f(x) ∈ B. Disparar duas flechas para saídas distintas viola a unicidade (no gráfico, uma reta vertical cortaria a curva duas vezes!).",
    xp: 25,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "arrows",
      arrowCaseId: "ambiguous",
    },
  },
  {
    id: "pc-f2",
    track: "precalc_func",
    badge: "Pré-Cálculo · Domínio Natural",
    prompt: "Qual é o domínio natural da função real f(x) = √(x − 2) ?",
    options: ["ℝ", "]2, +∞[", "[2, +∞[", "ℝ − {2}"],
    correctIndex: 2,
    hint: "Nos números reais, o que está dentro de uma raiz quadrada precisa ser maior ou igual a zero.",
    explanation:
      "Para existir em ℝ, exigimos x − 2 ≥ 0 ⇒ x ≥ 2. Como √0 = 0 existe perfeitamente, o extremo 2 entra fechado: D(f) = [2, +∞[.",
    xp: 25,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "sqrt",
      params: { a: 1.5, b: 2, c: 0 },
      x0: 3,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "pc-f3",
    track: "precalc_func",
    badge: "Pré-Cálculo · Domínio Natural",
    prompt: "Qual é o domínio natural de f(x) = ln(x − 1) ?",
    options: ["[1, +∞[", "]1, +∞[", "ℝ − {1}", "]0, +∞["],
    correctIndex: 1,
    hint: "Diferente da raiz quadrada, o logaritmo NÃO aceita zero! O argumento precisa ser estritamente positivo.",
    explanation:
      "Para ln(u) existir em ℝ, precisamos u > 0 (estrito!). Logo x − 1 > 0 ⇒ x > 1, isto é, o intervalo aberto ]1, +∞[.",
    xp: 25,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "ln",
      params: { a: 1.5, b: 1, c: 0 },
      x0: 2,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "pc-f4",
    track: "precalc_func",
    badge: "Pré-Cálculo · Raiz",
    prompt: "Quais são as raízes (zeros) da função f(x) = 0,5x² − 2 ?",
    options: [
      "x = 0 e x = −2",
      "x = −2 e x = +2",
      "Apenas x = +2",
      "Não possui raízes reais",
    ],
    correctIndex: 1,
    hint: "Raiz é todo x tal que f(x) = 0. Resolva 0,5x² − 2 = 0!",
    explanation:
      "Igualando a zero: 0,5x² − 2 = 0 ⇒ 0,5x² = 2 ⇒ x² = 4 ⇒ x = −2 ou x = +2. Geometricamente, são os dois pontos onde a parábola corta o eixo X.",
    xp: 25,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "quadratic",
      params: { a: 0.5, b: 0, c: -2 },
      x0: 2,
      showDomainImage: true,
      showRoots: true,
    },
  },
  {
    id: "pc-f5",
    track: "precalc_func",
    badge: "Caderno Ex 2 · Domínio Natural",
    prompt: "Qual é o domínio natural de f(x) = 1 / (x − 1) em notação de união de intervalos?",
    options: [
      "[1, +∞[",
      "]−∞, 1[ ∪ ]1, +∞[",
      "]−∞, 1] ∪ [1, +∞[",
      "]−∞, 0[ ∪ ]0, +∞[",
    ],
    correctIndex: 1,
    hint: "O denominador x − 1 não pode dar zero (1 − 1 = 0). Todo o resto de ℝ funciona!",
    explanation:
      "Para não dividir por zero exigimos x − 1 ≠ 0 ⇔ x ≠ 1. Como união de dois intervalos abertos: D_f = ]−∞, 1[ ∪ ]1, +∞[.",
    xp: 25,
    labState: getCalcPreset("caderno-ex2-rational"),
  },
  {
    id: "pc-f6",
    track: "precalc_func",
    badge: "Caderno · Função Constante",
    prompt: "Para a função constante f: ℝ → ℝ definida por f(x) = c (com c ∈ ℝ fixo), qual é sua imagem Im_f?",
    options: [
      "Im_f = ℝ",
      "Im_f = [0, c]",
      "Im_f = { c }",
      "Im_f = ∅",
    ],
    correctIndex: 2,
    hint: "Qualquer que seja o x de entrada, a saída f(x) sempre cai exatamente na mesma altura y = c!",
    explanation:
      "Na função constante f(x) = c, todos os infinitos pontos do domínio D_f = ℝ são levados ao único valor c. Portanto Im_f = { c } (conjunto unitário).",
    xp: 20,
    labState: getCalcPreset("caderno-constante"),
  },
  {
    id: "pc-f7",
    track: "precalc_func",
    badge: "Caderno · Função Afim",
    prompt: "Na função afim f(x) = ax + b (com a ≠ 0), por que podemos provar que Im_f = ℝ para todo y ∈ ℝ?",
    options: [
      "Porque basta escolher x = 0 para obter qualquer y.",
      "Porque podemos isolar x = (y − b)/a (já que a ≠ 0) e verificar que f((y − b)/a) = y.",
      "Porque o gráfico nunca cruza o eixo X.",
      "Porque a tangente tg α = Δy/Δx é sempre igual a 0.",
    ],
    correctIndex: 1,
    hint: "Dado qualquer alvo y ∈ ℝ, resolva a equação y = ax + b para encontrar qual x de entrada gera esse y!",
    explanation:
      "Como a ≠ 0, para qualquer y ∈ ℝ existe x = (y − b)/a ∈ ℝ tal que f((y − b)/a) = a·((y − b)/a) + b = y. Isso prova formalmente que Im_f = ℝ! Além disso, a = Δy/Δx = tg α mede a inclinação da reta e a raiz é x = −b/a.",
    xp: 30,
    labState: getCalcPreset("caderno-afim"),
  },

  // ---- UNIDADE 1 (P1): LIMITES & CONTINUIDADE ----
  {
    id: "u1-l1",
    track: "calc_limits",
    badge: "P1 · Indeterminação 0/0",
    prompt: "Calcule lim_{x→1} (x² − 1) / (x − 1).",
    options: ["0", "1", "2", "Não existe"],
    correctIndex: 2,
    hint: "Substituir x = 1 dá 0/0. Use diferença de quadrados: x² − 1 = (x − 1)(x + 1)!",
    explanation:
      "Para x ≠ 1, (x² − 1)/(x − 1) = (x − 1)(x + 1)/(x − 1) = x + 1. Logo lim_{x→1} (x + 1) = 1 + 1 = 2 (há um buraco em (1, 2), mas o limite existe!).",
    xp: 30,
    labState: getCalcPreset("u1-limit-hole"),
  },
  {
    id: "u1-l2",
    track: "calc_limits",
    badge: "P1 · TVI",
    prompt:
      "Seja f contínua em [0, 2] com f(0) = −3 e f(2) = +5. O que o Teorema do Valor Intermediário (TVI) garante?",
    options: [
      "A derivada f'(c) = 0 em algum ponto c ∈ ]0, 2[.",
      "Existe pelo menos um c ∈ ]0, 2[ tal que f(c) = 0.",
      "f é estritamente crescente em [0, 2].",
      "f(1) = 1 obrigatoriamente.",
    ],
    correctIndex: 1,
    hint: "Se uma curva contínua começa abaixo do eixo X (−3) e termina acima (+5), ela precisa atravessar y = 0!",
    explanation:
      "Como 0 está entre f(0) = −3 e f(2) = +5 e f é contínua em [0, 2], o TVI garante a existência de pelo menos um c ∈ ]0, 2[ tal que f(c) = 0 (uma raiz!).",
    xp: 30,
    labState: getCalcPreset("caderno-ineq-quad"),
  },

  // ---- UNIDADE 2 & 3 (P2): DERIVADAS & APLICAÇÕES ----
  {
    id: "u2-d1",
    track: "calc_derivatives",
    badge: "P2 · Derivada & Tangente",
    prompt: "Para f(x) = 0,5x² − 1, qual é a inclinação da reta tangente em x₀ = 2?",
    options: ["1", "2", "0,5", "3"],
    correctIndex: 1,
    hint: "Derive f(x) = 0,5x² − 1 usando a regra da potência e substitua x = 2.",
    explanation:
      "f'(x) = 0,5 · 2x = x. Portanto, em x₀ = 2, o coeficiente angular da tangente é f'(2) = 2.",
    xp: 30,
    labState: {
      ...getCalcPreset("u2-secant-tangent"),
      x0: 2,
      h: 0.4,
    },
  },
  {
    id: "u2-d2",
    track: "calc_derivatives",
    badge: "P2 · Regra da Cadeia",
    prompt: "Qual é a derivada de f(x) = (3x + 1)⁴ ?",
    options: [
      "4(3x + 1)³",
      "12(3x + 1)³",
      "4(3)³",
      "12x(3x + 1)³",
    ],
    correctIndex: 1,
    hint: "Regra da Cadeia: derive a potência externa (4u³) e multiplique pela derivada interna u' = (3x + 1)' = 3!",
    explanation:
      "Com u = 3x + 1, temos u' = 3. Pela Regra da Cadeia: f'(x) = 4(3x + 1)³ · 3 = 12(3x + 1)³.",
    xp: 30,
  },
  {
    id: "u3-d3",
    track: "calc_derivatives",
    badge: "P2 · Não Derivável",
    prompt: "Sobre f(x) = |x − 1| no ponto x = 1, qual afirmação é verdadeira?",
    options: [
      "É descontínua e não derivável em x = 1.",
      "É contínua e derivável com f'(1) = 0.",
      "É contínua em x = 1, porém NÃO é derivável em x = 1.",
      "Tem assíntota vertical em x = 1.",
    ],
    correctIndex: 2,
    hint: "Olhe o formato em 'V' da função modular: o gráfico não quebra, mas forma um bico agudo!",
    explanation:
      "Em x = 1 a curva não salta (é contínua!), porém a inclinação pela esquerda vale −1 e pela direita vale +1. Como os limites laterais da derivada diferem, f'(1) não existe.",
    xp: 30,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "abs",
      params: { a: 1, b: 1, c: 0 },
      x0: 1,
      showTangent: true,
      showDerivative: true,
    },
  },

  // ---- UNIDADE 4 (P3): INTEGRAÇÃO INDEFINIDA ----
  {
    id: "u4-i1",
    track: "calc_integrals",
    badge: "P3 · Integral Indefinida",
    prompt: "Qual é a integral indefinida ∫ (3x² + 2) dx ?",
    options: [
      "6x + C",
      "x³ + 2x + C",
      "3x³ + 2x + C",
      "x³ + 2",
    ],
    correctIndex: 1,
    hint: "Some 1 ao expoente e divida pelo novo expoente — e nunca esqueça da constante '+ C'!",
    explanation:
      "∫ 3x² dx = 3·(x³/3) = x³ e ∫ 2 dx = 2x. Somando a constante arbitrária de integração: x³ + 2x + C. Conferindo: (x³ + 2x + C)' = 3x² + 2!",
    xp: 30,
    labState: getCalcPreset("u4-antideriv"),
  },
  {
    id: "u4-i2",
    track: "calc_integrals",
    badge: "P3 · Caso Especial n = −1",
    prompt: "Qual é a integral indefinida ∫ (1 / x) dx ?",
    options: [
      "−1 / x² + C",
      "x⁰ / 0 + C",
      "ln|x| + C",
      "e^x + C",
    ],
    correctIndex: 2,
    hint: "A regra x^(n+1)/(n+1) falharia com divisão por zero quando n = −1. Qual função tem derivada 1/x?",
    explanation:
      "Como (ln|x|)' = 1/x para todo x ≠ 0, temos ∫ (1/x) dx = ln|x| + C (o módulo garante validade tanto para x > 0 quanto para x < 0!).",
    xp: 30,
    labState: {
      ...DEFAULT_CALC_LAB_STATE,
      subMode: "graph",
      kind: "rational",
      params: { a: 1, b: 0, c: 0 },
      x0: 1.5,
      showDomainImage: false,
      showRoots: false,
      showAntideriv: true,
      antiderivC: 0,
    },
  },
];
