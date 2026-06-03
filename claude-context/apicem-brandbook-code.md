# Apicem — Design System & Brand Context (para Claude Code)

> **Arquivo de contexto canônico para o plan mode.** Cole/leia este arquivo antes de gerar qualquer artefato da Apicem (páginas, componentes, copy, e-mails, anúncios). Substitui o `apicem-brief-de-marca.md` como fonte de verdade — inclui as decisões travadas e os *design tokens* prontos.
> Marca: **Apicem** (mesas sit-stand B2C, por Riccó) · Idioma: PT-BR.

---

## 1. Snapshot da marca

- **One-liner:** a mesa sit-stand feita do seu jeito, para quem está subindo na carreira.
- **Posicionamento:** mid-market no preço, premium na percepção (*masstige*).
- **Território:** “A sua mesa, do seu jeito.” — exclusividade através da personalização (o que o importado de SKU fixo não entrega).
- **Moat:** personalização (borda, tamanho, acabamento, caixa elétrica) a baixo custo operacional, via fábrica Riccó.
- **Persona:** profissional de home office em ascensão (recém-promovido), quer se diferenciar, cuida de saúde + estética; gatilho = upgrade/estética do setup.
- **Pilares (ordem):** 1) Bem-estar · 2) Design · 3) Produtividade · 4) Engenharia/confiança (Riccó).
- **Arquitetura:** endossada por Riccó, **baixa proeminência** — “Engenharia Riccó · desde 1875” só em rodapé/garantia/sobre. A Apicem é protagonista.
- **Voz:** mentor sofisticado — confiante, aspiracional, eleva sem arrogância; calmo; a competência fala mais que o hype.

---

## 2. Regras de copy (voz)

**Faça:** frases curtas e elegantes · falar de *você* e do *seu espaço* · convidar (“eleve”, “viva”, “monte a sua”) · provar com fatos (garantia, materiais, 150 anos).
**Não faça:** jargão técnico desnecessário · empresa em 1º plano · pressão/urgência falsa · superlativos vazios (“o melhor do mundo”).

**Convenções de CTA:** preferir “Monte a sua” / “Personalize a sua mesa” a “Comprar agora”.
**Prova de confiança (rodapé/checkout):** “Engenharia Riccó · desde 1875” · “Garantia de quem fabrica há 150 anos”.

**Taglines** (principal em negrito):
- **Viva o ápice da sua carreira.**
- Uma mesa à altura da sua rotina.
- Sua carreira sobe. Sua mesa acompanha.
- Trabalhe na sua altura.

---

## 3. Design tokens — cores

```css
:root{
  /* base / neutros quentes */
  --linho:        #F5EFE6;  /* fundo base da página */
  --creme:        #FBF8F3;  /* cards, superfícies elevadas */
  --areia:        #E7DBC9;  /* neutro quente, divisores suaves */
  /* acentos */
  --argila:       #BD5D3A;  /* acento PRINCIPAL (CTAs, links, destaques) */
  --argila-fundo: #9A4A2D;  /* hover/pressed do argila */
  --ambar:        #E8972C;  /* acento VIBRANTE, pontual (badges, selos, promo) */
  /* escuros / texto */
  --cafe:         #2B2420;  /* texto principal e fundos escuros */
  --grafite:      #141210;  /* preto da marca / logo */
  --cinza:        #8C8378;  /* texto secundário (muted) */
  --linha:        rgba(43,36,32,.14); /* bordas/hairlines */
}
```

```json
{
  "color": {
    "linho":"#F5EFE6","creme":"#FBF8F3","areia":"#E7DBC9",
    "argila":"#BD5D3A","argilaFundo":"#9A4A2D","ambar":"#E8972C",
    "cafe":"#2B2420","grafite":"#141210","cinza":"#8C8378"
  }
}
```

**Proporção de uso:** ~70% neutros (linho/creme/areia) · ~25% café/escuro · ~5% acentos (argila e, pontualmente, âmbar). A cor “real” vem dos acabamentos do produto — a UI é moldura neutra.
**Contraste:** texto sempre `--cafe` sobre claros; `--linho` sobre escuros. Não usar âmbar para texto longo (só destaque). Argila como texto só em títulos curtos/links.

---

## 4. Design tokens — acabamentos (produto)

Os **9 de lançamento são todos melamínicos** (alta resistência/durabilidade). São o núcleo do configurador.

```json
{
  "finishesLaunch": [
    {"slug":"carvalho-avela",  "nome":"Carvalho Avelã",  "hex":"#D3A584", "tipo":"madeira"},
    {"slug":"carvalho-prata",  "nome":"Carvalho Prata",  "hex":"#DDB999", "tipo":"madeira"},
    {"slug":"freijo-puro",     "nome":"Freijó Puro",     "hex":"#C28960", "tipo":"madeira"},
    {"slug":"nogueira-caiena", "nome":"Nogueira Caiena", "hex":"#B47553", "tipo":"madeira"},
    {"slug":"gianduia-puro",   "nome":"Gianduia Puro",   "hex":"#ADA191", "tipo":"solido"},
    {"slug":"cinza-original",  "nome":"Cinza Original",  "hex":"#A4A095", "tipo":"solido"},
    {"slug":"argila-acab",     "nome":"Argila",          "hex":"#F1F0E0", "tipo":"solido"},
    {"slug":"branco",          "nome":"Branco",          "hex":"#FFFFFF", "tipo":"solido"},
    {"slug":"grafite-acab",    "nome":"Grafite",         "hex":"#4A4845", "tipo":"solido"}
  ],
  "finishesPainted": {"status":"fase-2-teste", "nota":"linha de pintura entra depois, como teste de conversão vs. risco de logística reversa"}
}
```

> Nota: os hex de acabamento são para *swatches de UI* (aproximação visual amostrada do mostruário), não especificação industrial de cor. Para madeiras, aplicar leve textura de grão por cima do hex.

---

## 5. Design tokens — tipografia

```css
/* Import (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Orelega+One&family=Hanken+Grotesk:wght@300..800&display=swap');

--font-display: "Orelega One", Georgia, serif;   /* a fonte do LOGO; títulos e momentos de marca */
--font-body:    "Hanken Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

- **Orelega One** = display only (alto impacto, pouco texto): H1/H2, headlines, taglines, números de seção. Peso único (400).
- **Hanken Grotesk** = todo o funcional: corpo, UI, botões, legendas. Pesos 300–700.
- **Escala** (clamp, responsiva): H1 `clamp(32px,5vw,56px)` · H2 `clamp(28px,4vw,44px)` · lead `clamp(18px,2.1vw,23px)` · body `16px/1.6` · small `13–14px`.
- Hierarquia limpa, muito *whitespace*. Títulos com `line-height` ~1.06 e `letter-spacing` 0.

---

## 6. Tokens — espaço, raio, sombra, layout, motion

```css
--container: 1080px;          /* largura máx. de conteúdo */
--space-section: 120px;       /* padding vertical de seção (80px em mobile) */
--radius-sm: 12px; --radius: 18px; --radius-lg: 22px; --radius-pill: 40px;
--shadow-soft: 0 14px 30px -12px rgba(43,36,32,.5);
--shadow-float: 0 30px 60px -30px rgba(43,36,32,.30);
--hairline: 1px solid var(--linha);
/* breakpoint mobile: max-width 760px */
/* motion: reveal on scroll — translateY(26px)->0, opacity 0->1, .9s cubic-bezier(.2,.7,.2,1); stagger 60–160ms */
```

Textura: leve grão de papel (SVG feTurbulence) a ~5% de opacidade como overlay fixo dá calor sem ruído visual. Usar com parcimônia.

---

## 7. Logo & assets

Arquivos disponíveis (PNG transparente):
- `apicem-logo-grafite.png` / `apicem-logo-linho.png` — **wordmark** (uso preferencial; proporção ~3:1).
- `apicem-simbolo-A-grafite.png` / `apicem-simbolo-A-linho.png` — **símbolo “A”** isolado (ícone/app/avatar/favicon/selo; espaços pequenos ou quadrados).

Regras:
- **Wordmark sempre que houver espaço horizontal**; “A” isolado em formatos compactos/quadrados.
- Versão **grafite** (#141210) sobre fundos claros; **linho** (#F5EFE6) ou branco sobre escuros/foto/acabamento (maior contraste).
- Área de proteção mínima = altura do “A”. Tamanho mínimo do wordmark: 96px / 24mm de largura.
- Co-branding (institucional/rodapé): wordmark + “por Riccó · desde 1875” em caixa-alta discreta.
- **Não:** distorcer, comprimir, rotacionar, recolorir fora da paleta, aplicar sombra/contorno.

---

## 8. Direção de componentes (e-commerce)

- **Botão primário:** fundo `--argila`, texto `--linho`, `border-radius: var(--radius-pill)`, peso 600; hover → `--argila-fundo`. Secundário/ghost: borda `--cafe`, fundo transparente.
- **Configurador (peça-chave):** o fluxo borda → tamanho → acabamento → caixa elétrica é o “momento mágico”. Acabamentos como *swatches* circulares (28–40px), selecionado com `outline: 2px var(--argila); outline-offset:2px`. Mostrar nome do acabamento ao passar/selecionar. Tratar como herói visual.
- **Card de produto:** superfície `--creme`, `--hairline`, `--radius`; imagem 4:3; nome em `--font-display`; preço em `--font-display`; linha de swatches; CTA “Personalizar”.
- **Seções:** ritmo editorial — *kicker* (número + rótulo em caixa-alta, cor argila) → H2 display → lead → conteúdo. Separadores `--hairline`.
- **Selo de confiança:** “Engenharia Riccó · desde 1875” discreto no rodapé/checkout; opção de selo circular com o “A”.
- **Promo/destaque:** âmbar como faísca pontual (badge, tarja), nunca dominante.

---

## 9. Acessibilidade & não-fazer

- Garantir contraste AA: texto `--cafe` sobre `--linho/creme/areia` ✓. Botão argila+linho ✓. Não usar `--ambar` ou `--areia` como fundo de texto pequeno.
- Não inventar specs técnicas da mesa (altura, carga, motor, garantia) — usar placeholders marcados até receber os dados reais.
- Não tratar a Riccó como protagonista. Não usar tom techy/gamer/industrial. Manter calor + contenção.
- Acabamentos de pintura = fase 2; não vender como disponíveis no lançamento.

---

*Pendências de dados (preencher quando disponíveis): specs técnicas da mesa, preço final, política de troca/frete, nomes definitivos de produto, regras de garantia.*
