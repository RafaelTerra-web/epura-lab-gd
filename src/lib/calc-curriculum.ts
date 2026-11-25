import { CALC_PRESETS, CalcLabState, DEFAULT_CALC_LAB_STATE } from "./calc-math";

export interface CalcLessonExample {
  id: string;
  label: string;
  formula: string;
  labState: CalcLabState;
}

export interface CalcLessonChapter {
  id: string;
  number: string;
  tag: string;
  examBadge: "Pré-Cálculo" | "P1" | "P2" | "P3";
  title: string;
  subtitle: string;
  duration: string;
  notebookRef?: string;
  summary: string;
  keyTakeaways: string[];
  formulas: Array<{ label: string; expr: string; note: string }>;
  watchOut: string;
  voiceScript: string;
  examples: CalcLessonExample[];
}

export const CALC_LESSONS: CalcLessonChapter[] = [
  {
    id: "calc-01-reais",
    number: "AULA 01",
    tag: "Pré-Cálculo · Caderno",
    examBadge: "Pré-Cálculo",
    title: "Números Reais (ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ) & Linguagem de Conjuntos",
    subtitle: "O que é um número real, por que o Cálculo I vive em ℝ e a hierarquia completa dos conjuntos",
    duration: "5 min",
    notebookRef: "Anotações da Aula 2 (24/11/2026) · Prof. Mateus Spezia",
    summary:
      "Cálculo I estuda o comportamento de funções reais com valores reais. Para manipular limites e continuidade sem buracos na reta, precisamos dominar a família completa dos conjuntos numéricos: Naturais (ℕ), Inteiros (ℤ), Racionais (ℚ) e Irracionais (𝕀), que juntos formam a reta contínua dos Reais (ℝ).",
    keyTakeaways: [
      "ℕ = {1, 2, 3, 4, 5, ...} (naturais de contagem; alguns autores incluem o 0 como ℕ₀).",
      "ℤ = {..., −3, −2, −1, 0, 1, 2, 3, ...} (inteiros: entram os negativos e o zero).",
      "ℚ = { a/b | a, b ∈ ℤ e b ≠ 0 } (racionais: toda fração de inteiros com denominador diferente de zero!).",
      "𝕀 (Irracionais): números como √2, π e e que NÃO podem virar fração a/b — sem eles a reta teria buracos invisíveis!",
      "ℝ = ℚ ∪ 𝕀 completa todos os pontos da reta real, permitindo limites e derivadas.",
    ],
    formulas: [
      { label: "Hierarquia", expr: "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ", note: "Cada conjunto amplia o anterior" },
      { label: "Racionais (ℚ)", expr: "ℚ = { a/b : a, b ∈ ℤ, b ≠ 0 }", note: "Cuidado: frações são ℚ, não ℤ!" },
      { label: "Reais (ℝ)", expr: "ℝ = ℚ ∪ 𝕀", note: "Reta contínua sem furos" },
    ],
    watchOut:
      "Atenção às anotações do caderno! A definição { a/b, a,b ∈ ℤ, b ≠ 0 } é o conjunto dos RACIONAIS (ℚ), e não dos Inteiros (ℤ). Em ℤ moram apenas os números sem fração (..., −2, −1, 0, 1, 2, ...).",
    voiceScript:
      "Bem-vindo ao Cálculo 1 na UERJ! Antes de derivar ou integrar, precisamos responder: o que é um número real? Começamos nos naturais 1, 2, 3, 4. Adicionamos os negativos e o zero para formar os inteiros Z. Quando dividimos dois inteiros a sobre b, com b diferente de zero, nascem os racionais Q. E preenchendo os espaços infinitos entre frações estão os irracionais como raiz de 2 e pi. Juntos eles formam a reta real contínua R.",
    examples: [
      {
        id: "ex-reais-reta",
        label: "Explorar Reta Real & Conjuntos",
        formula: "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ",
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
    ],
  },
  {
    id: "calc-02-intervalos",
    number: "AULA 02",
    tag: "Pré-Cálculo · Caderno",
    examBadge: "Pré-Cálculo",
    title: "Intervalos de Reta, União/Interseção & Desigualdades",
    subtitle: "Intervalo fechado [a, b], aberto ]a, b[, operações X ∪ Y / X ∩ Y e resolução de inequações",
    duration: "6 min",
    notebookRef: "Anotações da Aula 2 · Intervalos (I), Conjuntos & Desigualdade",
    summary:
      "Em Cálculo, domínios e soluções de inequações quase nunca são pontos isolados — são intervalos contínuos da reta real! Dominar colchetes fechados [a, b] (bolinha fechada ●), abertos ]a, b[ (bolinha aberta ○), união (∪), interseção (∩) e inversão de sinal ao multiplicar inequações por número negativo é obrigatório para a P1.",
    keyTakeaways: [
      "Fechado limitado [a, b] = { x ∈ ℝ / a ≤ x ≤ b } inclui as pontas a e b (bolinha fechada ●).",
      "Aberto ]a, b[ ou (a, b) = { x ∈ ℝ / a < x < b } EXCLUI as pontas a e b (bolinha aberta ○).",
      "União (X ∪ Y): junta tudo que está em X OU em Y (ou nos dois).",
      "Interseção (X ∩ Y): pega SOMENTE a região comum onde X E Y se sobrepõem simultaneamente.",
      "Regra de ouro das Desigualdades: multiplicou ou dividiu por número NEGATIVO? INVERTE o sinal (< vira >, ≤ vira ≥)!",
    ],
    formulas: [
      { label: "Intervalo Fechado", expr: "[a, b] = { x ∈ ℝ : a ≤ x ≤ b }", note: "Inclui a e b (●)" },
      { label: "Intervalo Aberto", expr: "]a, b[ = { x ∈ ℝ : a < x < b }", note: "Exclui a e b (○)" },
      { label: "Interseção", expr: "X ∩ Y = { x : x ∈ X e x ∈ Y }", note: "Usada ao combinar 2 restrições de domínio!" },
    ],
    watchOut:
      "Nunca feche colchete no infinito! É sempre ]−∞, 3] ou [2, +∞[, pois +∞ e −∞ não são números reais. E ao multiplicar −2x > 6 por −1, o sinal vira: 2x < −6 ⇒ x < −3!",
    voiceScript:
      "Intervalos de reta são a língua oficial do Cálculo. O colchete voltado para dentro em a, b fechado significa menor ou igual, bolinha fechada. O colchete aberto ou parêntese exclui as bordas, bolinha aberta. Na interseção X inter Y, pegamos só o que vale nos dois conjuntos ao mesmo tempo — é exatamente isso que fazemos quando uma função tem duas restrições de domínio.",
    examples: [
      {
        id: "ex-intervalos-inter",
        label: "Interseção [−2, 3] ∩ ]0, 4]",
        formula: "X ∩ Y = ]0, 3]",
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
        id: "ex-intervalos-union",
        label: "União [−3, 1[ ∪ [0, 4[",
        formula: "X ∪ Y = [−3, 4[",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "intervals",
          intervalPreset: {
            a1: -3,
            b1: 1,
            closedA1: true,
            closedB1: false,
            a2: 0,
            b2: 4,
            closedA2: true,
            closedB2: false,
            op: "union",
          },
        },
      },
    ],
  },
  {
    id: "calc-03-funcao",
    number: "AULA 03",
    tag: "Pré-Cálculo · Caderno",
    examBadge: "Pré-Cálculo",
    title: "Definição de Função, Domínio Natural, Imagem & Raiz",
    subtitle: "Os 3 requisitos (Domínio, Contradomínio e Regra), Gr_f e as perguntas do seu caderno",
    duration: "7 min",
    notebookRef: "Anotações da Aula 1 · Definição de Função, Domínio Natural & Raiz",
    summary:
      "Uma função real f: A ⊆ ℝ → ℝ exige três ingredientes: Domínio A (de onde sai), Contradomínio B (para onde vai) e uma Regra f(x) que associa CADA elemento de A a EXATAMENTE UM elemento de B. Aqui respondemos às duas perguntas-chave do seu caderno: o que é Domínio Natural e o que é a Raiz de uma função!",
    keyTakeaways: [
      "Requisitos para ser função: TODO x ∈ A precisa disparar flecha (existência) e só pode disparar UMA flecha (unicidade).",
      "Contradomínio (B) é o conjunto de chegada todo; Imagem Im(f) ⊆ B são apenas os valores efetivamente atingidos pelas flechas.",
      "Gráfico: Gr_f = { (x, y) ∈ ℝ² / y = f(x), x ∈ A }. No plano, toda reta vertical corta o gráfico no máximo 1 vez!",
      "DOMÍNIO NATURAL: quando o enunciado dá só a fórmula (ex: √(x+1) ou 1/(x−2)), é o MAIOR subconjunto de ℝ onde a conta faz sentido sem erro matemático (denominador ≠ 0, raiz par ≥ 0, logaritmo > 0).",
      "RAIZ (ou Zero) da função: todo valor x ∈ A que zera a saída, isto é, f(x) = 0. Geometricamente, é onde o gráfico corta o eixo X!",
    ],
    formulas: [
      { label: "Notação", expr: "f: A ⊆ ℝ → ℝ", note: "Domínio A, Contradomínio ℝ" },
      { label: "Gráfico", expr: "Gr_f = { (x, y) ∈ ℝ² : y = f(x), x ∈ A }", note: "Projeção em X = Domínio; em Y = Imagem" },
      { label: "Raiz / Zero", expr: "f(x) = 0", note: "Interseção da curva com o eixo X" },
    ],
    watchOut:
      "Os 3 mandamentos do Domínio Natural em prova: (1) Denominador ≠ 0; (2) Dentro de raiz de índice par ≥ 0; (3) Dentro de logaritmo > 0 (estritamente positivo, zero não entra!).",
    voiceScript:
      "Para existir uma função, precisamos de três coisas: domínio, de onde sai; contradomínio, para onde vai; e a regra. Cada elemento do domínio deve ter exatamente uma saída. E o que é domínio natural? É o maior conjunto de reais que não quebra a fórmula: sem divisão por zero, sem raiz par de negativo e sem logaritmo de número menor ou igual a zero. Já a raiz da função é todo x que faz f de x dar zero, onde a curva cruza o eixo X.",
    examples: [
      {
        id: "ex-flechas-valid",
        label: "Diagrama A → B (É Função?)",
        formula: "f: A → B · Im(f) ⊆ B",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "arrows",
          arrowCaseId: "quadratic",
        },
      },
      {
        id: "ex-dom-natural-sqrt",
        label: "Domínio Natural √(x + 1) − 1",
        formula: "D(f) = [−1, +∞[",
        labState: CALC_PRESETS[0].state,
      },
      {
        id: "ex-raizes-quad",
        label: "Raízes: f(x) = 0.5x² − 2",
        formula: "f(−2) = 0 e f(+2) = 0",
        labState: CALC_PRESETS[1].state,
      },
      {
        id: "ex-dom-natural-ln",
        label: "Domínio Natural ln(x)",
        formula: "D(f) = ]0, +∞[",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "graph",
          kind: "ln",
          params: { a: 1.5, b: 0, c: 0 },
          x0: 1,
          showDomainImage: true,
          showRoots: true,
        },
      },
    ],
  },
  {
    id: "calc-04-elementares",
    number: "AULA 04",
    tag: "Pré-Cálculo · Ementa 1.3",
    examBadge: "P1",
    title: "Funções Elementares, Composta (f ∘ g) & Inversa f⁻¹",
    subtitle: "Afim, quadrática, modular, racional, exponencial, logarítmica, trigonométricas e espelhamento em y = x",
    duration: "7 min",
    notebookRef: "Ementa 1.2 e 1.3 · Stewart Cap. 1 · Guidorizzi Cap. 2",
    summary:
      "Todas as funções que aparecem nas provas de Cálculo I são combinações de poucas funções elementares. Dominar o formato visual de cada uma — além de compor (f ∘ g)(x) = f(g(x)) e inverter f⁻¹(x) trocando x por y — transforma gráficos complexos em leitura instantânea.",
    keyTakeaways: [
      "Função Composta (f ∘ g)(x) = f(g(x)): a saída de g entra como entrada em f (atenção: em geral f ∘ g ≠ g ∘ f!).",
      "Função Inversa f⁻¹ existe quando f é injetora (cada y vem de no máximo um x — Teste da Reta Horizontal!).",
      "Na prática, achamos f⁻¹ trocando x ↔ y e isolando o novo y. O gráfico de f⁻¹ é o espelho exato de f na diagonal y = x!",
      "Par clássico de inversas: exponencial e^x (domínio ℝ, imagem ]0, +∞[) ⇄ logaritmo ln(x) (domínio ]0, +∞[, imagem ℝ).",
    ],
    formulas: [
      { label: "Composta", expr: "(f ∘ g)(x) = f(g(x))", note: "Base da Regra da Cadeia na P2!" },
      { label: "Inversa", expr: "f⁻¹(f(x)) = x", note: "Gráficos simétricos na reta y = x" },
      { label: "Exponencial ⇄ Log", expr: "y = e^x  ⇔  x = ln(y)", note: "Troca domínio pela imagem" },
    ],
    watchOut:
      "f⁻¹(x) NÃO significa 1/f(x)! O expoente −1 na função significa função inversa (desfazer a regra), enquanto (f(x))⁻¹ = 1/f(x) é o inverso multiplicativo.",
    voiceScript:
      "Conhecer o formato das funções elementares dá visão de raio-X no Cálculo. Na composição f bola g de x, você aplica g primeiro e joga o resultado dentro de f. Já a função inversa desfaz o caminho de f: no gráfico, basta refletir a curva em torno da diagonal y igual a x, como acontece entre e elevado a x e ln de x.",
    examples: [
      {
        id: "ex-inversa-exp-ln",
        label: "Espelho e^x ⇄ ln(x)",
        formula: "Simetria em y = x",
        labState: CALC_PRESETS[2].state,
      },
      {
        id: "ex-racional-assintota",
        label: "Racional 2/(x − 1)",
        formula: "Assíntota x = 1",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "graph",
          kind: "rational",
          params: { a: 2, b: 1, c: 0 },
          x0: 2.5,
          showDomainImage: true,
          showRoots: false,
          showInverse: true,
        },
      },
      {
        id: "ex-seno",
        label: "Trigonométrica 2·sen(x)",
        formula: "Im(f) = [−2, +2]",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "graph",
          kind: "trig",
          params: { a: 2, b: 1, c: 0 },
          x0: 1,
          showDomainImage: true,
          showRoots: true,
        },
      },
    ],
  },
  {
    id: "calc-05-limites",
    number: "AULA 05",
    tag: "Unidade 1 · P1",
    examBadge: "P1",
    title: "Limites, Indeterminação 0/0, Continuidade & TVI",
    subtitle: "O que acontece quando x se aproxima de a, limites laterais e Teorema do Valor Intermediário",
    duration: "8 min",
    notebookRef: "Ementa 1.4 e 1.5 · Conteúdo da P1",
    summary:
      "O limite lim_{x→a} f(x) = L olha para onde a altura y caminha quando x chega arbitrariamente perto de a — SEM precisar que f(a) exista! Quando os limites pela esquerda (a⁻) e pela direita (a⁺) coincidem e igualam f(a), a função é contínua em a.",
    keyTakeaways: [
      "lim_{x→a} f(x) = L existe se, e somente se, lim_{x→a⁻} f(x) = lim_{x→a⁺} f(x) = L.",
      "Indeterminação 0/0 NÃO significa 'não existe' — fatore, simplifique ou racionalize para revelar o valor do buraco!",
      "Continuidade em x = a exige 3 itens: (1) f(a) existe; (2) lim_{x→a} f(x) existe; (3) o limite é igual a f(a).",
      "Teorema do Valor Intermediário (TVI): se f é contínua em [a, b] e f(a) e f(b) têm sinais opostos, existe pelo menos uma raiz c ∈ ]a, b[ com f(c) = 0!",
    ],
    formulas: [
      { label: "Indeterminação 0/0", expr: "lim_{x→1} (x²−1)/(x−1) = lim (x+1) = 2", note: "Fatoração elimina o fator (x−1)" },
      { label: "Continuidade", expr: "lim_{x→a} f(x) = f(a)", note: "Sem saltos, buracos ou assíntotas" },
      { label: "TVI (Raiz)", expr: "f(a)·f(b) < 0  ⇒  ∃ c ∈ ]a, b[ : f(c) = 0", note: "Para f contínua em [a, b]" },
    ],
    watchOut:
      "Erro clássico na P1: achar que se f(a) não existe, o limite também não existe. Em (x²−1)/(x−1), f(1) não existe (buraco aberto!), mas o limite quando x → 1 existe e vale 2!",
    voiceScript:
      "O limite pergunta uma coisa só: para onde o gráfico está apontando quando x encosta em a? Ele não liga se existe um buraco bem em cima de a. Se o lado esquerdo e o lado direito chegam na mesma altura L, o limite existe. E se a função for contínua num intervalo fechado e trocar de sinal nas pontas, o Teorema do Valor Intermediário garante uma raiz lá dentro.",
    examples: [
      {
        id: "ex-limite-buraco",
        label: "Buraco 0/0 em x = 1",
        formula: "lim (x²−1)/(x−1) = 2",
        labState: CALC_PRESETS[3].state,
      },
      {
        id: "ex-assintota-infinito",
        label: "Limite Infinito 2/(x − 1)",
        formula: "x → 1⁺ ⇒ +∞ · x → 1⁻ ⇒ −∞",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "graph",
          kind: "rational",
          params: { a: 2, b: 1, c: 0 },
          x0: 1.5,
          showDomainImage: true,
          showRoots: false,
        },
      },
    ],
  },
  {
    id: "calc-06-derivadas",
    number: "AULA 06",
    tag: "Unidade 2 · P2",
    examBadge: "P2",
    title: "Derivadas: Secante → Tangente, Regras & Cadeia",
    subtitle: "Definição formal por limite, interpretação geométrica/física, Regra da Cadeia e Aproximação Linear",
    duration: "8 min",
    notebookRef: "Ementa 2.1 a 2.7 · Conteúdo da P2",
    summary:
      "A derivada f'(x₀) mede a taxa de variação instantânea da função: geometricamente, é a inclinação da reta tangente que nasce quando o passo h da reta secante encolhe até zero. Fisicamente, se s(t) é posição, s'(t) é velocidade e s''(t) é aceleração!",
    keyTakeaways: [
      "Definição: f'(x₀) = lim_{h→0} [f(x₀ + h) − f(x₀)] / h.",
      "Contínua NÃO implica derivável! A função modular |x − b| é contínua em x = b, mas o bico impede tangente única.",
      "Regras essenciais: (x^n)' = n·x^(n−1), Produto (fg)' = f'g + fg', Quociente (f/g)' = (f'g − fg')/g².",
      "Regra da Cadeia: [f(g(x))]' = f'(g(x)) · g'(x) ('deriva de fora mantendo dentro, vezes a derivada de dentro!').",
      "Aproximação Linear perto de a: L(x) = f(a) + f'(a)(x − a) é exatamente a equação da reta tangente!",
    ],
    formulas: [
      { label: "Derivada", expr: "f'(x₀) = lim_{h→0} (f(x₀+h) − f(x₀)) / h", note: "Inclinação da tangente" },
      { label: "Regra da Cadeia", expr: "(f ∘ g)'(x) = f'(g(x)) · g'(x)", note: "Fundamental na P2!" },
      { label: "Reta Tangente", expr: "L(x) = f(x₀) + f'(x₀)(x − x₀)", note: "Aproximação linear local" },
    ],
    watchOut:
      "Na derivada do produto (f·g)', NUNCA faça f'·g'! E na Regra da Cadeia, nunca esqueça de multiplicar pela derivada da função interna g'(x)!",
    voiceScript:
      "A derivada é o coração do Cálculo. Pegue dois pontos na curva separados por h e trace a reta secante. Conforme h vai a zero, a secante gira e encosta num único ponto, virando a reta tangente. A inclinação dessa tangente é f linha de x zero, que na física é a velocidade instantânea.",
    examples: [
      {
        id: "ex-sec-tang",
        label: "Animar Secante → Tangente",
        formula: "f(x) = 0.5x² − 1 · h → 0",
        labState: CALC_PRESETS[4].state,
      },
      {
        id: "ex-bico-abs",
        label: "Bico Não Derivável |x − 1|",
        formula: "f'(1⁻) = −1.2 ≠ f'(1⁺) = +1.2",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "graph",
          kind: "abs",
          params: { a: 1.2, b: 1, c: -1.5 },
          x0: 1,
          h: 1,
          showDomainImage: false,
          showRoots: true,
          showTangent: true,
          showDerivative: true,
        },
      },
    ],
  },
  {
    id: "calc-07-aplicacoes",
    number: "AULA 07",
    tag: "Unidade 3 · P2",
    examBadge: "P2",
    title: "Aplicações das Derivadas: Máx/Mín, TVM, Esboço & L'Hôpital",
    subtitle: "Pontos críticos, crescimento (f'), concavidade/inflexão (f''), otimização e L'Hôpital",
    duration: "8 min",
    notebookRef: "Ementa 3.1 a 3.7 · Conteúdo da P2",
    summary:
      "Com o sinal de f'(x) descobrimos onde a função sobe ou desce e achamos extremos locais (otimização!). Com o sinal de f''(x) enxergamos a concavidade (sorriso pra cima ou pra baixo) e pontos de inflexão. E L'Hôpital destrava limites 0/0 e ∞/∞ derivando numerador e denominador!",
    keyTakeaways: [
      "Ponto Crítico: ponto interno do domínio onde f'(c) = 0 ou f'(c) não existe (candidatos a máximo/mínimo!).",
      "f'(x) > 0 ⇒ f é crescente; f'(x) < 0 ⇒ f é decrescente.",
      "f''(x) > 0 ⇒ concavidade para cima (∪, mínimo local se f'=0); f''(x) < 0 ⇒ concavidade para baixo (∩, máximo local).",
      "Teorema do Valor Médio (TVM): existe c ∈ ]a, b[ onde a tangente é paralela à secante: f'(c) = [f(b)−f(a)]/(b−a).",
      "L'Hôpital: em indeterminações 0/0 ou ∞/∞, lim f(x)/g(x) = lim f'(x)/g'(x) (se o novo limite existir!).",
    ],
    formulas: [
      { label: "TVM", expr: "f'(c) = (f(b) − f(a)) / (b − a)", note: "Rolle é o caso f(a) = f(b) ⇒ f'(c) = 0" },
      { label: "Teste da 2ª Derivada", expr: "f'(c)=0 e f''(c)>0 ⇒ Mínimo local", note: "Se f'' troca de sinal ⇒ Inflexão" },
      { label: "L'Hôpital (0/0, ∞/∞)", expr: "lim f(x)/g(x) = lim f'(x)/g'(x)", note: "Derive em cima e embaixo separadamente!" },
    ],
    watchOut:
      "Cuidado com L'Hôpital: (1) SÓ vale para 0/0 ou ∞/∞ — conferir sempre antes! (2) NÃO use regra do quociente em L'Hôpital; deriva o numerador e o denominador separadamente!",
    voiceScript:
      "A primeira derivada funciona como um radar de inclinação: onde f linha é positiva a função sobe, onde é negativa ela desce, e onde zera aparecem os candidatos a máximo e mínimo. Já a segunda derivada revela a concavidade e o ponto de inflexão. E quando um limite dá zero sobre zero ou infinito sobre infinito, o Teorema de L'Hôpital permite derivar em cima e embaixo separadamente.",
    examples: [
      {
        id: "ex-cubica-extremos",
        label: "Cúbica: Máximo, Mínimo & Inflexão",
        formula: "f(x) = 0.35x³ − 2x com f'(x)",
        labState: CALC_PRESETS[5].state,
      },
      {
        id: "ex-cubica-concavidade",
        label: "Ver Concavidade f''(x)",
        formula: "Inflexão em x = 0",
        labState: {
          ...CALC_PRESETS[5].state,
          showDerivative: true,
          showSecondDeriv: true,
        },
      },
    ],
  },
  {
    id: "calc-08-integrais",
    number: "AULA 08",
    tag: "Unidade 4 · P3",
    examBadge: "P3",
    title: "Integração Indefinida, Primitivas (+C) & Métodos",
    subtitle: "O caminho inverso da derivada, constante C, Substituição u e Integração por Partes",
    duration: "7 min",
    notebookRef: "Ementa 4.1 e 4.2 · Conteúdo da P3",
    summary:
      "Integrar indefinidamente é fazer a engenharia reversa da derivada: encontrar toda família de funções F(x) + C cuja derivada devolve f(x). Como a derivada de qualquer constante C é zero, existem infinitas primitivas paralelas deslocadas verticalmente!",
    keyTakeaways: [
      "Definição: ∫ f(x) dx = F(x) + C  ⇔  F'(x) = f(x). NUNCA esqueça o '+ C' na P3!",
      "Regra da Potência: ∫ x^n dx = x^(n+1)/(n+1) + C  (para n ≠ −1). Quando n = −1, ∫ (1/x) dx = ln|x| + C!",
      "Substituição (u): inverte a Regra da Cadeia! Escolha u = g(x), calcule du = g'(x) dx e reescreva a integral em u.",
      "Por Partes: inverte a Regra do Produto! ∫ u dv = u·v − ∫ v du (dica LIATE: Log, Inversa trig, Algébrica, Trig, Exp).",
    ],
    formulas: [
      { label: "Potência (n ≠ −1)", expr: "∫ x^n dx = x^(n+1)/(n+1) + C", note: "Para n = −1: ln|x| + C" },
      { label: "Substituição", expr: "∫ f(g(x))·g'(x) dx = ∫ f(u) du", note: "u = g(x), du = g'(x) dx" },
      { label: "Por Partes", expr: "∫ u dv = u·v − ∫ v du", note: "Inverso da Regra do Produto" },
    ],
    watchOut:
      "Dois deslizes que mais tiram ponto na P3: esquecer a constante '+ C' no final e esquecer o módulo em ∫ (1/x) dx = ln|x| + C!",
    voiceScript:
      "Integrar indefinidamente é desfazer a derivada. Se a derivada de x ao quadrado sobre 2 mais qualquer constante C devolve x, então a integral indefinida de x é toda essa família de parábolas deslocadas verticalmente por C. Para integrais compostas usamos substituição em u, e para produtos de funções usamos integração por partes.",
    examples: [
      {
        id: "ex-primitiva-linear",
        label: "Família F(x) = 0.5x² + C",
        formula: "∫ x dx = 0.5x² + C",
        labState: CALC_PRESETS[6].state,
      },
      {
        id: "ex-primitiva-trig",
        label: "Primitiva de 2·sen(x)",
        formula: "∫ 2sen(x) dx = −2cos(x) + C",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "graph",
          kind: "trig",
          params: { a: 2, b: 1, c: 0 },
          x0: 1,
          showDomainImage: false,
          showRoots: false,
          showAntideriv: true,
          antiderivC: 0,
        },
      },
    ],
  },
];

export interface SyllabusUnit {
  id: string;
  number: string;
  title: string;
  exam: "P1" | "P2" | "P3";
  topics: Array<{ id: string; code: string; title: string }>;
}

export const CALC_SYLLABUS_UNITS: SyllabusUnit[] = [
  {
    id: "u1",
    number: "1",
    title: "FUNÇÕES, LIMITES E CONTINUIDADE",
    exam: "P1",
    topics: [
      { id: "c1-1", code: "1.1", title: "Conceito de função real de uma variável real" },
      { id: "c1-2", code: "1.2", title: "Domínio, imagem e gráfico de funções" },
      { id: "c1-3", code: "1.3", title: "Operações com funções. Função composta e função inversa" },
      { id: "c1-4", code: "1.4", title: "Limite e Continuidade" },
      { id: "c1-5", code: "1.5", title: "Teorema do Valor Intermediário" },
    ],
  },
  {
    id: "u2",
    number: "2",
    title: "DERIVADAS DAS FUNÇÕES",
    exam: "P2",
    topics: [
      { id: "c2-1", code: "2.1", title: "Derivada em um ponto" },
      { id: "c2-2", code: "2.2", title: "Interpretações geométrica e física da derivada" },
      { id: "c2-3", code: "2.3", title: "Funções deriváveis" },
      { id: "c2-4", code: "2.4", title: "Propriedades operatórias da derivada" },
      { id: "c2-5", code: "2.5", title: "Regra da cadeia" },
      { id: "c2-6", code: "2.6", title: "Derivadas sucessivas" },
      { id: "c2-7", code: "2.7", title: "Aproximação linear e aplicações" },
    ],
  },
  {
    id: "u3",
    number: "3",
    title: "APLICAÇÕES DAS DERIVADAS",
    exam: "P2",
    topics: [
      { id: "c3-1", code: "3.1", title: "Taxas relacionadas" },
      { id: "c3-2", code: "3.2", title: "Máximos e mínimos locais e absolutos" },
      { id: "c3-3", code: "3.3", title: "Pontos críticos. Teorema de Rolle. Teorema do Valor Médio" },
      { id: "c3-4", code: "3.4", title: "Crescimento e decrescimento" },
      { id: "c3-5", code: "3.5", title: "Concavidade e ponto de inflexão. Esboço de gráficos" },
      { id: "c3-6", code: "3.6", title: "Problemas de otimização" },
      { id: "c3-7", code: "3.7", title: "Teorema de L'Hôpital e aplicações" },
    ],
  },
  {
    id: "u4",
    number: "4",
    title: "INTEGRAÇÃO INDEFINIDA",
    exam: "P3",
    topics: [
      { id: "c4-1", code: "4.1", title: "Integrais indefinidas: definição e propriedades" },
      { id: "c4-2", code: "4.2", title: "Métodos de Integração" },
    ],
  },
];

export const CALC_COURSE_INFO = {
  professor: "Prof. Mateus Spezia",
  institution: "UERJ · Cálculo I",
  bibliography: [
    {
      author: "STEWART, James",
      title: "Cálculo, Volume 1",
      note: "Excelente intuição visual, gráficos, aplicações e listas graduadas.",
    },
    {
      author: "GUIDORIZZI, Hamilton Luiz",
      title: "Um Curso de Cálculo, Volume 1",
      note: "Rigor formal clássico brasileiro em conjuntos, limites, teoremas e demonstrações.",
    },
  ],
  exams: [
    { code: "P1", title: "Funções, limites e continuidade", date: "Ao longo do período" },
    { code: "P2", title: "Derivadas e aplicações", date: "Ao longo do período" },
    { code: "P3", title: "Integração indefinida", date: "Ao longo do período" },
    { code: "PR", title: "Prova de Reposição (matéria da prova a repor)", date: "13/04/2027" },
    { code: "PF", title: "Prova Final (tópicos selecionados da matéria)", date: "20/04/2027" },
  ],
  minAttendancePct: 75,
};
