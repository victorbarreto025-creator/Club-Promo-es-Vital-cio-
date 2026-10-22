// ============ CONFIGURAÇÃO CENTRALIZADA ============
// Edite só este arquivo para trocar links, IDs, vídeo e imagens. Não coloque senhas, tokens ou chaves privadas aqui
// (este arquivo é público). IDs de pixel são públicos por natureza.
const CONFIG = {
  checkoutUrl: "https://app.zuptos.com.br/checkout/8fa8a266456050f1",                       // link de pagamento Zuptos (vazio = botões rolam até a oferta)
  demoVideo: { wistiaId: "bpx3ih7ujf", wistiaAspect: 0.46153846153846156, url: "", poster: "", ratio: "9/19.5",   // Wistia: troque o ID aqui; ou use url (mp4/YouTube)
      // ex.: "assets/videos/demonstracao-grupo.mp4" ou link do YouTube
    title: "Veja como funciona na prática",
    subtitle: "Veja uma demonstração real de como o bot pode facilitar a divulgação de ofertas no seu grupo." },
  results: {
    title: "R$ 670,70 em vendas geradas na Shopee em 30 dias", highlight: "R$ 670,70",
    value: "", text: "Resultado real do meu painel de afiliado da Shopee, referente ao período de 22/09/2026 a 21/10/2026.",
    period: "",
    images: [{ src: "assets/images/resultados-shopee.jpg", alt: "Painel de afiliado da Shopee: 306 cliques, 9 pedidos, 14 itens vendidos e R$ 670,7 em vendas, de 22/09/2026 a 21/10/2026", w: 1280, h: 1547 }],                          // ex.: [{ src: "assets/images/resultado-shopee.webp", alt: "Painel de afiliados Shopee" }]
    caption: "Toque na imagem para ampliar.",
    disclaimer: "Os valores representam vendas de produtos, não comissões ou lucro. Resultados individuais podem variar." },
  products: [                            // miniaturas da busca "Air Fryer" (vazio = ilustração embutida)
    { image: "" },                       // ex.: "assets/images/produto-airfryer-1.webp"
    { image: "" }, { image: "" }],
  tracking: {                            // só carrega o que tiver ID preenchido
    metaPixelId: "",                     // ID do Meta Pixel
    utmifyPixelId: "",                   // ID do pixel da UTMify
    utmifyUtms: false,                   // true = carrega o script de UTMs da UTMify
    extraScripts: []                     // URLs de outros scripts oficiais (https://...)
  },
  contact: { supportUrl: "", termsUrl: "", privacyUrl: "", refundUrl: "" }  // ex.: "mailto:suporte@seudominio.com" ou "termos.html"
};
