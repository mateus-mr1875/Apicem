# Apicem — Claude Code Context

## Project Overview
**Apicem** is a B2C sit-stand desk (mesa sit-stand) e-commerce brand by **Riccó** (engineering heritage since 1875). The site is a local WordPress installation managed via **Local by Flywheel**.

- **GitHub:** https://github.com/mateus-mr1875/Apicem
- **Local path:** `C:\Users\Skip\Local Sites\apicem`
- **WordPress root:** `app/public/`
- **Language:** PT-BR

## Directory Structure
```
apicem/
├── app/
│   └── public/           # WordPress root
│       ├── wp-content/
│       │   ├── themes/   # Custom theme lives here
│       │   ├── plugins/
│       │   └── uploads/
│       └── wp-config.php # DB: local / root / root / localhost
├── claude-context/
│   └── apicem-brandbook-code.md  # Canonical brand + design tokens
├── conf/                 # Nginx/MySQL/PHP config (managed by Local)
└── logs/
```

## Brand Identity (summary — full details in `claude-context/apicem-brandbook-code.md`)

- **Positioning:** mid-market price, premium perception (*masstige*); "A sua mesa, do seu jeito."
- **Persona:** home-office professional on the rise; trigger = setup upgrade / health + aesthetics.
- **Brand pillars:** Bem-estar · Design · Produtividade · Engenharia/confiança (Riccó)
- **Voice:** sophisticated mentor — confident, aspirational, calm; competence over hype.
- **Riccó architecture:** endorsed brand, **low prominence** — "Engenharia Riccó · desde 1875" only in footer/warranty/about.

### Design Tokens
| Token | Value |
|---|---|
| `--linho` | `#F5EFE6` (page background) |
| `--creme` | `#FBF8F3` (cards/surfaces) |
| `--areia` | `#E7DBC9` (warm neutral, dividers) |
| `--argila` | `#BD5D3A` (primary accent — CTAs, links) |
| `--argila-fundo` | `#9A4A2D` (hover/pressed) |
| `--ambar` | `#E8972C` (vibrant, sparingly — badges) |
| `--cafe` | `#2B2420` (body text, dark backgrounds) |
| `--grafite` | `#141210` (logo/brand black) |
| `--cinza` | `#8C8378` (muted/secondary text) |

**Fonts:** `Orelega One` (display/headlines) + `Hanken Grotesk` (all UI/body, 300–700).
**Usage ratio:** ~70% neutrals · ~25% dark · ~5% accents.

### Key Rules
- CTA copy: prefer "Monte a sua" / "Personalize a sua mesa" over "Comprar agora"
- Trust badge: "Engenharia Riccó · desde 1875" — footer/checkout only
- Tagline: **"Viva o ápice da sua carreira."**
- Do NOT invent technical specs (height, load, motor, warranty) — use marked placeholders
- Painted finishes = phase 2; do not show as available at launch
- 9 launch finishes are all melamine (high durability)

## WordPress Setup
- **DB:** name `local`, user `root`, password `root`, host `localhost`
- **Stack:** Nginx + PHP (managed by Local by Flywheel)
- **Themes:** twentytwentythree/four/five present; custom Apicem theme to be built

## Development Workflow
- Edit files in `app/public/wp-content/themes/` for theme work
- WordPress is served via Local by Flywheel — start/stop through the Local app
- Git tracks the full project root; `wp-config.php` contains local-only credentials (already using local/root defaults, low sensitivity but keep in mind)

## Pending Data (fill when available)
- Technical specs (height range, load capacity, motor brand, noise level)
- Final pricing
- Shipping / exchange policy
- Definitive product names
- Warranty terms
