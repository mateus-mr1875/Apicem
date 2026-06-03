# Apicem Configurador — Plugin WordPress

Wizard de personalização de mesa sit-stand com envio de orçamento via WhatsApp.

## Instalação (Local by Flywheel)

1. No Local, certifique-se que o site está rodando.
2. Acesse `wp-content/plugins/` e coloque a pasta `apicem-configurador/` lá.
3. No painel WordPress: **Plugins → Plugins instalados → Ativar** "Apicem Configurador".
4. Na ativação, o seed de dados é inserido automaticamente (9 acabamentos, 3 tamanhos, 3 bordas).

## Instalação via ZIP (produção)

```powershell
# No PowerShell, a partir da raiz do projeto
Compress-Archive -Path "app\public\wp-content\plugins\apicem-configurador" `
  -DestinationPath "dist\apicem-configurador-v1.0.0.zip"
```

No painel: **Plugins → Adicionar → Enviar plugin** → selecione o `.zip`.

## Uso do shortcode

Crie uma página e adicione o shortcode:

```
[apicem_configurador]
```

Ou use o bloco Gutenberg **"Configurador Apicem"** (categoria: Widgets).

## Admin

Após ativar, o menu **Apicem** aparece no painel:

| Submenu | Descrição |
|---|---|
| Configurações → Wizard | Ativar/desativar e editar textos de cada passo |
| Configurações → Herói | H1, H2, CTA, imagem/vídeo |
| Configurações → Caixa Elétrica | Toggle + copy do passo 5 |
| Configurações → WhatsApp | Número e template da mensagem |
| Configurações → Lead / LGPD | Campos do formulário e consentimento |
| Configurações → Integrações | GA4 ID + Meta Pixel ID |
| Configurações → Entrega | Autocomplete de CEP (ViaCEP) |
| Tamanhos | Gerenciar opções de largura (arrastar para reordenar) |
| Bordas | Gerenciar perfis de borda |
| Acabamentos | Gerenciar acabamentos (hex + tipo) |

## REST Endpoint

```
GET /wp-json/apicem/v1/config
```

Retorna toda a configuração atual em JSON (útil para depuração e futuros headless).

## Variáveis do template WhatsApp

`{tamanho}` `{borda}` `{acabamento}` `{sim_nao}` `{cep}` `{cidade}` `{uf}` `{nome}` `{email}` `{telefone}`

## Dados pendentes (preencher no admin)

- Número do WhatsApp (Configurações → WhatsApp)
- GA4 Measurement ID (Configurações → Integrações)
- Meta Pixel ID (Configurações → Integrações)
- Imagem/vídeo do herói (Configurações → Herói)

## Fase 2 (sem refatoração necessária)

- Campo `preco` já existe em `apicem_tamanho` e `apicem_caixa_eletrica` (Settings)
- Campo `preco` retornado pelo REST endpoint — basta ler e exibir no front-end
- Acabamentos pintados: adicionar como `apicem_acabamento` normalmente

## Reset de dados (dev only)

Configurações → rolar até o final → "Redefinir para padrão".
