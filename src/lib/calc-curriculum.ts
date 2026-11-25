import { CalcLabState, DEFAULT_CALC_LAB_STATE, getCalcPreset } from "./calc-math";

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
      "𝕀 (Irracionais): números como √2, π e e que NÃO podem virar fração a/b — mas podem ser aproximados por racionais tão perto quanto quisermos!",
      "ℝ = ℚ ∪ 𝕀 completa todos os pontos da reta real. Convenção da aula: Conjuntos com letra MAIÚSCULA (A, B, X, Y) e elementos com minúscula (x, y, p); '⇔' significa 'se e somente se'.",
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
      "Limitados: fechado [a, b] = { x ∈ ℝ / a ≤ x ≤ b } (●), aberto ]a, b[ = { x ∈ ℝ / a < x < b } (○), e semiabertos ]a, b] ou [a, b[.",
      "Ilimitados (aula 24/11): ]−∞, a] = { x ∈ ℝ / x ≤ a } e [a, +∞[ = { x ∈ ℝ / x ≥ a }.",
      "Intervalos como blocos construtores: formamos conjuntos complexos via união A = ⋃ Iᵢ (p ∈ X ou p ∈ Y) e interseção B = ⋂ Iᵢ (p ∈ X e p ∈ Y).",
      "Exemplo 1 do caderno (1º grau): A = { x ∈ ℝ / 2x − 1 ≤ 0 } ⇔ 2x ≤ 1 ⇔ x ≤ 1/2 ⇒ A = ]−∞, 1/2].",
      "Exemplo 2 do caderno (2º grau por fatoração): B = { x ∈ ℝ / x² + x − 2 ≥ 0 }. Fatoramos como (x + 2)(x − 1) ≥ 0; pelo quadro de sinais, produto ≥ 0 fora das raízes: B = ]−∞, −2] ∪ [1, +∞[!",
    ],
    formulas: [
      { label: "Blocos Construtores", expr: "A = ⋃ Iᵢ   ·   B = ⋂ Iᵢ", note: "União (ou) e Interseção (e) de intervalos" },
      { label: "Ex 1 (Caderno)", expr: "2x − 1 ≤ 0  ⇔  x ≤ 1/2", note: "Solução: ]−∞, 1/2]" },
      { label: "Ex 2 (Caderno)", expr: "x² + x − 2 = (x+2)(x−1) ≥ 0", note: "Solução: ]−∞, −2] ∪ [1, +∞[" },
    ],
    watchOut:
      "Nunca feche colchete no infinito (sempre ]−∞, a] ou [a, +∞[). Em inequações de 2º grau como (x+2)(x−1) ≥ 0, NÃO basta exigir ambos ≥ 0! Quando ambos os fatores são negativos (x ≤ −2), menos vezes menos dá MAIS — por isso ]−∞, −2] também entra na solução!",
    voiceScript:
      "Na aula de 24 de novembro vimos que os intervalos são os blocos construtores dos conjuntos na reta real: fechados, abertos, semiabertos e ilimitados como menos infinito até a. Nas desigualdades, vimos dois exemplos-chave: primeiro, 2x menos 1 menor ou igual a zero dá x menor ou igual a meio. Depois, x ao quadrado mais x menos 2 maior ou igual a zero: fatoramos em x mais 2 vezes x menos 1, montamos o quadro de sinais e descobrimos que o produto é positivo antes do menos 2 e depois do 1!",
    examples: [
      {
        id: "ex-desig-quad-caderno",
        label: "Caderno: x² + x − 2 ≥ 0 (Quadro de Sinais)",
        formula: "(x+2)(x−1) ≥ 0 ⇒ ]−∞, −2] ∪ [1, +∞[",
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
        id: "ex-desig-lin-caderno",
        label: "Caderno: 2x − 1 ≤ 0 (1º Grau)",
        formula: "x ≤ 1/2 ⇒ ]−∞, 1/2]",
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
      "Notação oficial do caderno: f: A → B, x ↦ f(x). Domínio denotamos por D_f ('de onde sai'); Contradomínio B ('para onde vai').",
      "Imagem formal: Im_f = { y ∈ B / ∃ x ∈ D_f t.q. f(x) = y } — são apenas os valores de B efetivamente atingidos.",
      "Gráfico: Gr_f = { (x, y) ∈ ℝ² / y = f(x), x ∈ A }. Toda reta vertical corta Gr_f no máximo 1 vez!",
      "DOMÍNIO NATURAL (definição da aula): quando não escrevemos o domínio por simplicidade, D_f ⊆ ℝ é o MAIOR subconjunto de ℝ onde a fórmula de f faz sentido.",
      "Exemplos do caderno: Ex 1) f(x) = √x ⇒ D_f = { x ∈ ℝ | x ≥ 0 } = [0, +∞[;  Ex 2) f(x) = 1/(x−1) ⇒ D_f = { x ∈ ℝ | x ≠ 1 } = ]−∞, 1[ ∪ ]1, +∞[ (denominador não pode zerar!).",
    ],
    formulas: [
      { label: "Imagem (Im_f)", expr: "Im_f = { y ∈ B / ∃ x ∈ D_f t.q. f(x) = y }", note: "Notação exata do caderno" },
      { label: "Ex 1 (Dom. Natural)", expr: "f(x) = √x  ⇒  D_f = [0, +∞[", note: "Raiz quadrada exige x ≥ 0" },
      { label: "Ex 2 (Dom. Natural)", expr: "f(x) = 1/(x−1)  ⇒  D_f = ]−∞, 1[ ∪ ]1, +∞[", note: "x − 1 ≠ 0 ⇒ x ≠ 1" },
    ],
    watchOut:
      "Os 3 mandamentos do Domínio Natural em prova: (1) Denominador ≠ 0 (em 1/(x−1), x = 1 dá 1/0!); (2) Dentro de raiz par ≥ 0 (em √x, x ≥ 0); (3) Dentro de logaritmo > 0 (estritamente positivo!).",
    voiceScript:
      "Uma função é uma regra que relaciona cada elemento x do domínio D f a um único elemento f de x no contradomínio B. A imagem Im f reúne somente os y que possuem algum x correspondente. Quando não especificamos o domínio, usamos o domínio natural: o maior subconjunto dos reais onde a fórmula faz sentido. No caderno vimos dois exemplos clássicos: raiz de x tem domínio de zero fechado a mais infinito, e um sobre x menos um exclui apenas o 1, ficando menos infinito a 1 aberto união 1 aberto a mais infinito.",
    examples: [
      {
        id: "ex-flechas-valid",
        label: "Diagrama A → B (É Função?)",
        formula: "f: A → B · Im_f ⊆ B",
        labState: {
          ...DEFAULT_CALC_LAB_STATE,
          subMode: "arrows",
          arrowCaseId: "quadratic",
        },
      },
      {
        id: "ex-dom-natural-sqrt",
        label: "Caderno Ex 1: f(x) = √x",
        formula: "D_f = [0, +∞[",
        labState: getCalcPreset("caderno-ex1-sqrt"),
      },
      {
        id: "ex-dom-natural-rat",
        label: "Caderno Ex 2: f(x) = 1/(x−1)",
        formula: "D_f = ]−∞, 1[ ∪ ]1, +∞[",
        labState: getCalcPreset("caderno-ex2-rational"),
      },
      {
        id: "ex-dom-natural-ln",
        label: "Domínio Natural ln(x)",
        formula: "D_f = ]0, +∞[",
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
    title: "Funções Elementares (Constante, Afim...), Composta & Inversa",
    subtitle: "0) Constante, 1) Afim (tg α = Δy/Δx = a e prova de Im_f = ℝ), Quadrática, Composta (f ∘ g) e Inversa f⁻¹",
    duration: "7 min",
    notebookRef: "Anotações do Caderno (Funções Elementares 0 e 1) · Ementa 1.2–1.3",
    summary:
      "Começamos a lista oficial das Funções Elementares do seu caderno: 0) Função Constante f(x) = c (reta horizontal, Im_f = {c}) e 1) Função Afim f(x) = ax + b com a ≠ 0 (reta inclinada com tg α = Δy/Δx = a, raiz x = −b/a e demonstração formal de Im_f = ℝ), avançando até composta (f ∘ g) e inversa f⁻¹.",
    keyTakeaways: [
      "0) Função Constante: f: ℝ → ℝ, f(x) = c (c ∈ ℝ). Domínio D_f = ℝ e Imagem unitária Im_f = { c } (reta horizontal).",
      "1) Função Afim: f: ℝ → ℝ, f(x) = ax + b com a, b ∈ ℝ e a ≠ 0. Gráfico é uma reta; raiz (y = 0) é x = −b/a.",
      "Inclinação na Afim: tg α = Δy / Δx = a! Se a > 0 a reta sobe (crescente); se a < 0 a reta desce (decrescente).",
      "Prova da Imagem na Afim (caderno!): dado qualquer y ∈ ℝ, escolhemos x = (y − b)/a (existe pois a ≠ 0) ⇒ f((y−b)/a) = y, provando Im_f = ℝ!",
      "Composta (f ∘ g)(x) = f(g(x)) e Inversa f⁻¹(x): gráficos de f e f⁻¹ (como e^x e ln x) são espelhos exatos na reta y = x!",
    ],
    formulas: [
      { label: "0) Constante", expr: "f(x) = c  ⇒  D_f = ℝ,  Im_f = { c }", note: "Reta horizontal na altura c" },
      { label: "1) Afim (Inclinação)", expr: "tg α = Δy/Δx = a   ·   Raiz: x = −b/a", note: "a > 0 sobe · a < 0 desce" },
      { label: "Prova Im_f = ℝ", expr: "x = (y − b)/a  ⇒  f((y − b)/a) = y", note: "Válido porque a ≠ 0!" },
    ],
    watchOut:
      "Por que exigimos a ≠ 0 na Função Afim? Porque se a = 0 ela vira Constante (Im_f = {b} ≠ ℝ), e não poderíamos dividir por a em x = (y − b)/a nem na raiz x = −b/a! E atenção: f⁻¹(x) é inversa, NÃO 1/f(x).",
    voiceScript:
      "Nas funções elementares do seu caderno, o item zero é a função constante f de x igual a c, uma reta horizontal com domínio real e imagem unitária c. O item um é a função afim f de x igual a ax mais b, com a diferente de zero. A constante a mede a inclinação pela tangente de alfa igual a delta y sobre delta x: positiva sobe, negativa desce. A raiz é menos b sobre a, e como podemos isolar x igual a y menos b sobre a, provamos que a imagem é toda a reta real.",
    examples: [
      {
        id: "ex-caderno-afim",
        label: "Caderno: Afim (tg α = Δy/Δx = a)",
        formula: "f(x) = ax + b · Raiz −b/a · Im_f = ℝ",
        labState: getCalcPreset("caderno-afim"),
      },
      {
        id: "ex-caderno-constante",
        label: "Caderno: 0) Constante f(x) = 2",
        formula: "D_f = ℝ · Im_f = { 2 }",
        labState: getCalcPreset("caderno-constante"),
      },
      {
        id: "ex-inversa-exp-ln",
        label: "Espelho e^x ⇄ ln(x)",
        formula: "Simetria em y = x",
        labState: getCalcPreset("precalc-inverse"),
      },
      {
        id: "ex-seno",
        label: "Trigonométrica 2·sen(x)",
        formula: "Im_f = [−2, +2]",
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
        labState: getCalcPreset("u1-limit-hole"),
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
        labState: getCalcPreset("u2-secant-tangent"),
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
        labState: getCalcPreset("u3-extrema-inflection"),
      },
      {
        id: "ex-cubica-concavidade",
        label: "Ver Concavidade f''(x)",
        formula: "Inflexão em x = 0",
        labState: {
          ...getCalcPreset("u3-extrema-inflection"),
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
        labState: getCalcPreset("u4-antideriv"),
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
