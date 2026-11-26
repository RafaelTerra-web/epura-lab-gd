/**
 * Resolução da Lista de Cálculo 1 (Stewart 8ª ed. §§ 1.1–1.2 · Q01 a Q18)
 * Studio Audio Builder (Gemini 3.8 Flash TTS · Voz Masculina "Charon" -> MP3 64kbps mono)
 *
 * Gera cada cena em PCM 24kHz mono, mede o tempo exato em milissegundos, costura com pausas
 * de 0.45s, comprime em MP3 limpo via PyAV/libmp3lame e salva public/audio/calc-list/timings.json
 * após CADA episódio (100% retomável!).
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PYTHON_EXE = "C:\\Users\\rpta\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";

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
  /* ===================== Q01 ===================== */
  {
    id: "list-q01",
    scenes: [
      {
        id: "items-ab",
        label: "(a) √45  e  (b) √18 / √2",
        subtitle: "(a) √45 = √(9·5) = 3√5 é IRRACIONAL. (b) √18/√2 = √(18/2) = √9 = 3 é RACIONAL!",
        script:
          "Fala pessoal! Vamos abrir a nossa maratona de resolução super detalhada da Lista de Cálculo Um, do livro do James Stewart, seções um ponto um e um ponto dois! Na Questão Um, o enunciado pede para classificarmos quatro números como racionais ou irracionais, simplificando antes quando possível. Lembre da regra central: um número é racional se puder ser escrito como fração de dois inteiros p sobre q, com q diferente de zero; se não puder, é irracional! Olha o item A: raiz quadrada de quarenta e cinco. Nunca olhe uma raiz e chute sem fatorar! Fatorando quarenta e cinco, temos nove vezes cinco. Como a raiz quadrada de nove vale exatamente três, raiz de quarenta e cinco simplifica para três raiz de cinco. O cinco não é quadrado perfeito, logo raiz de cinco é irracional. Multiplicar um irracional por um racional diferente de zero, o três, continua dando um número IRRACIONAL! Agora olha a pegadinha boa do item B: raiz de dezoito dividido por raiz de dois. Muita gente vê duas raízes feias e acha que é irracional! Mas pela propriedade das raízes positivas, podemos juntar tudo num único radical: raiz de dezoito dividido por dois, que dá raiz de nove, e raiz de nove é exatamente três! Três é três sobre um, portanto o item B é RACIONAL!",
      },
      {
        id: "items-cd",
        label: "(c) 0,2727...  e  (d) (√2+1)(√2−1)",
        subtitle: "(c) 100x − x = 27 ⇒ x = 27/99 = 3/11 (Racional). (d) Diferença de quadrados: (√2)² − 1² = 1 (Racional).",
        script:
          "Vamos para o item C: zero vírgula vinte e sete com a barrinha em cima do vinte e sete, ou seja, a dízima periódica zero vírgula vinte e sete, vinte e sete, vinte e sete infinitamente! Toda dízima periódica é RACIONAL, e vamos provar achando a fração geratriz exata! Chame o número de x: x igual a zero vírgula vinte e sete, vinte e sete... Como o bloco que se repete tem dois algarismos, multiplicamos os dois lados por cem: cem x igual a vinte e sete vírgula vinte e sete, vinte e sete... Agora subtraímos a primeira equação da segunda! A parte decimal infinita desaparece completamente: cem x menos um x dá noventa e nove x, igual a vinte e sete! Logo x vale vinte e sete sobre noventa e nove. Dividindo em cima e embaixo por nove, chegamos à fração irredutível três sobre onze! Provadíssimo: é RACIONAL! E no item D temos o produto raiz de dois mais um, vezes raiz de dois menos um. Reconheça imediatamente o produto notável da diferença de quadrados: a mais b vezes a menos b é igual a a ao quadrado menos b ao quadrado! Aqui fica raiz de dois ao quadrado menos um ao quadrado, ou seja, dois menos um, que dá exatamente UM! As raízes se anularam por completo, então o item D também é RACIONAL!",
      },
      {
        id: "diag-setup",
        label: "Diagonal do Quadrado (d = √2) · Hipótese",
        subtitle: "Por Pitágoras: d² = 1² + 1² = 2 ⇒ d = √2. Suponha por absurdo que √2 = p/q irredutível (mdc(p,q)=1).",
        script:
          "Agora vem a segunda parte da Questão Um, uma das demonstrações mais clássicas e bonitas de toda a história da matemática: explique por que a diagonal de um quadrado de lado um tem medida irracional! Primeiro, qual é o tamanho dessa diagonal? Olha o quadrado desenhado na tela: os lados medem um e um, formando noventa graus. Pelo Teorema de Pitágoras no triângulo retângulo, a diagonal d ao quadrado vale um ao quadrado mais um ao quadrado, que é dois. Como d é um comprimento positivo, d é exatamente raiz quadrada de dois! Agora, como provamos que raiz de dois NÃO pode ser escrito como fração? Usamos a famosa demonstração por redução ao absurdo! A estratégia é supor o contrário do que queremos provar e chegar a uma contradição impossível. Então suponha, por absurdo, que raiz de dois seja racional. Isso significa que existem inteiros p e q, com q diferente de zero, tais que raiz de dois igual a p sobre q. E aqui vai o detalhe de ouro que faz a prova funcionar: podemos simplificar essa fração até ela ficar IRREDUTÍVEL, ou seja, p e q não têm nenhum fator comum maior que um — em particular, eles NÃO podem ser ambos pares ao mesmo tempo!",
      },
      {
        id: "diag-proof",
        label: "Contradição: p e q ambos pares ⇒ √2 ∈ 𝕀",
        subtitle: "p² = 2q² ⇒ p é par (p = 2k) ⇒ 4k² = 2q² ⇒ q² = 2k² ⇒ q também é par! Contradição com fração irredutível!",
        script:
          "Com essa hipótese armada, acompanhe cada passo algébrico na tela com calma! Partindo de raiz de dois igual a p sobre q, elevamos ambos os lados ao quadrado: dois é igual a p ao quadrado sobre q ao quadrado. Multiplicando por q ao quadrado, obtemos p ao quadrado igual a dois vezes q ao quadrado. Olhe para essa igualdade: p ao quadrado é o dobro de um número inteiro, portanto p ao quadrado é PAR! Agora usamos exatamente o fato autorizado pelo enunciado: se o quadrado de um inteiro é par, então esse inteiro é par! Logo, p é par! Se p é par, podemos escrevê-lo como p igual a dois k, para algum inteiro k. Substituindo p por dois k na nossa equação p ao quadrado igual a dois q ao quadrado, obtemos dois k entre parênteses ao quadrado igual a dois q ao quadrado, isto é, quatro k ao quadrado igual a dois q ao quadrado. Dividindo ambos os lados por dois, chegamos em q ao quadrado igual a dois k ao quadrado! Opa! Isso significa que q ao quadrado também é PAR, e usando o mesmo fato novamente, concluímos que q também é PAR! Aí explode a contradição: descobrimos que tanto p quanto q são pares, logo a fração p sobre q ainda poderia ser simplificada por dois, contradizendo o fato de termos escolhido a fração irredutível! Portanto nossa suposição era falsa, e a diagonal raiz de dois é, com certeza absoluta, IRRACIONAL!",
      },
    ],
  },

  /* ===================== Q02 ===================== */
  {
    id: "list-q02",
    scenes: [
      {
        id: "inter-union",
        label: "(a) A ∩ B = (1, 3)  e  (b) A ∪ B = [−2, 5]",
        subtitle: "A = [−2, 3) e B = (1, 5]. Na interseção entram só os comuns: (1, 3). Na união junta tudo: [−2, 5].",
        script:
          "Na Questão Dois, temos dois intervalos semiabertos na reta real: A igual a fechado em menos dois até três aberto, e B igual a aberto em um até cinco fechado. A melhor prática em prova de Cálculo é sempre desenhar os dois intervalos empilhados um em cima do outro, alinhando bem os números menos dois, um, três e cinco na vertical! Vamos ao item A: a interseção A inter B. Interseção significa pertencer a A E a B ao mesmo tempo! Olhando onde as duas barras se sobrepõem, vemos a faixa entre um e três. Mas atenção máxima nos extremos: o número um pertence a A, porém está com bolinha aberta em B, logo um NÃO entra na interseção! O número três pertence a B, porém está com bolinha aberta em A, logo três também NÃO entra! Assim, A inter B é o intervalo totalmente aberto de um até três! Agora o item B: a união A união B. União significa pertencer a A OU a B, juntando toda a cobertura! Como os dois intervalos se encavalavam entre um e três, eles formam um único bloco contínuo indo lá de menos dois fechado, porque pertence a A, até cinco fechado, porque pertence a B! Logo A união B é o intervalo fechado de menos dois até cinco!",
      },
      {
        id: "complement",
        label: "(c) Complementar ℝ \\ A = (−∞, −2) ∪ [3, +∞)",
        subtitle: "Atenção aos extremos! −2 estava EM A (●), logo SAI do complemento (○). 3 estava FORA de A (○), logo ENTRA (●)!",
        script:
          "Vamos agora ao item C: R menos A, que é o conjunto complementar de A na reta real, formado por todos os números reais que NÃO estão dentro de A! Aqui mora a pegadinha que mais derruba alunos na primeira prova: a inversão das bolinhas nos extremos! Olha para A igual a fechado em menos dois até três aberto. Tudo que está à esquerda de menos dois está fora de A. E o próprio menos dois? Como menos dois tem bolinha fechada em A, ele ESTÁ dentro de A; portanto, ele tem que ficar FORA do complementar, virando bolinha aberta em menos dois! Agora olha para o outro lado, à direita de três: todos os números maiores que três estão fora de A. E o próprio número três? Em A o três tinha bolinha aberta, ou seja, ele NÃO pertencia a A! Se ele não estava em A, então ele obrigatoriamente ENTRA no complementar R menos A, virando bolinha fechada! Conclusão cristalina: R menos A é a união de menos infinito até menos dois aberto, unido com três fechado até mais infinito! Sempre confira extremo por extremo perguntando: estava dentro ou estava fora?",
      },
      {
        id: "no-min",
        label: "Por que (1, 3) NÃO tem menor elemento?",
        subtitle: "Para qualquer m ∈ (1, 3), o ponto médio (1 + m)/2 está entre 1 e m — sempre existe alguém ainda menor em (1, 3)!",
        script:
          "A segunda parte da Questão Dois traz uma pergunta conceitual lindíssima que prepara o terreno para limites: o conjunto A inter B, que encontramos como o intervalo aberto de um até três, possui menor elemento? Possui maior elemento? Justifique! Muita gente cai na tentação de dizer que o menor elemento é um vírgula zero zero zero um. Cuidado! Entre um e um vírgula zero zero zero um existem infinitos números reais ainda menores! A resposta correta é: NÃO possui menor elemento! E como justificamos isso com rigor digno de nota dez na UERJ? Suponha, por absurdo, que existisse um menor elemento m dentro do intervalo aberto um, três. Como m pertence ao intervalo aberto, sabemos que um é estritamente menor que m, e m é menor que três. Agora fabrique o ponto médio entre um e m: chame de x igual a um mais m dividido por dois! Como a média aritmética de dois números diferentes fica estritamente entre eles, temos um menor que x, menor que m, menor que três! Olha o que aconteceu: esse novo número x também pertence ao intervalo aberto um, três, mas é estritamente menor que m! Logo m não podia ser o menor elemento!",
      },
      {
        id: "no-max",
        label: "Por que (1, 3) NÃO tem maior elemento?",
        subtitle: "Analogamente, para qualquer M ∈ (1, 3), (M + 3)/2 ∈ (1, 3) é ainda maior que M! 1 e 3 são fronteiras fora do conjunto.",
        script:
          "E pelo mesmíssimo raciocínio simétrico, o intervalo aberto um, três também NÃO possui maior elemento! Suponha que alguém afirmasse ter encontrado o maior elemento M dentro de um, três. Como o extremo três é aberto, M é estritamente menor que três. Basta pegar o ponto médio entre M e três, ou seja, M mais três dividido por dois! Esse novo valor continua estritamente menor que três e maior que um, logo pertence ao conjunto A inter B, e supera o suposto maior elemento M! Isso mostra uma diferença gigantesca entre intervalo fechado e aberto: no intervalo fechado um, três, um é o menor elemento e três é o maior elemento porque pertencem ao conjunto; já no aberto um, três, um e três são apenas fronteiras externas — o que em análise chamamos de ínfimo e supremo — que você consegue chegar infinitamente perto sem nunca encostar dentro do conjunto!",
      },
    ],
  },

  /* ===================== Q03 ===================== */
  {
    id: "list-q03",
    scenes: [
      {
        id: "item-a",
        label: "(a) (x − 1)(x + 3) ≤ 0 · Quadro de Sinais",
        subtitle: "Raízes −3 e 1. Produto fica negativo entre as raízes; como é ≤ 0, extremos fechados: S = [−3, 1]!",
        script:
          "Chegamos à Questão Três: resolver três desigualdades e representar cada solução na reta real! Vamos começar pelo item A: x menos um vezes x mais três menor ou igual a zero. Como a expressão já veio fatorada em dois fatores do primeiro grau, o método mais seguro e à prova de erros é o Quadro de Sinais! Primeiro achamos onde cada fator zera: x mais três zera em x igual a menos três, e x menos um zera em x igual a um. Esses dois pontos dividem a reta real em três intervalos: antes de menos três, entre menos três e um, e depois de um. Agora analisamos o sinal de cada fator: x mais três é negativo antes de menos três e positivo depois; x menos um é negativo antes de um e positivo depois. Fazendo a regra de sinais do produto coluna por coluna: para x menor que menos três, menos vezes menos dá MAIS; entre menos três e um, mais vezes menos dá MENOS; para x maior que um, mais vezes mais dá MAIS! Como o enunciado pede menor OU IGUAL a zero, queremos a região negativa junto com as raízes onde o produto zera! Logo a solução é o intervalo fechado de menos três até um!",
      },
      {
        id: "item-b-signs",
        label: "(b) (x − 1)/(x + 2) > 0 · Quociente",
        subtitle: "Numerador zera em 1; denominador proíbe −2 (○). Quociente > 0 onde sinais coincidem: (−∞, −2) ∪ (1, +∞)!",
        script:
          "Agora olha o item B: x menos um dividido por x mais dois estritamente maior que zero! Atenção total: na divisão, a regra de sinais é idêntica à da multiplicação — mais dividido por mais dá mais, menos dividido por menos também dá mais —, MAS o denominador NUNCA pode zerar! Então marcamos os dois pontos críticos na reta: o denominador x mais dois zera em menos dois, que fica proibido com bolinha aberta; o numerador x menos um zera em um, que também fica aberto porque a desigualdade é estritamente maior que zero! Vamos ao quadro de sinais: para x menor que menos dois, numerador negativo e denominador negativo, então menos dividido por menos dá POSITIVO! Entre menos dois e um, numerador negativo e denominador positivo, logo dá NEGATIVO! Para x maior que um, ambos são positivos, logo dá POSITIVO! Como queremos a fração maior que zero, juntamos as duas pontas externas: solução igual a menos infinito até menos dois aberto, união um aberto até mais infinito!",
      },
      {
        id: "item-b-trap",
        label: "⚡ Por que NÃO multiplicar direto por (x + 2)?",
        subtitle: "Não sabemos o sinal de x + 2! Se x < −2, x + 2 é NEGATIVO e inverte > para <. Multiplicar sem casos apaga (−∞, −2)!",
        script:
          "Agora responda com precisão à pergunta bônus do item B: qual é o cuidado necessário ao multiplicar a desigualdade por x mais dois? Esse é talvez o erro mais famoso do começo de Cálculo Um! Se o aluno trata a inequação como se fosse uma equação e passa o x mais dois multiplicando o zero do outro lado, ele escreve apenas x menos um maior que zero, achando x maior que um — e PERDE METADE DA RESPOSTA, apagando todo o intervalo menos infinito até menos dois! Por que isso acontece? Porque x mais dois depende de x e pode ser POSITIVO ou NEGATIVO! Quando multiplicamos uma desigualdade por um número positivo, o sinal maior que se mantém; mas quando multiplicamos por um número negativo, o sinal obrigatoriamente INVERTE para menor que! Se você quisesse multiplicar por x mais dois, teria que abrir dois casos separados: Caso Um, supondo x mais dois maior que zero, isto é x maior que menos dois, mantém o sinal e dá x maior que um; Caso Dois, supondo x mais dois menor que zero, isto é x menor que menos dois, inverte o sinal para x menos um menor que zero, dando x menor que um — cuja interseção com x menor que menos dois devolve exatamente x menor que menos dois! Muito mais rápido e seguro fazer pelo quadro de sinais sem nunca sumir com o denominador!",
      },
      {
        id: "item-c",
        label: "(c) x² < 4 ⇔ (x − 2)(x + 2) < 0",
        subtitle: "Traga o 4 para a esquerda: x² − 4 < 0 ⇔ (x − 2)(x + 2) < 0 ⇔ |x| < 2 ⇒ S = (−2, 2)!",
        script:
          "Fechando a Questão Três com o item C: x ao quadrado menor que quatro! Cuidado com o reflexo perigoso de tirar raiz quadrada dos dois lados e escrever x menor que mais ou menos dois — isso não faz sentido em desigualdade! O jeito elegante e infalível é trazer o quatro para a esquerda: x ao quadrado menos quatro menor que zero. Fatorando pela diferença de quadrados: x menos dois vezes x mais dois menor que zero! Olha na parábola ou no quadro de sinais: as raízes são menos dois e mais dois, a concavidade é para cima, então x ao quadrado menos quatro é negativo exatamente ENTRE as raízes! De outra forma equivalente, tirar raiz dos dois lados dá módulo de x menor que dois, ou seja, distância de x até a origem menor que dois, que significa menos dois menor que x menor que dois! Na reta real, solução é o intervalo aberto de menos dois até dois!",
      },
    ],
  },

  /* ===================== Q04 ===================== */
  {
    id: "list-q04",
    scenes: [
      {
        id: "items-ab",
        label: "(a) √(5 − 2x)  e  (b) 1 / (x² − 4)",
        subtitle: "(a) 5 − 2x ≥ 0 ⇒ x ≤ 5/2 ⇒ (−∞, 5/2]. (b) x² ≠ 4 ⇒ x ≠ ±2 ⇒ (−∞, −2) ∪ (−2, 2) ∪ (2, +∞).",
        script:
          "Na Questão Quatro vamos treinar os cinco casos clássicos de Domínio Natural em funções reais! Lembre sempre das duas proibições absolutas nos reais para raízes e frações: primeiro, o denominador nunca pode ser zero; segundo, o que está dentro de uma raiz de índice par precisa ser maior ou igual a zero! Vamos ao item A: f de x igual a raiz quadrada de cinco menos dois x. Não há denominador, apenas raiz quadrada, então impomos cinco menos dois x maior ou igual a zero. Passando o cinco para o outro lado, menos dois x maior ou igual a menos cinco. Atenção agora! Ao dividir os dois lados por menos dois, que é NEGATIVO, o sinal da desigualdade INVERTE: x menor ou igual a cinco meios! Logo o domínio de f é de menos infinito até cinco meios fechado! No item B temos g de x igual a um sobre x ao quadrado menos quatro. Não há raiz, apenas denominador, então exigimos x ao quadrado menos quatro diferente de zero. Fatorando, x menos dois vezes x mais dois diferente de zero, o que exclui exatamente DOIS números: menos dois e mais dois! Escrito como união de intervalos, a reta inteira cortada nesses dois furos fica: menos infinito até menos dois aberto, união menos dois até dois aberto, união dois aberto até mais infinito!",
      },
      {
        id: "item-c",
        label: "(c) h(x) = √(x + 1) / (x − 2) · Dupla Restrição",
        subtitle: "Interseção de x + 1 ≥ 0 (x ≥ −1) COM x − 2 ≠ 0 (x ≠ 2) ⇒ D_h = [−1, 2) ∪ (2, +∞)!",
        script:
          "No item C a coisa fica ainda mais interessante porque temos DUAS restrições ao mesmo tempo: h de x igual a raiz quadrada de x mais um, dividida por x menos dois! Para h de x existir, o numerador E o denominador precisam funcionar simultaneamente — então faremos a INTERSEÇÃO das condições! Primeira condição, lá no numerador: dentro da raiz quadrada temos x mais um, que precisa ser maior ou igual a zero, logo x maior ou igual a menos um, isto é, o intervalo fechado em menos um até mais infinito. Segunda condição, lá no denominador: x menos dois não pode ser zero, logo x diferente de dois! Agora pegue a semirreta que começa fechada em menos um e arranque fora o pontinho dois que está no meio do caminho! Isso parte o intervalo em dois pedaços: de menos um fechado até dois aberto, união de dois aberto até mais infinito! Note que menos um entra fechado porque em x igual a menos um dá raiz de zero sobre menos três, que vale zero sem nenhum problema!",
      },
      {
        id: "item-d",
        label: "(d) p(x) = √((x − 1)/(x + 2)) · Raiz do Quociente",
        subtitle: "Quociente ≥ 0! Reaproveitamos Q03(b): x = 1 ENTRA fechado (√0 = 0), mas x = −2 segue ABERTO (denom. 0): (−∞, −2) ∪ [1, +∞)!",
        script:
          "Olhe com muito carinho para o item D: p de x igual à raiz quadrada da fração INTEIRA x menos um sobre x mais dois! Muita gente confunde esse item com o item C e tenta exigir numerador positivo e denominador positivo separadamente — ERRO GRAVE! Quando a fração inteira está dentro de uma única raiz, se o numerador e o denominador forem AMBOS negativos, menos dividido por menos dá POSITIVO, e a raiz existe perfeitamente! Portanto, a condição correta é: a fração x menos um sobre x mais dois maior OU IGUAL a zero, E o denominador x mais dois diferente de zero! Olha que presente: nós já montamos o quadro de sinais dessa exata fração lá na Questão Três, item B! Lá descobrimos que ela é estritamente positiva em menos infinito até menos dois aberto, união um aberto até mais infinito. A única diferença aqui é o 'ou igual a zero'! Quando a fração vale zero? Quando o numerador zera, em x igual a um — e raiz de zero existe e vale zero, logo o um agora ENTRA FECHADO! Já o menos dois continua proibido e ABERTO porque zera o denominador! Resultado final: domínio de p igual a menos infinito até menos dois aberto, união um fechado até mais infinito!",
      },
      {
        id: "item-e",
        label: "(e) q(x) = 1 / √(9 − x²) · Raiz no Denominador!",
        subtitle: "Raiz no denominador exige ESTRITAMENTE positivo: 9 − x² > 0 ⇔ x² < 9 ⇔ −3 < x < 3 ⇒ D_q = (−3, 3)!",
        script:
          "E fechamos a Questão Quatro com o campeão de pegadinhas: item E, q de x igual a um dividido por raiz quadrada de nove menos x ao quadrado! Como a raiz quadrada está no DENOMINADOR, juntamos as duas regras num golpe só: por estar na raiz, nove menos x ao quadrado deveria ser maior ou igual a zero; mas por estar no denominador, a raiz não pode dar zero! Logo, a restrição fica ESTRITAMENTE POSITIVA: nove menos x ao quadrado estritamente maior que zero! Fatorando como diferença de quadrados: três menos x vezes três mais x maior que zero — ou passando x ao quadrado para lá, x ao quadrado menor que nove! Onde a parábola nove menos x ao quadrado, que tem concavidade para baixo e raízes menos três e três, fica acima do eixo x? Exatamente entre menos três e mais três! E como o zero está proibido no denominador, os extremos menos três e três ficam ABERTOS! Domínio de q igual ao intervalo aberto de menos três até três!",
      },
    ],
  },

  /* ===================== Q05 ===================== */
  {
    id: "list-q05",
    scenes: [
      {
        id: "evals",
        label: "(a) Calculando f(−1), f(0) e f(2)",
        subtitle: "Substituindo com parênteses de proteção: f(−1) = 1 + 3 + 2 = 6; f(0) = 2; f(2) = 4 − 6 + 2 = 0!",
        script:
          "Na Questão Cinco, trabalhamos com a função quadrática f de x igual a x ao quadrado menos três x mais dois. No item A, primeiro calculamos três imagens diretas — e aqui vai uma dica simples que evita noventa por cento dos erros de sinal em prova: sempre que substituir um número negativo, coloque parênteses em volta dele! Para f de menos um: menos um entre parênteses ao quadrado, menos três vezes menos um, mais dois. Menos um ao quadrado dá mais um; menos três vezes menos um dá mais três; somando mais dois, chegamos a um mais três mais dois, igual a SEIS! Para f de zero: zero ao quadrado menos três vezes zero mais dois, dá diretamente DOIS — esse é o ponto onde a parábola corta o eixo vertical y! E para f de dois: dois ao quadrado dá quatro, menos três vezes dois que é seis, mais dois: quatro menos seis mais dois dá exatamente ZERO! Isso já revela que x igual a dois é uma raiz da função!",
      },
      {
        id: "solve-eq",
        label: "(a) Resolvendo f(x) = 2",
        subtitle: "x² − 3x + 2 = 2 ⇒ cancela o 2: x² − 3x = 0 ⇒ coloca x em evidência: x(x − 3) = 0 ⇒ x = 0 ou x = 3!",
        script:
          "Ainda no item A, o enunciado pede para resolver a equação f de x igual a dois. Não confunda calcular f de dois com resolver f de x igual a dois! Em f de dois você joga dois na entrada x; já em f de x igual a dois você procura quais entradas x produzem saída igual a dois! Montamos a equação: x ao quadrado menos três x mais dois igual a dois. Subtraindo dois dos dois lados, o termo constante some lindamente, sobrando x ao quadrado menos três x igual a zero! Não precisa nem fazer fórmula de Bhaskara — coloque x em evidência: x vezes x menos três igual a zero! Um produto de dois números só dá zero se um deles for zero: ou x igual a zero, ou x menos três igual a zero, o que dá x igual a três! Conferindo no gráfico da parábola: a reta horizontal y igual a dois corta a curva exatamente em zero, dois e em três, dois! Conjunto solução: zero e três!",
      },
      {
        id: "expand-fxh",
        label: "(b) Expandindo f(x + h) sem Errar!",
        subtitle: "Troque CADA x por (x + h): (x+h)² − 3(x+h) + 2 = x² + 2xh + h² − 3x − 3h + 2 (nunca esqueça do 2xh!).",
        script:
          "Agora atenção redobrada no item B, porque essa conta é a própria semente da definição de Derivada que vai cair na P2! Queremos simplificar o quociente de diferenças f de x mais h, menos f de x, tudo dividido por h, para h diferente de zero, explicitando todo o desenvolvimento de f de x mais h. Pense na função f como um molde com caixinhas vazias no lugar do x: caixinha ao quadrado menos três vezes caixinha mais dois. Para calcular f de x mais h, colocamos x mais h entre parênteses dentro de CADA caixinha! Fica x mais h ao quadrado, menos três vezes x mais h, mais dois. Agora cuidado com os dois deslizes mais comuns da faculdade: primeiro, x mais h ao quadrado NÃO é x ao quadrado mais h ao quadrado — existe o termo do meio, dois x h! Então fica x ao quadrado mais dois x h mais h ao quadrado. Segundo, distribua o sinal de menos três nos dois termos do parêntese: menos três x e menos três h! Juntando com o mais dois do final, o desenvolvimento completo de f de x mais h é: x ao quadrado mais dois x h mais h ao quadrado menos três x menos três h mais dois!",
      },
      {
        id: "quotient",
        label: "(b) Cancelamento Mágico & Spoiler da Derivada!",
        subtitle: "Subtraindo f(x) sobram só termos com h: h(2x + h − 3)/h = 2x + h − 3! Quando h → 0, nasce f'(x) = 2x − 3!",
        script:
          "Agora montamos o numerador f de x mais h menos f de x — usando parênteses em volta de f de x para inverter todos os sinais corretamente! Fica x ao quadrado mais dois x h mais h ao quadrado menos três x menos três h mais dois, menos x ao quadrado, mais três x, menos dois! Olha o teste de ouro que garante que sua conta está certa em qualquer polinômio: TODOS os termos que não têm h têm que se cancelar! E olha lá: x ao quadrado cancela com menos x ao quadrado; menos três x cancela com mais três x; mais dois cancela com menos dois! Sobra apenas dois x h mais h ao quadrado menos três h! Como todos os termos restantes contêm h, colocamos h em evidência: h vezes dois x mais h menos três, tudo dividido por h! Como o enunciado garantiu h diferente de zero, podemos cancelar o h de cima com o h de baixo! Resultado final simplificado: dois x mais h menos três! E fica o spoiler incrível do Cálculo Um: na Unidade Dois, quando fizermos h tender a zero nesse resultado, o h some e nasce exatamente a derivada f linha de x igual a dois x menos três!",
      },
    ],
  },

  /* ===================== Q06 ===================== */
  {
    id: "list-q06",
    scenes: [
      {
        id: "domains",
        label: "(a) Domínios Máximos & Fatoração",
        subtitle: "D_g = ℝ, mas em f o denominador exige x ≠ 1! Só para x ≠ 1 podemos cancelar (x − 1) e obter f(x) = x + 1.",
        script:
          "A Questão Seis é uma das mais importantes da lista inteira porque prepara diretamente o conceito de Limite zero sobre zero! Temos duas funções: f de x igual a x ao quadrado menos um sobre x menos um, e g de x igual a x mais um, cada uma no seu domínio real máximo. No item A, vamos determinar os dois domínios ANTES de fazer qualquer simplificação! Para g de x igual a x mais um, é um polinômio sem restrição nenhuma, logo o domínio de g é todo o conjunto dos reais R. Já em f de x, olhando para a fórmula original antes de mexer nela, há um denominador x menos um! Como nunca podemos dividir por zero, exigimos x menos um diferente de zero, ou seja, x diferente de um! Portanto o domínio de f é R menos o elemento um, ou menos infinito até um aberto união um aberto até mais infinito! Agora sim, PARA x diferente de um, o fator x menos um não é zero, então podemos fatorar o numerador como diferença de quadrados — x menos um vezes x mais um — e cancelar x menos um em cima e embaixo, chegando em f de x igual a x mais um, válido exclusivamente para x diferente de um!",
      },
      {
        id: "graphs-diff",
        label: "(b) Mesmo Gráfico? O Buraco em (1, 2)!",
        subtitle: "NÃO! g(1) = 2 (bolinha cheia ●). Em f, x = 1 gera 0/0 (indefinido!), arrancando o ponto (1, 2) com um buraco vazio ○!",
        script:
          "No item B vem a pergunta decisiva: as duas funções têm o mesmo gráfico? A resposta é NÃO! Duas funções só são iguais, com o mesmo gráfico, se tiverem a mesma regra E o mesmo domínio! Olhe os dois gráficos desenhados na tela: o gráfico de g de x igual a x mais um é a reta inteira e contínua de inclinação um passando por zero, um e passando normalmente pelo ponto um, dois com bolinha preenchida, porque g de um vale um mais um igual a dois. Já o gráfico de f é idêntico à mesma reta em TODOS os infinitos pontos onde x é diferente de um — porém, exatamente em x igual a um, a fórmula original de f dá zero sobre zero, que não existe! Então o ponto um, dois é arrancado da reta e substituído por um BURACO, uma bolinha vazia! Na reta de f há uma descontinuidade removível bem em um, dois!",
      },
      {
        id: "images",
        label: "(c) Imagens Im_g = ℝ  vs  Im_f = ℝ \\ {2}",
        subtitle: "Como x + 1 = 2 só aconteceria em x = 1 (fora de D_f!), o valor y = 2 NUNCA é atingido por f: Im_f = (−∞, 2) ∪ (2, +∞)!",
        script:
          "E no item C vamos determinar a imagem de cada função! Para g de x igual a x mais um, como é uma função afim com coeficiente angular um diferente de zero, já provamos nas nossas aulas que a imagem de g é toda a reta real R! E qual é a imagem de f? Cuidado para não responder R no automático! Pergunte-se: existe algum x dentro do domínio de f que consiga produzir a saída y igual a dois? Vamos testar: para x diferente de um, f de x igual a dois significa x mais um igual a dois, o que obrigaria x igual a um! Mas x igual a um está FORA do domínio de f! Como nenhum outro x consegue gerar a altura dois, a altura y igual a dois fica de fora da imagem! Portanto a imagem de f é R menos o elemento dois, isto é, menos infinito até dois aberto união dois aberto até mais infinito! Olha na projeção sobre o eixo y: o buraco em um, dois projeta um furinho exatamente no dois!",
      },
    ],
  },

  /* ===================== Q07 ===================== */
  {
    id: "list-q07",
    scenes: [
      {
        id: "compare-fg",
        label: "(a) f: ℝ→ℝ  vs  g: ℝ→[0, ∞)",
        subtitle: "Ambas têm Im = [0, ∞). Em f sobram os negativos no contradomínio ℝ; em g a imagem coincide 100% com o contradomínio!",
        script:
          "A Questão Sete mostra por que uma função NÃO é só a fórmula! Temos três funções usando exatamente a mesma regra x levado em x ao quadrado, mas com domínios e contradomínios diferentes: f de R em R; g de R em zero fechado até mais infinito; e h do intervalo fechado menos dois até um chegando em R. No item A vamos achar a imagem de cada uma e comparar com seu contradomínio! Começando por f e g: ambas têm domínio igual a todo R. Quando elevamos qualquer número real ao quadrado, obtemos sempre um número maior ou igual a zero, e todo número maior ou igual a zero tem raiz quadrada real! Logo, tanto a imagem de f quanto a imagem de g valem o intervalo fechado em zero até mais infinito! Agora compare com o contradomínio: em f, o contradomínio é R todo, então a imagem é estritamente menor que o contradomínio — sobram todos os números negativos sem receber flecha, logo f NÃO é sobrejetora! Já em g, o contradomínio foi ajustado para zero fechado até mais infinito, coincidindo exatamente com a imagem — portanto g É sobrejetora!",
      },
      {
        id: "image-h",
        label: "(a) Pegadinha de h: [−2, 1] → ℝ (Vértice x = 0!)",
        subtitle: "Cuidado: Im_h NÃO é [h(1), h(−2)] = [1, 4]! Como x = 0 está em [−2, 1], o mínimo é h(0) = 0 e o máximo h(−2) = 4 ⇒ Im_h = [0, 4]!",
        script:
          "Agora preste muita atenção na terceira função, h definida apenas no intervalo fechado de menos dois até um chegando em R! Aqui mora uma armadilha clássica: muita gente só substitui as duas pontas do intervalo, calcula h de menos dois igual a quatro e h de um igual a um, e escreve imagem igual a de um até quatro — ERRADO! Por que está errado? Porque a função x ao quadrado NÃO é monótona em menos dois até um: ela desce de menos dois até zero e depois sobe de zero até um! O vértice da parábola em x igual a zero está DENTRO do domínio menos dois até um, e lá a altura cai até h de zero igual a zero! Já o ponto mais alto acontece na ponta menos dois, onde menos dois ao quadrado vale quatro! Percorrendo o arco da parábola desenhado na tela de x igual a menos dois até x igual a um, as alturas y varrem continuamente do mínimo zero até o máximo quatro! Logo a imagem de h é o intervalo fechado de zero até quatro — que também é estritamente menor do que o contradomínio R!",
      },
      {
        id: "solve-4",
        label: "(b) Resolvendo f(x)=4, g(x)=4 e h(x)=4",
        subtitle: "x² = 4 dá ±2. Em f e g ambos entram: {−2, 2}. Em h, o domínio é [−2, 1]: +2 está FORA! Só sobrevive x = −2!",
        script:
          "No item B, queremos resolver a equação de saída igual a quatro para cada uma das três funções e explicar como o domínio influencia a resposta! Algebricamente, a regra x ao quadrado igual a quatro sempre produz duas raízes candidatas reais: x igual a menos dois e x igual a mais dois. Porém, uma solução só vale se pertencer ao DOMÍNIO da função em questão! Para f de x igual a quatro, o domínio é R todo; tanto menos dois quanto mais dois estão em R, então o conjunto solução é menos dois e dois. Para g de x igual a quatro, o domínio também é R todo — mudar apenas o contradomínio não alterou em nada as entradas válidas —, então a solução continua sendo menos dois e dois! Agora olhe para h de x igual a quatro: o domínio de h é somente o intervalo fechado de menos dois até um! Testando as candidatas: menos dois pertence ao intervalo menos dois até um, beleza! Mas o mais dois está FORA do intervalo, pois dois é maior que um! Logo, para h de x igual a quatro existe uma ÚNICA solução: x igual a menos dois! Moral da história: o domínio funciona como um filtro obrigatório para toda equação!",
      },
    ],
  },

  /* ===================== Q08 ===================== */
  {
    id: "list-q08",
    scenes: [
      {
        id: "anatomy",
        label: "(a) Domínio [−3, 4], Imagem [−2, 3], f(−1) e f(1)",
        subtitle: "Os 3 segmentos cobrem todo [−3, 4] em X e [−2, 3] em Y. Em x = 1, (1, 1) é vazia ○ e (1, −2) é cheia ● ⇒ f(1) = −2!",
        script:
          "A Questão Oito é pura leitura cirúrgica de gráfico, e nós reconstruímos aqui na tela exatamente o gráfico da folha com os três segmentos de reta! Vamos analisar com calma cada pedaço antes de responder o item A. O primeiro segmento vai de menos três, menos um com bolinha preenchida, subindo até menos um, três com bolinha preenchida. O segundo segmento desce de menos um, três até um, um com BOLINHA VAZIA! E bem embaixo de x igual a um há um salto: o terceiro segmento começa em um, menos dois com BOLINHA PREENCHIDA e sobe até quatro, um com bolinha preenchida! Agora veja como o item A sai limpinho: primeiro, qual é o domínio? Projetando todos os trechos no eixo x, cobrimos de menos três até um aberto, e o terceiro trecho fecha o x igual a um indo até quatro fechado! Não sobra nenhum buraco em x, logo o domínio é o intervalo fechado de menos três até quatro! Segundo, qual é a imagem? Projetando no eixo y, o ponto mais baixo do gráfico inteiro é menos dois fechado em x igual a um, e o pico mais alto é três fechado em x igual a menos um; todos os valores intermediários são atingidos sem lacunas, logo a imagem é o intervalo fechado de menos dois até três! Por fim, f de menos um é três, e f de um vale MENOS DOIS — nunca um, porque o ponto um, um é bolinha vazia excluída, enquanto um, menos dois é bolinha cheia incluída!",
      },
      {
        id: "roots-eq0",
        label: "(b) Resolvendo f(x) = 0 (Equações dos Segmentos)",
        subtitle: "Trecho 1: reta de (−3,−1) a (−1,3) é y = 2x + 5 ⇒ zera em x = −5/2! Trecho 3: reta de (1,−2) a (4,1) é y = x − 3 ⇒ zera em x = 3!",
        script:
          "No item B precisamos primeiro resolver f de x igual a zero, ou seja, encontrar exatamente onde o gráfico cruza o eixo horizontal x! Como o enunciado avisa que os trechos são segmentos de reta, podemos achar o valor exato pela equação da reta de cada trecho sem precisar chutar no olhômetro! No primeiro segmento, vamos de menos três, menos um até menos um, três: a variação em y é três menos menos um, que dá quatro, e a variação em x é menos um menos menos três, que dá dois! Logo a inclinação é quatro dividido por dois, igual a dois! A equação desse trecho é y igual a dois x mais cinco — confira: em menos um dá três, em menos três dá menos um! Igualando a zero: dois x mais cinco igual a zero dá x igual a menos cinco meios, ou menos dois vírgula cinco! No segundo segmento, a curva só vai de altura três até um, nunca toca o eixo x. Já no terceiro segmento, vamos de um, menos dois até quatro, um: variação em y é três e em x é três, inclinação um! A equação é y igual a x menos três, que cruza o eixo x exatamente em x igual a três! Portanto, f de x igual a zero tem duas raízes: menos cinco meios e três!",
      },
      {
        id: "eq-1-trap",
        label: "(b) Resolvendo f(x) = 1 · A Pegadinha da Bolinha ○!",
        subtitle: "A reta horizontal y = 1 corta o trecho 1 em x = −2 e o trecho 3 em x = 4. Em x = 1 há bolinha vazia ○ — NÃO é solução!",
        script:
          "Ainda no item B, vamos resolver f de x igual a um! Visualmente, trace uma reta horizontal pontilhada na altura y igual a um e veja onde ela acerta pontos que realmente PERTENCEM ao gráfico! No primeiro segmento, dois x mais cinco igual a um dá dois x igual a menos quatro, logo x igual a menos dois — ponto menos dois, um super válido! Seguindo para a direita, a reta horizontal passa bem em cima do ponto um, um no final do segundo segmento... PARE TUDO! Olhe para a bolinha em um, um: ela é VAZIA! Isso significa que f de um NÃO vale um, vale menos dois! Portanto x igual a um NÃO entra na resposta! Continuando até o terceiro segmento, a reta y igual a um acerta a pontinha final quatro, um com bolinha preenchida! Logo a solução exata de f de x igual a um é apenas x igual a menos dois e x igual a quatro! Quem não olha a bolinha vazia acaba escrevendo um sem perceber e perde ponto na prova!",
      },
      {
        id: "neg-region",
        label: "(c) Onde f(x) < 0? (Abaixo do Eixo X)",
        subtitle: "Estritamente abaixo do eixo X: de −3 fechado até −5/2 aberto, unido com 1 fechado até 3 aberto ⇒ [−3, −5/2) ∪ [1, 3)!",
        script:
          "Para fechar a Questão Oito, vamos ao item C: determine todos os valores de x para os quais f de x é ESTRITAMENTE menor que zero! No gráfico, f de x menor que zero significa os pedaços da curva que ficam estritamente ABAIXO do eixo horizontal x! Olhe para as duas regiões destacadas em vermelho na tela: a primeira começa lá em x igual a menos três, onde a altura é menos um — como menos um é menor que zero e a bolinha é cheia, menos três ENTRA FECHADO! Ela sobe até cruzar o eixo x em menos cinco meios, onde f vale zero — como a desigualdade é estritamente menor que zero, menos cinco meios fica ABERTO! Então o primeiro pedaço é fechado em menos três até menos cinco meios aberto. A segunda região abaixo do eixo x começa em x igual a um, onde f de um vale menos dois, estritamente negativo com bolinha cheia, logo um ENTRA FECHADO! E vai subindo até cruzar o eixo x em três, onde f vale zero, ficando três ABERTO! Juntando tudo: f de x é menor que zero para x pertencente a fechado em menos três até menos cinco meios aberto, união fechado em um até três aberto!",
      },
    ],
  },

  /* ===================== Q09 ===================== */
  {
    id: "list-q09",
    scenes: [
      {
        id: "item-a",
        label: "(a) y² = x em [0, ∞) · Viola Unicidade!",
        subtitle: "Existe saída para todo x ≥ 0, mas para todo x > 0 (ex: x = 4) há DUAS saídas y = ±2! Reta vertical corta 2 vezes ⇒ NÃO é função.",
        script:
          "A Questão Nove testa o núcleo da definição formal de função: para uma relação definir y como função de x num conjunto de entradas, ela precisa cumprir DUAS exigências para todo x do domínio: EXISTÊNCIA de pelo menos uma saída y, e UNICIDADE, isto é, no máximo uma única saída y! Vamos ao item A: y ao quadrado igual a x, com x pertencente a zero fechado até mais infinito. Primeiro checamos existência: como x é maior ou igual a zero, sempre existe número real cujo quadrado dá x, então a existência passa! Agora checamos a unicidade: escolha qualquer x positivo, por exemplo x igual a quatro! Quais valores de y satisfazem y ao quadrado igual a quatro? Tanto y igual a mais dois quanto y igual a menos dois! Um único x disparou DUAS saídas diferentes! No plano cartesiano, isso forma uma parábola deitada onde a reta vertical x igual a quatro corta o gráfico em dois pontos, quatro, dois e quatro, menos dois! Como falha a UNICIDADE, o item A NÃO define y como função de x!",
      },
      {
        id: "item-b",
        label: "(b) y³ = x em ℝ · Existência & Unicidade OK!",
        subtitle: "Todo real (positivo, zero ou negativo!) possui UMA e somente UMA raiz cúbica real y = ∛x ⇒ SIM, define função!",
        script:
          "Agora olha o contraste lindo no item B: y ao cubo igual a x, para todo x real! Por que o expoente três muda completamente o jogo em relação ao expoente dois? Porque elevar ao cubo preserva o sinal e é estritamente crescente em toda a reta real! Primeiro, EXISTÊNCIA: mesmo para x negativo, existe raiz cúbica real — por exemplo, se x vale menos oito, y igual a menos dois resolve perfeitamente, pois menos dois ao cubo dá menos oito! Para x zero temos y zero; para x positivo temos y positivo. Segundo, UNICIDADE: se dois números reais diferentes são elevados ao cubo, seus cubos são obrigatoriamente diferentes! Nunca existem dois valores distintos de y com o mesmo cubo x! Portanto, para CADA x real existe uma e SOMENTE uma saída real, dada por y igual a raiz cúbica de x! No teste da reta vertical, toda linha vertical corta a curva exatamente uma única vez! Logo o item B SIM, define y como função de x!",
      },
      {
        id: "item-c",
        label: "(c) x² + y² = 1 · O Círculo Unitário",
        subtitle: "Isolando y: y = ±√(1 − x²). Para x = 0 temos y = +1 e y = −1! Viola a unicidade ⇒ NÃO é função.",
        script:
          "Vamos ao item C: x ao quadrado mais y ao quadrado igual a um, no intervalo de entradas de menos um fechado até um fechado — a equação do famoso círculo de raio um centrado na origem! Primeiro testamos a existência: isolando y ao quadrado temos y ao quadrado igual a um menos x ao quadrado. Como x está entre menos um e um, x ao quadrado é menor ou igual a um, logo um menos x ao quadrado é sempre maior ou igual a zero, garantindo que sempre existe y real! Agora testamos a unicidade: basta pegar qualquer x no miolo aberto entre menos um e um, por exemplo x igual a zero! Ficamos com y ao quadrado igual a um, que entrega DUAS saídas: y igual a mais um lá no topo do círculo e y igual a menos um lá na base! A reta vertical corta a circunferência em dois pontos! Como viola a unicidade, a equação do círculo NÃO define y como função de x!",
      },
      {
        id: "item-c-fix",
        label: "Salvando o Círculo: Impor y ≥ 0 (Semicírculo)",
        subtitle: "Ao exigir y ≥ 0, descartamos o arco de baixo e sobra uma única saída por x: y = √(1 − x²) em [−1, 1]!",
        script:
          "E a pergunta final do item C mostra uma técnica super usada no Cálculo quando queremos transformar uma curva geométrica em função: imponha uma condição sobre y que produza uma função no domínio menos um até um e escreva sua fórmula! O problema era ter o arco de cima positivo e o arco de baixo negativo brigando pelo mesmo x. Então basta escolher UM dos dois lados! Se impusermos a condição y maior ou igual a zero, eliminamos todo o semicírculo inferior e ficamos apenas com a metade de cima! Agora cada x entre menos um e um tem uma única altura não negativa, dada pela fórmula explícita y igual a raiz quadrada positiva de um menos x ao quadrado! E se você preferisse impor y menor ou igual a zero, também estaria cem por cento correto, gerando o semicírculo inferior y igual a menos raiz quadrada de um menos x ao quadrado!",
      },
    ],
  },

  /* ===================== Q10 ===================== */
  {
    id: "list-q10",
    scenes: [
      {
        id: "find-ab",
        label: "(a) Achando a, b e Interseções com os Eixos",
        subtitle: "a = (−4 − 4)/(3 − (−1)) = −8/4 = −2. De f(−1) = 4 vem b = 2 ⇒ f(x) = −2x + 2. Cortes: (0, 2) e (1, 0)!",
        script:
          "Na Questão Dez, voltamos à função afim do nosso caderno: f de x igual a ax mais b, sabendo que f de menos um vale quatro e f de três vale menos quatro! No item A, vamos determinar a e b e as interseções com os dois eixos! Como o gráfico é uma reta passando pelos pontos menos um, quatro e três, menos quatro, calculamos primeiro a inclinação a como delta y dividido por delta x: menos quatro menos quatro, dividido por três menos menos um! No numerador dá menos oito; no denominador, três mais um dá quatro! Menos oito dividido por quatro vale exatamente MENOS DOIS! Achamos a igual a menos dois! Agora substituímos qualquer um dos dois pontos na fórmula para descobrir b: usando f de menos um igual a quatro, temos menos dois vezes menos um, mais b, igual a quatro! Isso dá dois mais b igual a quatro, logo b igual a DOIS! Conferindo no outro ponto: menos dois vezes três mais dois dá menos seis mais dois igual a menos quatro — bateu perfeito! Nossa função é f de x igual a menos dois x mais dois. Para o esboço, achamos os dois cortes nos eixos: no eixo vertical y fazemos x igual a zero, obtendo o ponto zero, dois; no eixo horizontal x fazemos y igual a zero, menos dois x mais dois igual a zero dá x igual a um, obtendo a raiz um, zero!",
      },
      {
        id: "diff-quot",
        label: "(b) [f(x + h) − f(x)] / h = −2 · Significado Geométrico",
        subtitle: "(−2(x+h)+2 − (−2x+2))/h = −2h/h = −2! Geometricamente, é o coeficiente angular a = tg α: desce 2 em y a cada +1 em x!",
        script:
          "No item B, calculamos o quociente de diferenças f de x mais h menos f de x, dividido por h, para h diferente de zero, e interpretamos o resultado geometricamente! Primeiro desenvolvemos f de x mais h: menos dois vezes x mais h entre parênteses, mais dois, que abre em menos dois x menos dois h mais dois. Agora subtraímos f de x, que é menos dois x mais dois: o menos dois x cancela com mais dois x, e o mais dois cancela com menos dois, sobrando apenas menos dois h dividido por h! Como h é diferente de zero, simplificamos h com h e o resultado dá a constante MENOS DOIS — independente tanto de x quanto de h! Qual é a interpretação geométrica? Em uma reta, a inclinação não muda nunca! Esse menos dois é exatamente o coeficiente angular a, igual à tangente do ângulo de inclinação da reta: qualquer reta secante ligando dois pontos da nossa função coincide com a própria reta, e a taxa de variação é constante — para cada uma unidade que avançamos para a direita em x, o gráfico desce exatamente duas unidades em y!",
      },
      {
        id: "restricted-im",
        label: "(c) Imagem na Restrição [−1, 3]",
        subtitle: "Como a = −2 < 0, a reta só desce! Vai do topo f(−1) = 4 até o fundo f(3) = −4 ⇒ Im = [−4, 4]!",
        script:
          "E o item C pede a imagem da restrição de f ao intervalo fechado de menos um até três! Diferente da parábola da Questão Sete que fazia curva e tinha vértice no meio, a função afim f de x igual a menos dois x mais dois tem coeficiente angular negativo, logo ela é ESTRITAMENTE DECRESCENTE em todo o intervalo! Começa no seu ponto mais alto lá na extremidade esquerda, em x igual a menos um com altura f de menos um igual a quatro, e desce continuamente em linha reta sem voltar atrás até atingir o ponto mais baixo na extremidade direita, em x igual a três com altura f de três igual a menos quatro! Por ser contínua e decrescente, as alturas y preenchem todos os números reais entre menos quatro e quatro! Atenção na hora de escrever o intervalo: sempre do MENOR para o MAIOR — imagem igual ao intervalo fechado de menos quatro até quatro!",
      },
    ],
  },

  /* ===================== Q11 ===================== */
  {
    id: "list-q11",
    scenes: [
      {
        id: "complete-sq",
        label: "(a) Completando o Quadrado: 2(x − 2)² − 2",
        subtitle: "2(x² − 4x) + 6 = 2[(x − 2)² − 4] + 6 = 2(x − 2)² − 2! Vértice V = (2, −2) e eixo de simetria x = 2!",
        script:
          "Na Questão Onze temos a quadrática q de x igual a dois x ao quadrado menos oito x mais seis. No item A o enunciado pede para reescrevermos q na forma canônica dois vezes x menos alfa ao quadrado, mais beta, determinando o vértice e o eixo de simetria! Acompanhe o completamento de quadrado passo a passo, sem pular nada: primeiro colocamos o dois em evidência nos termos com x: dois que multiplica x ao quadrado menos quatro x, mais seis lá fora. Agora olhamos para o coeficiente do x lá dentro, que é menos quatro, e pegamos a METADE dele, que é menos dois! Sabemos que x menos dois ao quadrado dá x ao quadrado menos quatro x mais quatro — ou seja, gera um mais quatro extra que não existia! Para compensar sem alterar a conta, subtraímos quatro dentro do colchete: dois que multiplica x menos dois ao quadrado menos quatro, fecha colchete, mais seis! Agora distribuímos o dois de fora — cuidado para multiplicar o menos quatro também! Fica dois vezes x menos dois ao quadrado, menos oito, mais seis, o que resulta em dois vezes x menos dois ao quadrado menos dois! Comparando com a forma pedida, temos alfa igual a dois e beta igual a menos dois! Como o quadrado é sempre maior ou igual a zero e só zera em x igual a dois, o VÉRTICE é dois, menos dois, e o eixo de simetria vertical é a reta x igual a dois!",
      },
      {
        id: "roots-sign",
        label: "(b) Raízes {1, 3}, Sinal & Imagem [−2, +∞)",
        subtitle: "2(x−2)² = 2 ⇒ x − 2 = ±1 ⇒ raízes 1 e 3! Concavidade ∪: negativa em (1, 3), positiva fora, e mínimo global em y = −2!",
        script:
          "Veja como a forma canônica dois vezes x menos dois ao quadrado menos dois deixa o item B ridiculamente fácil! Primeiro, achando as raízes sem nem usar Bhaskara: iguale a zero — dois vezes x menos dois ao quadrado igual a dois! Dividindo por dois, x menos dois ao quadrado igual a um! Tirando a raiz quadrada, x menos dois é igual a mais um ou menos um! Se x menos dois vale um, temos x igual a três; se x menos dois vale menos um, temos x igual a um! As raízes são exatamente um e três — lindamente simétricas em torno do eixo x igual a dois! Agora o estudo do sinal: como o coeficiente líder dois é positivo, a parábola tem concavidade para cima! Logo, q de x é POSITIVA fora das raízes, isto é, em menos infinito até um aberto união três aberto até mais infinito; ZERA em um e três; e é NEGATIVA entre as raízes, no intervalo aberto de um até três! E qual é a imagem em todo R? Como dois vezes x menos dois ao quadrado é sempre maior ou igual a zero, o valor mínimo global é menos dois, e a curva sobe até mais infinito: imagem igual a fechado em menos dois até mais infinito!",
      },
      {
        id: "restrict-03",
        label: "(c) Pegadinha da Restrição a [0, 3]!",
        subtitle: "q(0) = 6 e q(3) = 0, MAS o vértice x = 2 mora dentro de [0, 3] com q(2) = −2! Logo a imagem vai de −2 até 6: [−2, 6]!",
        script:
          "E chegamos à pegadinha favorita do item C: determine a imagem da restrição de q ao intervalo fechado de zero até três! Vamos calcular os extremos primeiro: em x igual a zero, q de zero vale seis; em x igual a três, q de três vale zero, pois três é raiz! Mas NUNCA responda zero até seis antes de checar se o vértice caiu dentro do intervalo! Onde fica o vértice? Em x igual a DOIS! E dois pertence ao intervalo fechado de zero até três! Logo, a parábola desce a partir de zero, seis, atravessa o eixo x em um, bate lá no fundo do poço no vértice dois, menos dois, e só então volta a subir até encerrar na raiz três, zero! Portanto, a menor altura atingida no intervalo zero até três é menos dois, lá no vértice, e a maior altura é seis, na ponta esquerda zero, que está mais longe do eixo de simetria x igual a dois! Conclusão definitiva: a imagem restrita a zero até três é o intervalo fechado de menos dois até seis!",
      },
    ],
  },

  /* ===================== Q12 ===================== */
  {
    id: "list-q12",
    scenes: [
      {
        id: "cubic-sqrt",
        label: "(a) y = x³  e  (b) y = √x",
        subtitle: "y = x³ sobe suavemente por todo ℝ (D = Im = ℝ). Já y = √x nasce em (0,0) e vive só no 1º quadrante (D = Im = [0, ∞)).",
        script:
          "Na Questão Doze montamos a nossa galeria visual das quatro funções elementares de potência que você precisa reconhecer de olhos fechados no Cálculo! Vamos começar pelos itens A e B. No item A temos a cúbica básica y igual a x ao cubo. Marcando pontos de referência: em menos dois dá menos oito, em menos um dá menos um, em zero dá zero — onde a curva faz uma leve achatadinha horizontal chamada ponto de inflexão —, em um dá um, e em dois sobe rápido para oito! Não há nenhuma restrição na conta e ela cresce de menos infinito até mais infinito, portanto domínio igual a R e imagem igual a R! No item B temos a função raiz quadrada y igual a raiz de x. Como só tiramos raiz quadrada real de número maior ou igual a zero, e o símbolo radical representa sempre a raiz NÃO NEGATIVA, o gráfico nasce na origem zero, zero, passa por um, um e por quatro, dois, crescendo cada vez mais devagar como metade de uma parábola deitada! Domínio igual a zero fechado até mais infinito, e imagem igual a zero fechado até mais infinito!",
      },
      {
        id: "inv-x",
        label: "(c) y = 1/x · Preserva o Sinal de x!",
        subtitle: "Em y = 1/x, x > 0 gera y > 0 (1º quadrante) e x < 0 gera y < 0 (3º quadrante). D = Im = ℝ \\ {0} com assíntotas x=0 e y=0.",
        script:
          "Agora olhe o item C: a função recíproca y igual a um sobre x! A única proibição é dividir por zero, logo x diferente de zero e o domínio é R menos zero. E o que acontece quando x fica bem pequenininho perto de zero? Um dividido por zero vírgula um dá dez; um dividido por zero vírgula zero um dá cem — a curva dispara para o infinito encostando na assíntota vertical x igual a zero! E quando x vai para mais ou menos infinito, um sobre x tende a zero sem nunca zerar — assíntota horizontal y igual a zero! Por isso a imagem também é R menos zero! E respondendo à pergunta sobre o sinal: em y igual a um sobre x, o sinal da saída é SEMPRE IGUAL ao sinal de x! Quando x é positivo, um sobre x é positivo e o ramo fica no primeiro quadrante; quando x é negativo, um sobre x é negativo e o ramo espelhado fica no terceiro quadrante! Trata-se de uma função ímpar!",
      },
      {
        id: "inv-x2",
        label: "(d) y = 1/x² · Sempre Positiva (Função Par!)",
        subtitle: "Elevar ao quadrado elimina o sinal negativo: x² > 0 para todo x ≠ 0! Os dois ramos sobem no 1º e 2º quadrantes: Im = (0, +∞)!",
        script:
          "Compare agora com o item D: y igual a um sobre x ao quadrado! O domínio continua sendo R menos zero, porque zero ao quadrado ainda dá zero no denominador. Porém, olha o que o expoente par faz com o sinal de x: para qualquer x diferente de zero — seja x positivo OU x negativo —, x ao quadrado é ESTRITAMENTE POSITIVO! Logo, um dividido por x ao quadrado é SEMPRE positivo! Em vez de um ramo cair para baixo no terceiro quadrante como em um sobre x, o ramo da esquerda sobe em simetria perfeita no SEGUNDO quadrante, formando aquele desenho clássico de vulcão simétrico em torno do eixo vertical y! Como a saída nunca pode ser negativa nem zero, a imagem de um sobre x ao quadrado é apenas o intervalo aberto de zero até mais infinito! Guarde essa dupla na memória: um sobre x preserva o sinal de x e é ímpar; um sobre x ao quadrado apaga o sinal negativo de x e é par, sempre positiva!",
      },
    ],
  },

  /* ===================== Q13 ===================== */
  {
    id: "list-q13",
    scenes: [
      {
        id: "unit-circle",
        label: "(a) Círculo de Raio 1 ⇒ Imagem [−1, 1]",
        subtitle: "Cada ângulo x em radianos marca o ponto (cos x, sin x) no círculo x² + y² = 1: abscissa e ordenada variam exatamente de −1 a +1!",
        script:
          "A Questão Treze conecta diretamente a geometria do círculo trigonométrico de raio um aos gráficos de seno e cosseno em radianos! No círculo unitário centrado na origem, cuja equação é u ao quadrado mais v ao quadrado igual a um, medimos o ângulo x em radianos a partir do ponto um, zero no sentido anti-horário. As coordenadas do ponto P sobre a circunferência são, por definição, abscissa igual a cosseno de x e ordenada igual a seno de x! Olha como o item A sai imediatamente da geometria: como o ponto P está preso sobre a circunferência de raio um, temos cosseno ao quadrado de x mais seno ao quadrado de x igual a um! Como ambos os quadrados são não negativos, nenhum dos dois pode ultrapassar um, ou seja, tanto o cosseno quanto o seno ficam sempre presos entre menos um e mais um! E mais: à medida que o ponto percorre o círculo inteiro, a altura v passa continuamente pelo ponto mais baixo zero, menos um até o mais alto zero, um, e a largura u passa de menos um, zero até um, zero! Assim provamos que, com domínio em todo R, tanto a imagem do seno quanto a imagem do cosseno são EXATAMENTE o intervalo fechado de menos um até um!",
      },
      {
        id: "period-2pi",
        label: "(b) Periodicidade 2π: Uma Volta Completa!",
        subtitle: "O comprimento da circunferência de raio 1 é 2π. Somar 2π radianos leva exatamente ao mesmo ponto: sin(x+2π)=sin x e cos(x+2π)=cos x!",
        script:
          "E o item B fica igualmente transparente olhando para o círculo girando na tela! Qual é o perímetro de uma circunferência de raio r igual a um? Dois pi vezes r, ou seja, exatamente dois pi radianos! Isso significa que somar dois pi ao ângulo x corresponde a fazer o ponto P dar UMA VOLTA COMPLETA de trezentos e sessenta graus ao redor da origem, parando exatamente sobre o mesmíssimo ponto geométrico onde já estava! Como as coordenadas geométricas do ponto são idênticas, sua abscissa e sua ordenada não mudam nada: portanto cosseno de x mais dois pi é igual a cosseno de x, e seno de x mais dois pi é igual a seno de x, para todo x real! É por isso que dizemos que seno e cosseno são funções periódicas de período dois pi!",
      },
      {
        id: "sketch-sin",
        label: "Esboço de y = sin x em [−π, π]",
        subtitle: "Zeros em −π, 0 e π; vale mínimo −1 em −π/2 e pico máximo +1 em +π/2 (função ímpar!).",
        script:
          "Agora vamos esboçar os dois gráficos em radianos no intervalo fechado de menos pi até pi, marcando todos os zeros e todos os pontos onde atingem mais um ou menos um! Começando por y igual a seno de x: seno é a ALTURA no círculo unitário! Em x igual a menos pi estamos na ponta esquerda do círculo, altura zero — primeiro zero em menos pi! Caminhando para menos pi sobre dois, descemos até o fundo do círculo, atingindo o MÍNIMO menos um em menos pi sobre dois! Em x igual a zero estamos à direita, altura zero — segundo zero na origem! Em mais pi sobre dois atingimos o topo do círculo, PICO MÁXIMO mais um! E em x igual a pi completamos a meia volta chegando de novo à esquerda, terceiro zero em pi! Repare na simetria em relação à origem: seno é função ímpar!",
      },
      {
        id: "sketch-cos",
        label: "Esboço de y = cos x em [−π, π]",
        subtitle: "Pico máximo +1 em x = 0; zeros em −π/2 e +π/2; mínimo −1 nas pontas −π e +π (função par!).",
        script:
          "Agora esboçamos y igual a cosseno de x no mesmo intervalo menos pi até pi: lembre que cosseno é a coordenada HORIZONTAL no círculo unitário! Em x igual a menos pi estamos lá na extrema esquerda, logo cosseno vale MÍNIMO menos um! Em menos pi sobre dois estamos embaixo no eixo vertical, coordenada horizontal zero — primeiro zero em menos pi sobre dois! Em x igual a zero estamos na extrema direita, logo atingimos o PICO MÁXIMO mais um bem sobre o eixo y! Em mais pi sobre dois voltamos ao eixo vertical, segundo zero em pi sobre dois! E finalmente em x igual a pi chegamos à extrema esquerda, de novo no MÍNIMO menos um! Note o lindo formato de sino simétrico em torno do eixo vertical: cosseno é função par, e é apenas a onda do seno deslocada pi sobre dois para a esquerda!",
      },
    ],
  },

  /* ===================== Q14 ===================== */
  {
    id: "list-q14",
    scenes: [
      {
        id: "trans-ab",
        label: "(a) √(x − 2) vs (b) √x + 2 · Dentro vs Fora!",
        subtitle: "Em (a), o −2 está DENTRO da raiz → desloca o DOMÍNIO 2 para a direita ([2, ∞)). Em (b), +2 está FORA → sobe a IMAGEM 2 para cima ([2, ∞))!",
        script:
          "A Questão Quatorze ensina a ler transformações gráficas sem decorar tabelas — apenas distinguindo o que mexe DENTRO da função do que mexe FORA da função! Partimos sempre da curva-mãe y igual a raiz de x, que começa em zero, zero com domínio e imagem iguais a zero fechado até mais infinito. Compare logo os itens A e B! No item A temos y igual a raiz quadrada de x menos dois — o menos dois está DENTRO do radical, mexendo diretamente na entrada x! Para a raiz começar em zero agora, precisamos de x menos dois igual a zero, ou seja, x igual a DOIS! Por isso subtrair dois dentro da função faz uma translação HORIZONTAL de duas unidades para a DIREITA! A curva agora começa em dois, zero: o domínio muda para fechado em dois até mais infinito, enquanto a imagem continua intacta em zero fechado até mais infinito! Já no item B temos y igual a raiz de x, fecha a raiz, mais dois FORA! Aqui calculamos a raiz de x normal e depois somamos dois na ALTURA y! Isso faz uma translação VERTICAL de duas unidades para CIMA! A curva começa em zero, dois: o domínio continua zero fechado até mais infinito, e quem muda agora é a imagem, que sobe para fechado em dois até mais infinito! Essa é exatamente a diferença essencial entre A e B: alteração interna desloca horizontalmente e muda o domínio; alteração externa desloca verticalmente e muda a imagem!",
      },
      {
        id: "trans-c",
        label: "(c) y = −√x · Reflexão no Eixo X",
        subtitle: "O sinal negativo FORA da raiz inverte todas as alturas y: a curva espelha para baixo do eixo X! D = [0, ∞) e Im = (−∞, 0].",
        script:
          "Vamos agora para o item C: y igual a menos raiz quadrada de x! Olhe onde o sinal de menos está posicionado: ele está FORA da raiz! Isso significa que o radicando continua sendo simplesmente x, exigindo x maior ou igual a zero — logo o domínio permanece zero fechado até mais infinito. Porém, cada altura positiva raiz de x agora é multiplicada por menos um, virando negativa! O ponto um, um vira um, menos um; o ponto quatro, dois vira quatro, menos dois! Geometricamente, a curva inteira sofre uma REFLEXÃO em torno do eixo horizontal x, descendo pelo quarto quadrante! Logo o domínio é zero fechado até mais infinito, e a imagem passa a ser menos infinito até zero fechado!",
      },
      {
        id: "trans-d",
        label: "(d) y = √(−x) · Reflexão no Eixo Y (x ≤ 0!)",
        subtitle: "O menos DENTRO da raiz exige −x ≥ 0 ⇔ x ≤ 0! Não é raiz de negativo: para x = −4, −x = +4 ⇒ √4 = 2! D = (−∞, 0], Im = [0, ∞).",
        script:
          "E fechamos a Questão Quatorze com o item D, que costuma assustar à primeira vista: y igual a raiz quadrada de menos x! Muita gente bate o olho no sinal de menos dentro da raiz e grita que não existe! Calma! Menos x NÃO é necessariamente negativo — depende do sinal de x! Como o radicando precisa ser maior ou igual a zero, impomos menos x maior ou igual a zero; multiplicando por menos um e invertendo o sinal, obtemos x menor ou igual a zero! Teste com x igual a menos quatro: menos menos quatro dá mais quatro, e a raiz quadrada de mais quatro vale mais dois! Logo o ponto menos quatro, dois está no gráfico! Geometricamente, trocar x por menos x dentro da função produz uma REFLEXÃO em torno do eixo vertical y: a curva agora nasce na origem e caminha para a ESQUERDA no segundo quadrante! Assim, o domínio é menos infinito até zero fechado, e a imagem continua sendo zero fechado até mais infinito!",
      },
    ],
  },

  /* ===================== Q15 ===================== */
  {
    id: "list-q15",
    scenes: [
      {
        id: "basics",
        label: "(a) Domínio, Raiz (−2, 0) & Corte Y (0, −2)",
        subtitle: "Denominador x − 1 ≠ 0 ⇒ D_r = ℝ \\ {1}. Raiz: x + 2 = 0 ⇒ x = −2. Corte em Y: r(0) = 2/(−1) = −2!",
        script:
          "Na Questão Quinze vamos dominar o esboço completo de uma função racional: r de x igual a x mais dois dividido por x menos um! No item A, começamos pelos três dados estruturais. Primeiro, o domínio: o denominador x menos um não pode zerar, então x diferente de um — domínio de r igual a R menos um, ou menos infinito até um aberto união um aberto até mais infinito. Segundo, os zeros ou raízes da função, onde r de x vale zero: uma fração só dá zero quando o NUMERADOR zera e o denominador não zera! Fazendo x mais dois igual a zero encontramos x igual a menos dois, que está no domínio! Logo o único zero é x igual a menos dois, cortando o eixo x no ponto menos dois, zero. Terceiro, a interseção com o eixo vertical y, que é simplesmente calcular r de zero: zero mais dois dividido por zero menos um dá dois sobre menos um, igual a menos dois! Logo o gráfico cruza o eixo vertical no ponto zero, menos dois!",
      },
      {
        id: "decomp",
        label: "(b) Truque Algébrico: r(x) = 1 + 3/(x − 1) & Esboço",
        subtitle: "Escreva x + 2 = (x − 1) + 3 e divida! Nasce 1 + 3/(x − 1): assíntota vertical x = 1 e horizontal y = 1!",
        script:
          "Olha a elegância do item B: reescrever r de x na forma um mais três sobre x menos um e usar isso para esboçar o gráfico a partir de y igual a um sobre x! Como fazemos essa transformação algebricamente sem nem precisar armar divisão de polinômios? Queremos fazer aparecer o denominador x menos um lá no numerador! Então escrevemos x mais dois como x menos um mais três — confira: menos um mais três dá dois! Agora separamos em duas frações: x menos um sobre x menos um, mais três sobre x menos um! Como x é diferente de um, a primeira fração vale exatamente UM, chegando em r de x igual a um mais três dividido por x menos um! Agora observe a cadeia de três transformações a partir da hipérbole básica y igual a um sobre x: primeiro, trocar x por x menos um desloca uma unidade para a DIREITA, levando a assíntota vertical para a reta x igual a um; segundo, multiplicar por três estica os ramos verticalmente por um fator três; terceiro, somar mais um sobe o gráfico inteiro uma unidade para CIMA, levando a assíntota horizontal de y igual a zero para y igual a um! A hipérbole se encaixa perfeitamente nos quadrantes formados pelas assíntotas x igual a um e y igual a um, passando exatamente pelos nossos pontos menos dois, zero e zero, menos dois!",
      },
      {
        id: "im-ineq",
        label: "(c) Imagem ℝ \\ {1} & Desigualdade r(x) > 1",
        subtitle: "Como 3/(x−1) nunca zera, r(x) nunca vale 1 ⇒ Im_r = ℝ \\ {1}. E r(x) > 1 ⇔ 3/(x−1) > 0 ⇔ x > 1 ⇒ (1, +∞)!",
        script:
          "E veja como a forma do item B resolve o item C em duas linhas! Primeiro, qual é a imagem de r? Sabemos que a fração três sobre x menos um assume todos os números reais exceto o zero — pois três dividido por qualquer número jamais dá zero! Somando um a todos os valores reais menos zero, obtemos todos os números reais exceto o UM! Portanto a imagem de r é R menos um, ou seja, menos infinito até um aberto união um aberto até mais infinito — exatamente a altura da assíntota horizontal que a curva nunca toca! E segundo, resolva a desigualdade r de x maior que um! Substituindo r de x por um mais três sobre x menos um: um mais três sobre x menos um maior que um! Cancelando o um dos dois lados, sobra apenas três dividido por x menos um maior que zero! Como o numerador três já é positivo, essa fração só é positiva quando o denominador x menos um for estritamente positivo, isto é, x maior que um! Solução: intervalo aberto de um até mais infinito — visualmente, é exatamente o ramo da direita que mora acima da assíntota y igual a um!",
      },
    ],
  },

  /* ===================== Q16 ===================== */
  {
    id: "list-q16",
    scenes: [
      {
        id: "piecewise",
        label: "(a) Abrindo o Módulo em Duas Fórmulas",
        subtitle: "Se x ≥ 2, x − 2 ≥ 0 então sai igual: x − 2. Se x < 2, x − 2 < 0 então trocamos o sinal: −(x − 2) = 2 − x!",
        script:
          "Na Questão Dezesseis, vamos dominar a função modular m de x igual a módulo de x menos dois! Lembre da definição algébrica do módulo de qualquer expressão u: se u for maior ou igual a zero, o módulo deixa u quietinho; se u for negativo, o módulo multiplica u por menos um para torná-lo positivo! Aplicando isso ao recheio u igual a x menos dois, descobrimos onde ele muda de sinal: exatamente em x igual a dois! Então no item A abrimos m de x em duas fórmulas por partes: primeiro, para x maior ou igual a dois, temos x menos dois maior ou igual a zero, logo m de x é simplesmente x menos dois; segundo, para x estritamente menor que dois, temos x menos dois negativo, então o módulo inverte o sinal — menos x menos dois entre parênteses, que simplifica para menos x mais dois, ou dois menos x! Faça um teste rápido: para x igual a zero, que é menor que dois, dois menos zero dá dois — positivo e certinho!",
      },
      {
        id: "graph-v",
        label: "(b) Gráfico em 'V', Domínio ℝ & Imagem [0, ∞)",
        subtitle: "Duas semirretas encontrando no vértice (2, 0) e passando por (0, 2) e (4, 2). D_m = ℝ e Im_m = [0, +∞)!",
        script:
          "Com as duas fórmulas na mão, o item B sai direto no gráfico! Para x menor que dois desenhamos a reta decrescente y igual a dois menos x, que corta o eixo vertical em zero, dois e desce com inclinação menos um até encostar no eixo x no ponto dois, zero. A partir de x igual a dois desenhamos a reta crescente y igual a x menos dois, que sobe com inclinação mais um passando por três, um e quatro, dois! Juntas, elas formam o clássico gráfico em formato de V com vértice ou bico bem em dois, zero — que é exatamente o gráfico de módulo de x deslocado duas unidades para a direita! Como podemos calcular o módulo de qualquer real, o domínio de m é todo o conjunto R; e como distância nunca é negativa e o vértice toca a altura zero, a imagem de m é o intervalo fechado em zero até mais infinito!",
      },
      {
        id: "distance",
        label: "(c) |x − 2| = 3 e |x − 2| ≤ 3 como Distância até 2!",
        subtitle: "|x − 2| é a distância de x até o centro 2! Distância = 3 cai em −1 e 5. Distância ≤ 3 preenche o segmento [−1, 5]!",
        script:
          "E olha a beleza geométrica do item C: resolver m de x igual a três e m de x menor ou igual a três interpretando em termos de distâncias na reta! Se módulo de x é a distância até a origem, então módulo de x menos dois é a DISTÂNCIA DO NÚMERO x ATÉ O PONTO DOIS na reta real! Vamos primeiro à equação módulo de x menos dois igual a três: algebricamente, ou x menos dois vale mais três, dando x igual a cinco, ou x menos dois vale menos três, dando x igual a menos um! Geometricamente, partindo do centro dois na reta real, andamos três unidades para a direita e caímos em cinco, e andamos três unidades para a esquerda e caímos em menos um — são exatamente os dois pontos cuja distância até dois é igual a três! Agora a desigualdade módulo de x menos dois menor ou igual a três: algebricamente, equivale a menos três menor ou igual a x menos dois menor ou igual a três; somando dois em todas as partes, obtemos menos um menor ou igual a x menor ou igual a cinco! Geometricamente, é o intervalo fechado de menos um até cinco, formado por TODOS os pontos da reta cuja distância até o centro dois é no máximo três — uma bola fechada centrada em dois com raio três!",
      },
    ],
  },

  /* ===================== Q17 ===================== */
  {
    id: "list-q17",
    scenes: [
      {
        id: "deduce-cv",
        label: "(a) Modelando Massa, Volume & C(v) = 2 + 8/(1 + v)",
        subtitle: "Sal total = 10 + 2v gramas; volume total = 1 + v litros. Dividindo: C(v) = (10 + 2v)/(1 + v) = 2 + 8/(1 + v) g/L!",
        script:
          "Chegamos às duas grandes questões de modelagem aplicada da lista! Na Questão Dezessete, temos um tanque contendo inicialmente um litro de solução com dez gramas de sal dissolvido — ou seja, concentração inicial bem forte de dez gramas por litro! A esse tanque, vamos acrescentando v litros de uma segunda solução mais diluída, com concentração de dois gramas por litro. No item A, vamos construir a função concentração C de v passo a passo! Primeiro, qual é a massa total de sal depois de jogar v litros? Já tínhamos dez gramas no tanque, e cada litro novo traz dois gramas de sal, ou seja, entram dois v gramas! Logo a massa total de sal é M de v igual a dez mais dois v, em gramas. Segundo, qual é o volume final da mistura? Tínhamos um litro inicial e somamos v litros, logo o volume total é V de v igual a um mais v, em litros! Como concentração é massa total dividida pelo volume total, obtemos C de v igual a dez mais dois v, dividido por um mais v, em gramas por litro! E usando o mesmo truque da Questão Quinze — escrevendo dez mais dois v como dois vezes um mais v, mais oito — podemos reescrever numa forma maravilhosa: C de v igual a dois mais oito dividido por um mais v!",
      },
      {
        id: "phys-dom-im",
        label: "(b) Domínio Físico [0, +∞) & Imagem (2, 10]",
        subtitle: "v ≥ 0! Em v = 0 temos C(0) = 10 g/L (fechado). À medida que v cresce, 8/(1+v) > 0 cai rumo a 0 sem zerar ⇒ Im = (2, 10]!",
        script:
          "Agora o item B pede o domínio FÍSICO e a imagem de C, explicando por que a concentração final pertence a essa imagem! Embora algebricamente a fórmula funcionasse até para v negativo diferente de menos um, no mundo real não podemos acrescentar volume negativo de líquido, e o enunciado garante que o tanque comporta qualquer volume acrescentado! Logo o domínio físico é v maior ou igual a zero, isto é, o intervalo fechado em zero até mais infinito! Agora olhe para a nossa forma reescrita C de v igual a dois mais oito sobre um mais v para enxergar a imagem instantaneamente! Quando v vale zero, antes de adicionar qualquer solução, temos o valor máximo C de zero igual a dois mais oito igual a dez gramas por litro — então o extremo dez é FECHADO! À medida que v cresce de zero até mais infinito, o denominador um mais v cresce sem parar, fazendo a parcela positiva oito sobre um mais v diminuir suavemente em direção a zero — MAS sem jamais virar zero! Logo C de v desce continuamente de dez até ficar arbitrariamente perto de dois, porém sempre estritamente maior que dois! Assim, a imagem é o intervalo aberto em dois até dez fechado! Fisicamente faz total sentido: misturar uma solução de dez gramas por litro com outra de dois gramas por litro sempre resulta numa concentração intermediária entre dois e dez!",
      },
      {
        id: "solve-4-2",
        label: "(c) C = 4 g/L (v = 3 L) & Por que C = 2 g/L dá Absurdo?",
        subtitle: "2 + 8/(1+v) = 4 ⇒ 1+v = 4 ⇒ v = 3 L! Já 2 + 8/(1+v) = 2 exige 8/(1+v) = 0 ⇒ 8 = 0 (impossível com volume finito!).",
        script:
          "Vamos ao item C, com duas perguntas super diretas! Primeira: quanto volume v deve ser acrescentado para a concentração cair para quatro gramas por litro? Igualamos nossa fórmula a quatro: dois mais oito sobre um mais v igual a quatro! Subtraindo dois dos dois lados, oito sobre um mais v igual a dois! Multiplicando por um mais v, que é garantidamente positivo pois v é maior ou igual a zero, temos oito igual a dois vezes um mais v, ou seja, um mais v igual a quatro, logo v igual a TRÊS LITROS! Vamos conferir no bom senso: com três litros novos entram seis gramas de sal; total de dezesseis gramas em quatro litros dá exatamente quatro gramas por litro! Segunda pergunta: é possível obter EXATAMENTE dois gramas por litro com um volume finito? Vamos tentar resolver algebricamente: dois mais oito sobre um mais v igual a dois! Cancelando o dois dos dois lados, ficamos com oito dividido por um mais v igual a zero! Multiplicando por um mais v chegamos no absurdo oito igual a zero! Portanto é IMPOSSÍVEL atingir exatamente dois gramas por litro com qualquer quantidade finita de líquido — porque aqueles oito gramas de excesso de sal inicial nunca somem do tanque, apenas se diluem num volume cada vez maior!",
      },
      {
        id: "dilution-graph",
        label: "(d) Gráfico da Diluição & Assíntota C = 2",
        subtitle: "A curva começa em (0, 10), passa por (3, 4) e se aproxima cada vez mais da assíntota C = 2 sem jamais tocá-la!",
        script:
          "No item D esboçamos o gráfico de C de v restrito ao domínio físico v maior ou igual a zero! Observe a curva desenhada na tela: ela nasce com bolinha fechada lá no alto em zero, dez, cai rapidamente no começo porque os primeiros litros causam grande diluição — passando por um, seis e pelo nosso ponto três, quatro — e depois vai ficando cada vez mais horizontal, abraçando por cima a reta tracejada C igual a dois, que é a assíntota horizontal! Esse formato traduz perfeitamente o fenômeno físico da diluição: quanto mais solução de dois gramas por litro despejamos, menor fica o peso daquele um litro inicial de dez gramas por litro, fazendo a mistura inteira tender para dois gramas por litro no limite quando v vai para infinito!",
      },
    ],
  },

  /* ===================== Q18 ===================== */
  {
    id: "list-q18",
    scenes: [
      {
        id: "pythagoras",
        label: "(a) Pitágoras entre Fonte P(0, 3) e Sensor Q(x, 0)",
        subtitle: "Triângulo retângulo com catetos |x| e 3: r² = x² + 9 ⇒ E(x) = K / r² = K / (x² + 9)!",
        script:
          "E fechamos a nossa maratona com chave de ouro na Questão Dezoito: Iluminação e Distância! Uma fonte pontual de luz está fixa lá no alto em P igual a zero, três — ou seja, a três metros de altura sobre a origem — e um sensor desliza ao longo de todo o eixo horizontal em Q igual a x, zero! A lei física diz que a iluminação E é inversamente proporcional ao quadrado da distância r até a fonte: E igual a K sobre r ao quadrado, com K positivo constante. No item A, usamos o Teorema de Pitágoras para escrever E em função da posição x! Olhe o triângulo retângulo formado pela origem zero, zero, pela lâmpada P zero, três e pelo sensor Q x, zero: o cateto vertical mede sempre três metros, o cateto horizontal mede módulo de x, e a hipotenusa é exatamente a distância r entre a luz e o sensor! Por Pitágoras: r ao quadrado é igual a x ao quadrado mais três ao quadrado, ou seja, r ao quadrado igual a x ao quadrado mais nove! Como a fórmula física já usa r ao quadrado, não precisa nem tirar raiz — basta substituir direto: E de x igual a K dividido por x ao quadrado mais nove!",
      },
      {
        id: "max-image",
        label: "(b) Domínio ℝ, Máximo em x = 0 & Imagem (0, K/9]",
        subtitle: "Como x² ≥ 0, o denominador x² + 9 tem mínimo em x = 0 (valor 9), onde E atinge o MÁXIMO K/9! E(x) > 0 sempre ⇒ Im = (0, K/9].",
        script:
          "Agora acompanhe o item B com atenção, porque ele pede para justificarmos o máximo usando APENAS a expressão algébrica obtida, sem usar derivadas! Primeiro, o domínio físico: o enunciado diz que o sensor se move livremente por todo x real, e o denominador x ao quadrado mais nove é sempre maior ou igual a nove, jamais zera! Logo o domínio físico é todo o conjunto R! Segundo, onde a iluminação é MÁXIMA? Olhe para a fração K dividido por x ao quadrado mais nove: como o numerador K é positivo e fixo, a fração fica o MAIOR possível quando o denominador for o MENOR possível! Como x ao quadrado é sempre maior ou igual a zero para todo x real, temos x ao quadrado mais nove maior ou igual a nove, com igualdade acontecendo se, e somente se, x ao quadrado for zero, isto é, em x igual a ZERO — bem embaixo da fonte! Ali a iluminação atinge seu valor máximo E de zero igual a K sobre nove! E qual é a imagem? Como o denominador varia continuamente de nove até mais infinito, a fração K sobre x ao quadrado mais nove é sempre estritamente positiva e varia do máximo K sobre nove descendo até tender a zero sem nunca encostar em zero! Logo a imagem é o intervalo aberto em zero até K sobre nove fechado!",
      },
      {
        id: "half-power",
        label: "(c) Onde a Iluminação Cai pela Metade? (x = ±3 m)",
        subtitle: "K/(x² + 9) = (1/2)(K/9) = K/18 ⇒ x² + 9 = 18 ⇒ x² = 9 ⇒ x = −3 m ou x = +3 m!",
        script:
          "No item C queremos determinar todas as posições x onde a iluminação cai exatamente para a METADE daquela recebida em x igual a zero! Já sabemos que em x igual a zero a iluminação vale K sobre nove; então a metade disso é um meio vezes K sobre nove, isto é, K sobre dezoito! Montamos a equação: K dividido por x ao quadrado mais nove igual a K dividido por dezoito! Como K é estritamente positivo, podemos dividir os dois lados por K — repare que a resposta nem depende da potência K da lâmpada! Ficamos com um sobre x ao quadrado mais nove igual a um sobre dezoito, o que equivale a igualar os denominadores: x ao quadrado mais nove igual a dezoito! Subtraindo nove, x ao quadrado igual a nove, que entrega DUAS posições simétricas: x igual a menos três metros e x igual a mais três metros! Faz todo sentido geométrico: a três metros de distância lateral, o triângulo fica isósceles de catetos três e três, dobrando o quadrado da distância de nove para dezoito e cortando a luz exatamente pela metade!",
      },
      {
        id: "symmetry",
        label: "(d) Gráfico em Sino & Simetria Par E(−x) = E(x)",
        subtitle: "E(−x) = K/((−x)² + 9) = E(x)! Geometricamente, o sensor à esquerda (−x, 0) e à direita (+x, 0) estão à mesma distância da lâmpada!",
        script:
          "Para encerrar as dezoito questões da lista, vamos ao item D: esboçar o gráfico de E de x e explicar geometricamente sua simetria em relação ao eixo vertical! Olhe para a bela curva em formato de sino desenhada na tela: ela atinge seu pico suave lá em zero, K sobre nove, cai à meia altura K sobre dezoito exatamente em menos três e em mais três, e depois vai se aproximando suavemente do eixo horizontal E igual a zero nas duas pontas quando o sensor se afasta para mais ou menos infinito! Por que ela é perfeitamente simétrica em torno do eixo vertical y? Algebricamente, substituindo x por menos x temos E de menos x igual a K dividido por menos x ao quadrado mais nove, que é idêntico a E de x — trata-se de uma função PAR! E geometricamente o motivo é imediato: como a lâmpada está sobre o eixo vertical em zero, três, duas posições simétricas menos x, zero à esquerda e mais x, zero à direita ficam exatamente à MESMA distância r da fonte luminosa, recebendo portanto exatamente a mesma intensidade de luz! Parabéns por concluir todas as dezoito questões da lista — agora você está blindado para a P1 de Cálculo Um na UERJ!",
      },
    ],
  },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchScenePcm(apiKey, scriptText, model) {
  const prompt = `Leia em português do Brasil com voz masculina jovem, didática, calma, entusiasmada e super clara de professor universitário resolvendo uma lista de exercícios de Cálculo I (UERJ), explicando cada conta com pausas naturais de raciocínio:\n\n${scriptText}`;

  for (let attempt = 1; attempt <= 7; attempt++) {
    const activeModel = attempt >= 4 ? "gemini-3.8-flash-lite-tts" : model;
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
      const waitMs = 15000 + attempt * 10000;
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
  const pauseBuf = Buffer.alloc(Math.round(0.42 * bytesPerSec));

  const outDir = path.resolve(process.cwd(), "public", "audio", "calc-list");
  fs.mkdirSync(outDir, { recursive: true });
  const encoderScript = path.resolve(process.cwd(), "scripts", "pcm-to-mp3.py");

  const timingsPath = path.join(outDir, "timings.json");
  const timings = fs.existsSync(timingsPath)
    ? JSON.parse(fs.readFileSync(timingsPath, "utf8"))
    : {};

  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlyId = onlyArg ? onlyArg.split("=")[1] : null;
  const force = process.argv.includes("--force");

  for (const ep of EPISODES) {
    if (onlyId && ep.id !== onlyId) continue;
    const outMp3 = path.join(outDir, `${ep.id}.mp3`);
    if (!force && fs.existsSync(outMp3) && timings[ep.id]) {
      console.log(`• ${ep.id} já existe (${timings[ep.id].duration}s)`);
      continue;
    }

    console.log(
      `\n🎬 Gerando ${ep.id} (${ep.scenes.length} cenas · Gemini 3.8 TTS Charon -> MP3)...`
    );
    const pcmChunks = [];
    const sceneCues = [];
    let cursorSec = 0;

    for (let i = 0; i < ep.scenes.length; i++) {
      const sc = ep.scenes[i];
      const pcm = await fetchScenePcm(apiKey, sc.script, model);
      await sleep(5500);
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
    const tmpPcm = path.join(outDir, `${ep.id}.tmp.pcm`);
    fs.writeFileSync(tmpPcm, totalPcm);
    execFileSync(PYTHON_EXE, [encoderScript, tmpPcm, outMp3, String(sampleRate)], {
      stdio: "inherit",
    });
    fs.unlinkSync(tmpPcm);

    const mp3SizeKb = Math.round(fs.statSync(outMp3).size / 1024);
    const totalDuration = Number((totalPcm.length / bytesPerSec).toFixed(2));
    timings[ep.id] = {
      audioSrc: `/audio/calc-list/${ep.id}.mp3`,
      duration: totalDuration,
      scenes: sceneCues,
    };
    fs.writeFileSync(timingsPath, JSON.stringify(timings, null, 2) + "\n");
    console.log(
      `✅ ${ep.id}.mp3 salvo (${mp3SizeKb} KB · ${totalDuration}s exatos!)`
    );
  }

  console.log("\n🎉 Todas as 18 videoaulas de resolução da lista foram geradas!");
}

main().catch((err) => {
  console.error("Erro:", err);
  process.exitCode = 1;
});
