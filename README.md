# ÉpuraLab · Geometria Descritiva Interativa (UERJ)

Estúdio interativo **3D ⇄ 2D** desenvolvido para dominar os fundamentos da **Geometria Descritiva** (Sistema Mongeano / convenção brasileira adotada na UERJ): **Épura**, **Diedros (1º ao 4º)**, **Linha de Terra (LT)**, **Abscissa**, **Afastamento**, **Cota**, **Planos Bissetores ($\beta_{13}$ e $\beta_{24}$)**, **Retas** e o **Kit de Desenho Técnico**.

## Principais Recursos

- **Laboratório 3D ↔ 2D Sincronizado (Three.js + SVG Técnico)**
  - **Animação de Rebatimento (`0° → 90°`)**: gire o Plano Horizontal ($\pi$) no sentido horário em torno da Linha de Terra e veja o espaço tridimensional virar a folha 2D da épura em tempo real, com arcos de compasso mostrando a trajetória de cada projeção.
  - **Épura 2D Interativa Bidirecional**: arraste $A'$ ou $A$ diretamente na folha milimetrada (mouse ou toque) e observe o ponto $(A)$ se mover no espaço 3D, mudando de diedro ao vivo.
  - **Convenção Brasileira & Toggle XYZ**: convenção padrão `(Abscissa; Afastamento; Cota)` = `(x; y; z)`, alternância entre notação **Clássica UERJ (`(A), A, A'`)** e **ISO (`(A), A₁, A₂`)**, e explicação visual da inversão do eixo $Y$ na épura.
- **Trilha Guiada + Exercícios da Aula 1 da UERJ**
  - 6 capítulos progressivos com bibliografia clássica (Príncipe Júnior, Álvaro Rodrigues, Virgílio Athayde Pinheiro, Helena Lacourt, Gaspard Monge).
  - Resolução interativa passo a passo dos **Exercícios 1 e 2 da Aula 1**:
    - Ex. 1: `(A)(+2; +5; +3)` e `(B)(-2; -5; -3)` — reta `(r)` concorrente com a LT na origem `O(0; 0; 0)`.
    - Ex. 2: `(A)(+1; +2; +3)`, `(B)(+2; +3; +4)` e `(C)(+3; +4; +5)` — 3 pontos colineares paralelos ao 1º Bissetor ($\beta_{13}$).
- **Academia de Prática Ativa**
  - **Desenhe a Épura** (clique na grade para marcar $A'$ e $A$ com validação de linha de chamada e sinais), **Leia a Épura**, **Identifique o Diedro**, **Bissetores & Planos** e **Ordem `(x; y; z)`**, com Prova Real 3D e sistema de XP / estatísticas por tópico.
- **Simulador do Kit de Desenho Técnico**
  - Combinador interativo de esquadros (`45°/45°/90°` + `30°/60°/90°`) de `15°` em `15°`, comparador de grafites (`2H` / `HB 0.5mm` / `2B 0.7mm`) e diagrama ABNT de folha A4/A3 com legenda.
- **Professores com Voz (TTS) & Tutor**
  - **Prof. Monge** e **Profa. Épura** com avatares animados e narração de áudio via Gemini TTS (`/api/tts`) com fallback automático para síntese de voz `pt-BR` nativa do navegador.
- **Interface Adaptada para Desktop e Mobile (PWA)**
  - **Desktop**: estúdio split-screen 3D + 2D simultâneos + inspetor lateral.
  - **Mobile**: barra de abas inferior nativa, controle segmentado `3D | Épura 2D | Ambos` e controles grandes feitos para o polegar.

## Rodando Localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Deploy na Vercel

Basta importar o repositório na Vercel e (opcionalmente) configurar a variável de ambiente `GEMINI_API_KEY` nas configurações do projeto para habilitar voz neural Gemini TTS e o Tutor Gemini.
