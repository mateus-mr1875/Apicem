# Prompt — Plan Mode (Claude Code): MVP do e-commerce Apicem

> Cole este arquivo no **plan mode** do Claude Code. Ele já contém todo o contexto, as decisões travadas, o modelo de dados e os critérios de aceite. **Não comece a codar antes de apresentar o plano e ter o meu OK.**

---

## 0. Antes de qualquer coisa — leia o contexto

1. Leia **`apicem-brandbook-code.md`** (design system canônico: cores, tipografia, acabamentos, componentes, voz) e use a **skill `apicem-brand`** se estiver disponível. Esses são a fonte de verdade visual e de copy.
2. Leia também `apicem-conversa-01-contexto.md` (fundação da marca) se estiver no projeto.
3. **Idioma de tudo:** PT-BR. **Voz:** mentor sofisticado (confiante, aspiracional, calmo; eleva sem arrogância). CTA padrão: "Monte a sua" / "Personalize a sua mesa".

---

## 1. Objetivo e escopo

Construir o **MVP do site/loja da Apicem** — marca B2C de **mesas sit-stand (altura ajustável) para home office**, da Riccó. O coração do site é um **configurador em formato wizard** que termina enviando um pedido de **orçamento via WhatsApp** (lead-gen; sem checkout no MVP).

**Faseamento (projete pensando nisso, mas só construa a Fase MVP agora):**
- **Fase MVP (esta entrega):** configurador → orçamento no WhatsApp. **Sem preços** no site.
- **Fase 2:** preço responsivo (atualiza a cada escolha) + linha de acabamentos pintados. → deixe o modelo de dados pronto pra receber um campo `preco` por opção, sem refatorar.
- **Fase 3:** checkout no próprio site.

---

## 2. Stack e arquitetura de deploy ("subir fácil")

- **Plataforma:** WordPress. **Desenvolver localmente** (assumir **LocalWP**) e subir para produção em `apicem.com.br`.
- **Estratégia de entrega — dois artefatos independentes do conteúdo:**
  1. **Plugin próprio `apicem-configurador`** (o app do configurador + a tela de administração). Registra um **shortcode `[apicem_configurador]`** e um **bloco Gutenberg** que é apenas um invólucro do shortcode. Subir = *Plugins → Adicionar → Enviar .zip*.
  2. **Tema filho enxuto `apicem-tema`** (a partir de um tema base leve e atual, ex.: um tema de blocos padrão do WP) que carrega os tokens da marca (cores, **Orelega One + Hanken Grotesk**) e estiliza as páginas institucionais. Subir = enviar .zip do tema.
- **Por quê:** o configurador fica independente do tema (sobrevive a troca/atualização de tema) e o deploy é só upload de zip — **sem migração de banco**.
- **Sem dependências pagas.** Não usar page builders (Elementor) nem plugins premium. Front-end do configurador em **JS vanilla ou um build leve** (sem framework pesado); se usar build, entregar o bundle já compilado dentro do plugin.
- Entregar **README** com passo a passo de instalação local e de deploy (gerar os dois .zip).

---

## 3. PILAR CRÍTICO — tudo editável no admin do WordPress

O lojista precisa **gerenciar o configurador sem tocar em código**: adicionar/remover/reordenar opções, **pular/ativar passos**, trocar textos e imagens, e configurar integrações. Arquitetura WP-native sugerida (sem ACF/plugins pagos; usar **Settings API + Custom Post Types com meta boxes**):

**Custom Post Types (cada item com ativar/desativar e ordenação por arrastar — `menu_order`):**
- `apicem_tamanho` — campos: rótulo (título), `largura_cm`, `profundidade_cm`, `ativo`, ordem. *(reservar `preco` p/ fase 2)*
- `apicem_borda` — campos: nome (título), `descricao`, `perfil` (`reta` | `chanfrada` | `arredondada`), `imagem` opcional, `ativo`, ordem.
- `apicem_acabamento` — campos: nome (título), `hex`, `tipo` (`madeira` | `solido`), `textura` (imagem opcional p/ grão), `ativo`, ordem.

**Página de configurações (menu "Apicem"):**
- **Passos:** lista dos 7 passos com **toggle ativar/desativar**, **reordenar**, e edição de `kicker` / `título` / `texto de apoio` de cada um. (atende "pular passos")
- **Hero (passo 1):** H1, H2, texto do CTA, **upload de imagem/vídeo**.
- **Caixa elétrica:** ativar passo, rótulo, copy. *(reservar `preco` p/ fase 2)*
- **WhatsApp:** número comercial + **template da mensagem** (com variáveis).
- **Formulário/Lead:** quais campos exibir, rótulos, **texto de consentimento LGPD** e link da Política de Privacidade.
- **Integrações:** campo para **GA4 Measurement ID** e **Meta Pixel ID**.
- **CEP/Entrega:** ativar autocomplete. *(reservar regras de frete p/ fase 2)*

**Como o front-end consome:** expor a configuração via **um endpoint REST `/wp-json/apicem/v1/config`** (ou `wp_localize_script` com um único JSON) que entrega só os itens `ativo`, na ordem definida. O front-end **nunca tem dados hard-coded** — tudo vem do admin. Os valores abaixo (seções 6–8) entram como **seed/conteúdo inicial** (popular na ativação do plugin), não como código fixo.

---

## 4. Design system (resumo operacional — detalhe em `apicem-brandbook-code.md`)

- **Cores:** fundo `--linho #F5EFE6`; superfícies `--creme #FBF8F3`; neutro `--areia #E7DBC9`; **acento principal `--argila #BD5D3A`** (CTAs/links), hover `--argila-fundo #9A4A2D`; acento vibrante pontual `--ambar #E8972C`; texto `--cafe #2B2420`; preto da marca `--grafite #141210`; muted `--cinza #8C8378`; hairline `rgba(43,36,32,.14)`. Proporção ~70% neutros / 25% café / 5% acentos.
- **Tipografia:** `Orelega One` (display/marca — H1/H2, números de seção, **só títulos**) + `Hanken Grotesk` 300–700 (corpo/UI). Import via Google Fonts. Escala em `clamp` (ver brandbook).
- **Layout/tokens:** `--container 1080px`; seções 120px (80px mobile); raios 12/18/22/40px (pill p/ botões); sombras suaves; breakpoint mobile `max-width: 760px`; motion reveal-on-scroll suave (`translateY 26px→0`, `.9s`).
- **Botão primário:** fundo argila, texto linho, pill, peso 600, hover argila-fundo. Secundário: borda café, fundo transparente.
- **Selo de confiança (rodapé/checkout):** "Engenharia Riccó · desde 1875" discreto.
- Textura: grão de papel sutil (SVG feTurbulence ~5%) como overlay, com parcimônia.
- **Logo:** wordmark (`apicem-logo-grafite.png` / `-linho.png`) onde houver espaço; símbolo "A" isolado (`apicem-simbolo-A-*.png`) p/ favicon/ícone/selo. Grafite sobre claro; linho/branco sobre escuro. Nunca distorcer/recolorir.

---

## 5. Estrutura do site (MVP)

1. **Landing / Configurador** (home) — contém o wizard de 7 passos (seção 6). É a página principal.
2. **Sobre** — história da marca + Riccó (copy na seção 9).
3. **FAQ / Garantia** — perguntas frequentes (copy na seção 9; specs como placeholder marcado).
4. **Política de Privacidade (LGPD)** — página simples (pode começar com placeholder estruturado).
- **Header:** logo (wordmark) + nav minimalista (Personalizar / Sobre / FAQ) + CTA "Monte a sua".
- **Footer institucional:** logo, "Engenharia Riccó · desde 1875", contato placeholder, links (Sobre, FAQ, Privacidade), redes (placeholder).

---

## 6. O CONFIGURADOR (peça central)

**Formato:** **wizard — um passo por vez**, com botões avançar/voltar e um **stepper visível (1–7)** que mostra progresso e permite voltar a passos já feitos. Não permitir pular à frente passos obrigatórios não preenchidos.

**Layout:**
- **Desktop:** duas colunas. **Esquerda = preview da mesa (fixo/sticky)**, ocupando ~50–55%. **Direita = passo atual** (kicker → H2 → texto de apoio → opções → navegação).
- **Mobile (≤760px):** o preview vai pro **topo (sticky)** e o passo atual fica abaixo. Nada de layout em colunas no mobile.
- Cada escolha **atualiza o preview instantaneamente** (feedback imediato = efeito IKEA, constrói desejo/compromisso).

**Os 7 passos** (rótulos/copy iniciais — todos editáveis no admin):

1. **Herói / abertura.** Kicker `MESA SIT-STAND PERSONALIZÁVEL`. **H1:** "A sua mesa, do seu jeito." **H2/lead:** "Mesa de altura ajustável, feita sob medida para o seu espaço. Você escolhe o tamanho, a borda e o acabamento — e nós entregamos. Engenharia Riccó, desde 1875." Mídia: **placeholder on-brand** (imagem/vídeo de detalhe do produto — usar bloco placeholder elegante até receber o asset). **CTA:** "Monte a sua".
2. **Tamanho** (3 opções). Kicker `02 · TAMANHO`. Título: "Escolha o tamanho ideal para o seu espaço". Apoio: "Profundidade de 70 cm em todas — escolha a largura." Opções (seed): **Compacta 120×70 cm**, **Padrão 140×70 cm**, **Ampla 160×70 cm**.
3. **Borda do tampo** (3 opções). Kicker `03 · BORDA`. Título: "Escolha o perfil da borda". Apoio: "O perfil da borda muda o caráter da mesa." Opções (seed — nomes Apicem propostos, editáveis):
   - **Linear** — perfil reto, linhas retas e arquitetônicas. *(perfil `reta`; ref. Riccó "C.O.")*
   - **Bisel** — chanfro a 45°, leitura fina e contemporânea. *(perfil `chanfrada`; ref. Riccó "Ofis")*
   - **Curva** — cantos arredondados (raio ~3 cm), toque suave e ergonômico. *(perfil `arredondada`; ref. Riccó "R30")*
4. **Acabamento do tampo** (9 opções). Kicker `04 · ACABAMENTO`. Título: "Escolha o acabamento do tampo". Apoio: "Nove acabamentos melamínicos de alta resistência." Swatches circulares (28–40px), selecionado com `outline: 2px var(--argila); outline-offset: 2px`; mostrar o **nome ao passar/selecionar**. Dados na seção 7.
5. **Caixa elétrica** (sim/não). Kicker `05 · ENERGIA`. Título: "Quer uma caixa elétrica integrada?". Apoio: "Tomadas e passagem de cabos embutidas no tampo — a fiação corre escondida pela estrutura até o chão." Toggle Sim/Não; quando Sim, **mostrar a caixa no preview** (ver seção 8).
6. **CEP / entrega.** Kicker `06 · ENTREGA`. Título: "Onde você quer receber?". Apoio: "Informe seu CEP." Campo de CEP com **autocomplete via API ViaCEP** (`https://viacep.com.br/ws/{cep}/json/`) preenchendo logradouro/bairro/cidade/UF (campos read-only exibidos; número/complemento opcionais). No MVP o CEP **só é coletado** (não calcula frete — reservado p/ fase 2).
7. **Resumo + envio (popup).** Kicker `07 · ORÇAMENTO`. Abre um **popup/modal** com o **resumo de tudo que foi selecionado** + o preview final. Abaixo, **formulário**: Nome, Telefone, E-mail e **checkbox de consentimento LGPD** (texto + link p/ Política). CTA: "Receber meu orçamento no WhatsApp". Ao enviar: validar campos, **disparar o evento de conversão** (seção 10) e abrir o **WhatsApp** (seção 11) com a mensagem pré-preenchida.

---

## 7. Dados — acabamentos (seed, 9 melamínicos)

Todos melamínicos (alta resistência). Hex são para **swatch de UI** (aprox. visual), não cor industrial. Para os de **tipo `madeira`**, aplicar leve **textura de grão** por cima do hex no preview e no swatch.

| slug | nome | hex | tipo |
|---|---|---|---|
| carvalho-avela | Carvalho Avelã | #D3A584 | madeira |
| carvalho-prata | Carvalho Prata | #DDB999 | madeira |
| freijo-puro | Freijó Puro | #C28960 | madeira |
| nogueira-caiena | Nogueira Caiena | #B47553 | madeira |
| gianduia-puro | Gianduia Puro | #ADA191 | solido |
| cinza-original | Cinza Original | #A4A095 | solido |
| argila-acab | Argila | #F1F0E0 | solido |
| branco | Branco | #FFFFFF | solido |
| grafite-acab | Grafite | #4A4845 | solido |

> Acabamentos **pintados = fase 2**. Não exibir como disponíveis no lançamento.

---

## 8. Preview da mesa (renderização parametrizada)

**MVP = ilustração estilizada em SVG/CSS (sem fotos)** que reage a todas as escolhas. Fase 2 troca por perspectiva fotográfica/render.

- **Vista:** **planta (top-down)** do tampo como elemento principal — é a superfície que muda (acabamento, borda, tamanho, caixa elétrica), o que reflete diretamente as escolhas. Opcional: um pequeno acento estático em isométrico/lateral só pra comunicar "sit-stand"/altura ajustável (sem precisar morfar).
- **Tamanho:** muda a **proporção** do retângulo do tampo conforme largura×70 (120/140/160).
- **Borda:** muda o **perfil dos cantos/aresta**: `reta` = cantos vivos; `chanfrada` = aresta com bisel (sugerir com linha/sombra interna a 45°); `arredondada` = `border-radius` ~ raio 3 cm proporcional.
- **Acabamento:** preenche o tampo com o **hex**; se `tipo = madeira`, sobrepor textura de grão sutil.
- **Caixa elétrica (quando Sim):** desenhar um **retângulo arredondado pequeno embutido no tampo**, **deslocado do centro horizontal** e posicionado **junto à borda mais distante do usuário** (borda superior na vista top-down). Visual discreto, cor levemente mais escura que o tampo, com leve sombra de recorte.
- Tudo deve animar suavemente nas transições entre escolhas.

---

## 9. Copy (rascunho on-brand — editável no admin/conteúdo)

**Taglines (usar com parcimônia):** "Viva o ápice da sua carreira." · "Uma mesa à altura da sua rotina." · "A sua mesa, do seu jeito."

**Página Sobre (paráfrase dos fatos da Riccó — Apicem protagonista, Riccó como engenharia/herança):**
> A Apicem nasce de uma casa de engenharia de móveis com **150 anos**. A história da Riccó começa na Itália, com domínio artesanal da madeira, e ganha o Brasil em **1875**, quando Ernesto Riccó funda a marca em São Paulo. Ao longo de um século e meio, a Riccó foi pioneira — da tecnologia em cadeiras corporativas à primeira máquina CNC de seu tipo no país — sempre com frota própria e obsessão por acabamento. A Apicem traz essa engenharia para o seu home office, no formato de uma mesa sit-stand que você monta do seu jeito.

*(Ajustar tom conforme o brandbook; manter Riccó endossante e discreta, mas aqui a história pode ser contada com mais profundidade.)*

**FAQ (perguntas; respostas com specs como `[PLACEHOLDER — confirmar]` até receber os dados):**
- O que é uma mesa sit-stand? (resposta livre, on-brand)
- Qual a faixa de altura ajustável? `[PLACEHOLDER]`
- Qual a capacidade de carga? `[PLACEHOLDER]`
- O motor é silencioso? `[PLACEHOLDER]`
- Qual a garantia? `[PLACEHOLDER]` — reforçar "Garantia de quem fabrica há 150 anos".
- Prazo de entrega e frete? `[PLACEHOLDER]`
- Política de troca/devolução? `[PLACEHOLDER]`
- Como funciona o orçamento? (explicar o fluxo até o WhatsApp)

> **Regra:** **não inventar specs técnicas** (altura, carga, motor, garantia, frete). Usar placeholders claramente marcados.

**Nome comercial do produto:** usar **"Mesa Apicem"** como provisório (sinalizar como `[NOME PROVISÓRIO]`).

---

## 10. Rastreamento (marketing-led)

- Carregar **GA4** e **Meta Pixel** apenas se os IDs estiverem preenchidos no admin (campos placeholder por enquanto).
- **Eventos:** `page_view`, `configurador_iniciado` (CTA do herói), `passo_visto` (1–7), `tamanho_selecionado`, `borda_selecionada`, `acabamento_selecionado`, `caixa_eletrica_selecionada`, `cep_preenchido`, e **`lead_enviado`** (conversão principal → também `Lead`/`Contact` no Pixel).
- Respeitar o consentimento LGPD: só disparar rastreio após consentimento, conforme boa prática.

---

## 11. Envio para o WhatsApp

- Botão final monta uma URL **`https://wa.me/{NUMERO}?text={mensagem}`** (`NUMERO` vem do admin; **placeholder até o número existir** — se vazio, desabilitar o CTA e mostrar aviso discreto no admin).
- **Template da mensagem (editável):**
  ```
  Olá! Montei a minha Mesa Apicem e queria um orçamento.
  • Tamanho: {tamanho}
  • Borda: {borda}
  • Acabamento: {acabamento}
  • Caixa elétrica: {sim_nao}
  • CEP: {cep} — {cidade}/{uf}
  Nome: {nome} · E-mail: {email} · Telefone: {telefone}
  ```
- Fazer `encodeURIComponent` na mensagem. Abrir em nova aba.

---

## 12. Acessibilidade e "não fazer"

- Contraste AA: texto `--cafe` sobre claros; botão argila+linho ✓. **Não** usar âmbar/areia como fundo de texto pequeno. Âmbar só como faísca pontual.
- Navegação por teclado no wizard e no modal; foco visível; `aria` nos passos/stepper; swatches como botões acessíveis com `aria-label` = nome do acabamento.
- **Não** tratar a Riccó como protagonista. **Não** usar tom techy/gamer/industrial. Manter calor + contenção.
- **Não** inventar specs nem preços. **Não** vender acabamentos pintados (fase 2).
- **Não** hard-codar opções no front — tudo vem do admin (seção 3).

---

## 13. Entregáveis e estrutura de arquivos (sugestão)

```
apicem-configurador/            (plugin)
  apicem-configurador.php       (bootstrap, CPTs, REST, shortcode, bloco, seed na ativação)
  includes/                     (admin settings, meta boxes, REST controller)
  assets/                       (css/js do front; bundle se houver build)
  blocks/                       (bloco Gutenberg invólucro)
  README.md
apicem-tema/                    (tema filho)
  style.css  functions.css  (tokens da marca, fontes)
  templates/ ou page-*.php
```

- Entregar os **dois .zip** prontos (ou um script `npm run build`/`zip` que os gere) + **README** com instalação local (LocalWP) e deploy.

---

## 14. Critérios de aceite (MVP)

1. Wizard de 7 passos funcional, com preview ao vivo (desktop: esquerda fixa; mobile: topo fixo).
2. Preview SVG reage corretamente a tamanho, borda, acabamento (com grão nas madeiras) e caixa elétrica (posição correta).
3. **100% das opções e textos gerenciáveis no admin** (CPTs + página de configurações): adicionar/remover/reordenar, ativar/desativar passos, trocar mídia, editar copy, IDs de rastreio, número e mensagem do WhatsApp.
4. CEP com autocomplete ViaCEP funcionando.
5. Popup final com resumo + form (nome/telefone/e-mail + consentimento LGPD) → abre WhatsApp com a mensagem montada.
6. Páginas Sobre, FAQ/Garantia e Privacidade publicadas e on-brand.
7. Tokens da marca aplicados (cores/tipografia/logo); responsivo; AA de contraste.
8. Dois .zip (plugin + tema) + README de deploy. Arquitetura pronta p/ plugar **preço** na fase 2 sem refatorar.

---

## 15. Como conduzir (plan mode)

1. **Apresente um plano** (estrutura de arquivos, modelo de dados, ordem de implementação, riscos) e **espere aprovação** antes de codar.
2. Construa **local primeiro**. Priorize: (a) plugin com CPTs+settings+REST e seed; (b) front-end do wizard + preview; (c) integrações (CEP/WhatsApp/tracking); (d) tema filho + páginas institucionais.
3. Sinalize qualquer ponto onde faltem dados reais (specs, número do WhatsApp, IDs) com placeholder e **liste no final** o que preciso fornecer.

---

### Dados ainda pendentes (eu forneço depois — usar placeholder)
- Número do WhatsApp comercial · GA4 ID · Meta Pixel ID · specs da mesa (altura/carga/motor/garantia) · frete/troca · nome comercial definitivo · mídia do herói · vetor do logo (SVG).
