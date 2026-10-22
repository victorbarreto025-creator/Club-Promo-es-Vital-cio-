# Clube VIP de Ofertas — site completo

## O que tem aqui
| Pasta/arquivo | Para que serve |
|---|---|
| `site-pronto-para-hospedar/` | **É esta pasta que você envia para a hospedagem.** Site final, pronto. |
| `codigo-fonte/` | Projeto editável (mesmos arquivos + `build.sh`, testes e documentação). |
| `netlify.toml`, `vercel.json` | Configuração para Netlify e Vercel quando você sobe **este ZIP inteiro** por Git. |

## Tecnologia
Site **estático**: HTML + CSS + JavaScript puro. Não usa React, Next.js, Node, servidor, banco de dados nem `package.json`. Não existe etapa de compilação: nada a instalar. Qualquer hospedagem de arquivos estáticos serve (Netlify, Vercel, Cloudflare Pages, Hostinger, etc.).

## Publicar (resumo)
Envie o **conteúdo** de `site-pronto-para-hospedar/` (o `index.html` precisa ficar na raiz do site).

- **Netlify (mais simples):** em app.netlify.com/drop, arraste a pasta `site-pronto-para-hospedar`. Para usar Git: suba este projeto a um repositório e o `netlify.toml` já aponta a pasta certa (sem comando de build).
- **Cloudflare Pages:** Workers & Pages → Create → Pages → "Upload assets" (envie a pasta) ou "Connect to Git" com Framework *None*, build command vazio e output directory `site-pronto-para-hospedar`. Permite uso comercial no plano gratuito.
- **Vercel:** importe o repositório; o `vercel.json` já define a pasta de saída e dispensa build. (Configuração escrita conforme a documentação; não foi testada na Vercel.)
- **Hospedagem comum (cPanel/FTP):** envie o conteúdo da pasta para `public_html`.
- Evite GitHub Pages para página de vendas: os termos do GitHub restringem uso comercial.

## Domínio
Na hospedagem escolhida, adicione seu domínio em "Custom domain" e crie no seu provedor de DNS o registro que ela indicar (CNAME para subdomínio, ou A/ALIAS para o domínio raiz). O HTTPS é emitido automaticamente nesses serviços.
**Wistia:** se você restringiu os domínios permitidos do vídeo, adicione o novo domínio nas configurações da mídia/projeto na Wistia, senão o player pode não carregar.

## Serviços externos de que o site depende
| Serviço | Uso | Se falhar |
|---|---|---|
| **Wistia** (`fast.wistia.com`, vídeo `bpx3ih7ujf`) | player do vídeo de demonstração | aparece "Não foi possível carregar o vídeo agora." |
| **Zuptos** | checkout `https://app.zuptos.com.br/checkout/8fa8a266456050f1` | botões não abrem o pagamento |
| **Google Fonts** (Inter Tight, licença OFL) | tipografia | usa fonte do sistema (layout preserva) |
| Meta Pixel / UTMify (opcionais) | só carregam se você preencher os IDs em `js/config.js` | — |

Fontes: não foi possível baixar a Inter Tight para dentro do pacote; ela é carregada do Google Fonts. Para hospedar a fonte você mesmo, baixe em fonts.google.com/specimen/Inter+Tight, coloque em `css/` e troque o `<link>` do `index.html` por `@font-face` (licença OFL permite).

## Atualizar depois (tudo em `js/config.js`)
- **Checkout:** `checkoutUrl` (os 4 botões de compra também trazem o link direto no `href` do `index.html`; troque nos dois lugares).
- **Vídeo Wistia:** `demoVideo.wistiaId` e `wistiaAspect`. Para vídeo próprio: coloque o arquivo em `assets/videos/` e use `demoVideo.url`.
- **Print da Shopee:** troque `assets/images/resultados-shopee.jpg` (mesmo nome) ou edite `results.images` (use `w`/`h` com as dimensões reais).
- **Rastreamento:** `tracking.metaPixelId`, `tracking.utmifyPixelId`.
- **Rodapé:** `contact.supportUrl`, `termsUrl`, `privacyUrl`, `refundUrl`.
- Textos de hero, benefícios, oferta e FAQ ficam em `index.html`.
- Depois de editar `codigo-fonte/`, rode `./build.sh` (ou copie `index.html`, `favicon.svg`, `css`, `js`, `assets`) para regenerar a pasta pronta.

## Segurança
Não há senhas, tokens nem chaves no pacote. Não coloque links privados do grupo VIP no código do site (ele é público).
