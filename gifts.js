// Lista de presentes.
// multi: true  → várias pessoas podem escolher o mesmo item (ex.: livros, maquiagem).
// sem multi    → o item sai da lista depois que alguém escolhe.
window.GIFT_LIST = [
  {
    id: "photo",
    title: "Photography & Technology",
    items: [
      { name: "Câmera digital compacta vintage" },
      { name: "Cartão de memória" },
      { name: "Microfone de lapela" },
      { name: "Mochila para notebook" }
    ]
  },
  {
    id: "fashion",
    title: "Fashion & Accessories",
    items: [
      { name: "Bolsa de ombro" },
      { name: "Bolsa transversal" },
      { name: "Carteira" },
      { name: "Colares delicados", multi: true },
      { name: "Pulseiras", multi: true },
      { name: "Anéis", multi: true },
      { name: "Brincos", multi: true },
      { name: "Joias em prata ou dourado", multi: true },
      { name: "Pijamas bonitos", multi: true },
      { name: "Robe" },
      { name: "Pantufas" },
      { name: "Porta-joias" }
    ]
  },
  {
    id: "beauty",
    title: "Beauty & Self-care",
    items: [
      { name: "Perfume", multi: true },
      { name: "Body splash", multi: true },
      { name: "Hidratante corporal", multi: true },
      { name: "Kit de skincare" },
      { name: "Protetor solar facial" },
      { name: "Produtos para cabelo", multi: true },
      { name: "Máscaras capilares", multi: true },
      { name: "Maquiagens", multi: true },
      { name: "Paleta de sombras" },
      { name: "Blush" },
      { name: "Gloss e lip tint", multi: true },
      { name: "Pincéis de maquiagem" },
      { name: "Espelho com iluminação" },
      { name: "Organizador de maquiagem" }
    ]
  },
  {
    id: "books",
    title: "Books & Stationery",
    items: [
      { name: "Livros de fantasia", multi: true },
      { name: "Romances", multi: true },
      { name: "Livros de suspense e mistério", multi: true },
      { name: "Marcadores de páginas", multi: true },
      { name: "Diário ou journal" },
      { name: "Planner" },
      { name: "Sketchbook" },
      { name: "Canetas coloridas", multi: true },
      { name: "Marca-textos", multi: true },
      { name: "Lápis de cor profissionais" },
      { name: "Aquarelas" },
      { name: "Tintas e pincéis" },
      { name: "Livro de colorir para adultos" }
    ]
  },
  {
    id: "home",
    title: "Home & Decor",
    items: [
      { name: "Velas aromáticas", multi: true },
      { name: "Porta-retratos", multi: true },
      { name: "Canecas bonitas", multi: true },
      { name: "Garrafa térmica" },
      { name: "Copos personalizados" },
      { name: "Bandeja decorativa" }
    ]
  }
];
