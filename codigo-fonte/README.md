# Clube VIP de Ofertas — landing page

Site estático (HTML + CSS + JavaScript puro). Sem build, sem dependências, sem servidor próprio.

```
index.html          estrutura da página
css/style.css       estilos (design clean, mobile first)
js/config.js        ⚙️ TODAS as configurações (checkout, vídeo, prints, rastreamento, contatos)
js/app.js           demonstração animada (bot + scroll), efeitos sonoros (Web Audio), vídeo, resultados
assets/images/      imagens (prints, produtos)
assets/videos/      vídeo local (opcional; o vídeo atual é da Wistia)
favicon.svg         ícone da aba
deploy/_headers     cabeçalhos/cache (Netlify e Cloudflare Pages)
build.sh            gera a pasta final: ./build.sh  →  ../site-pronto-para-hospedar
tests/smoke.py      teste rápido opcional (Playwright)
```

## Rodar localmente
Abra `index.html` no navegador, ou sirva a pasta: `python3 -m http.server 8000` → http://localhost:8000

## Editar (tudo em `js/config.js`)
| Campo | O que fazer |
|---|---|
| `checkoutUrl` | link de pagamento da Zuptos. Os parâmetros UTM da visita são repassados ao checkout. |
| `demoVideo.wistiaId` | ID do vídeo na Wistia (atual: `bpx3ih7ujf`) e `wistiaAspect` (proporção). Carrega só quando a seção se aproxima da tela e não autoplay. |
| `demoVideo.url` | `assets/videos/demonstracao-grupo.mp4` ou link do YouTube; `poster` = capa; `ratio` = `16/9`, `9/16`, `4/5` |
| `results.images` | `[{ src: "assets/images/resultados-shopee.jpg", alt: "..." }]` (clique amplia) |
| `products[i].image` | `assets/images/produto-airfryer-1.webp` (vazio = ilustração embutida) |
| `tracking.metaPixelId` | ID do Meta Pixel (dispara PageView e, no clique de compra, InitiateCheckout) |
| `tracking.utmifyPixelId` / `utmifyUtms` | pixel e script de UTMs da UTMify — confira com o snippet oficial do seu painel |
| `tracking.extraScripts` | URLs de outros scripts oficiais |
| `contact.*` | links de suporte, termos, privacidade e reembolso no rodapé |

Textos do hero, benefícios, oferta e FAQ ficam em `index.html`.
O som começa ligado e é liberado no 1º toque quando o navegador bloqueia autoplay; a escolha do visitante fica salva no navegador.

## Segurança
Repositório público: **nunca** coloque senhas, tokens, chaves privadas, links de acesso ao grupo VIP ou materiais exclusivos de compradores. IDs de pixel são públicos.

## Publicar (grátis)
**Cloudflare Pages (recomendado, permite uso comercial):** Workers & Pages → Create → Pages → Connect to Git → escolha este repositório → Framework preset: *None*; Build command: vazio; Build output directory: `/` → Deploy. Depois conecte seu domínio.
Alternativas: Netlify ou Vercel (mesmo esquema, sem build). Evite GitHub Pages para página de vendas: os termos do GitHub restringem uso comercial.

## Animações (etapa 1)
`js/animations.js` — cartões que empilham (benefícios), texto que se preenche e luz que segue o mouse (cartão final). Revelar palavras do título, brilho dos botões e gradiente vivo são CSS puro (fim de `css/style.css`). A linha do fluxo do bot continua no motor de `js/app.js`. Tudo respeita `prefers-reduced-motion`.
