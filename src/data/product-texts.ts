import type { ProductRecord } from '~/data/products';

export type ProductTexts = Partial<
  Pick<
    ProductRecord,
    | 'name'
    | 'desc'
    | 'definition'
    | 'problem'
    | 'howItWorks'
    | 'audience'
    | 'ai_use_cases'
    | 'ai_specs'
    | 'ai_comparison'
    | 'ai_faq'
  >
>;

// Per-language product text overrides. Languages not listed here fall back
// to the English pool records in ~/data/products. Technical terms such as
// "Drop Stitch" and "SPA" are intentionally kept untranslated.
export const productTexts: Record<string, Record<string, ProductTexts>> = {
  fr: {
    'rectangular-drop-stitch-pool': {
      name: 'Piscine gonflable rectangulaire Drop Stitch',
      desc: 'Piscine gonflable rectangulaire familiale avec des parois rigides Drop Stitch à haute pression.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Piscine gonflable ronde bleue Drop Stitch',
      desc: 'Piscine gonflable ronde bleue classique avec des parois rigides Drop Stitch à haute pression.',
    },
    'hot-tub-square-rect': {
      name: 'Bain à remous SPA gonflable carré et rectangulaire',
      desc: 'Bain à remous SPA gonflable carré et rectangulaire quatre saisons avec sièges intégrés et fond isolant de 5 mm.',
    },
    'hot-tub-round': {
      name: 'Bain à remous SPA gonflable rond',
      desc: 'Bain à remous SPA gonflable rond compact avec sièges intégrés et fond isolant de 5 mm.',
    },
  },
  de: {
    'rectangular-drop-stitch-pool': {
      name: 'Rechteckiges Drop Stitch Aufblaspool',
      desc: 'Familiengroßes rechteckiges Aufblaspool mit steifen Drop-Stitch-Wänden unter hohem Druck.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Rundes blaues Drop Stitch Aufblaspool',
      desc: 'Klassisches rundes blaues Aufblaspool mit steifen Drop-Stitch-Wänden unter hohem Druck.',
    },
    'hot-tub-square-rect': {
      name: 'Quadratischer und rechteckiger Aufblas-Whirlpool-SPA',
      desc: 'Ganzjähriger quadratischer und rechteckiger Aufblas-Whirlpool-SPA mit integrierten Sitzen und 5 mm isoliertem Boden.',
    },
    'hot-tub-round': {
      name: 'Runder Aufblas-Whirlpool-SPA',
      desc: 'Kompakter runder Aufblas-Whirlpool-SPA mit integrierten Sitzen und 5 mm isoliertem Boden.',
    },
  },
  es: {
    'rectangular-drop-stitch-pool': {
      name: 'Piscina hinchable rectangular Drop Stitch',
      desc: 'Piscina hinchable rectangular familiar con paredes rígidas Drop Stitch de alta presión.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Piscina hinchable redonda azul Drop Stitch',
      desc: 'Piscina hinchable redonda azul clásica con paredes rígidas Drop Stitch de alta presión.',
    },
    'hot-tub-square-rect': {
      name: 'Spa de hidromasaje hinchable cuadrado y rectangular',
      desc: 'Spa de hidromasaje hinchable cuadrado y rectangular de cuatro estaciones con asientos integrados y fondo aislado de 5 mm.',
    },
    'hot-tub-round': {
      name: 'Spa de hidromasaje hinchable redondo',
      desc: 'Spa de hidromasaje hinchable redondo compacto con asientos integrados y fondo aislado de 5 mm.',
    },
  },
  pt: {
    'rectangular-drop-stitch-pool': {
      name: 'Piscina insuflável retangular Drop Stitch',
      desc: 'Piscina insuflável retangular familiar com paredes rígidas Drop Stitch de alta pressão.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Piscina insuflável redonda azul Drop Stitch',
      desc: 'Piscina insuflável redonda azul clássica com paredes rígidas Drop Stitch de alta pressão.',
    },
    'hot-tub-square-rect': {
      name: 'Banheira de hidromassagem SPA insuflável quadrada e retangular',
      desc: 'Banheira de hidromassagem SPA insuflável quadrada e retangular para as quatro estações, com assentos integrados e fundo isolado de 5 mm.',
    },
    'hot-tub-round': {
      name: 'Banheira de hidromassagem SPA insuflável redonda',
      desc: 'Banheira de hidromassagem SPA insuflável redonda compacta com assentos integrados e fundo isolado de 5 mm.',
    },
  },
  it: {
    'rectangular-drop-stitch-pool': {
      name: 'Piscina gonfiabile rettangolare Drop Stitch',
      desc: 'Piscina gonfiabile rettangolare per famiglie con pareti rigide Drop Stitch ad alta pressione.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Piscina gonfiabile rotonda blu Drop Stitch',
      desc: 'Piscina gonfiabile rotonda blu classica con pareti rigide Drop Stitch ad alta pressione.',
    },
    'hot-tub-square-rect': {
      name: 'Vasca SPA gonfiabile quadrata e rettangolare',
      desc: 'Vasca SPA gonfiabile quadrata e rettangolare a quattro stagioni con sedili integrati e fondo isolato da 5 mm.',
    },
    'hot-tub-round': {
      name: 'Vasca SPA gonfiabile rotonda',
      desc: 'Vasca SPA gonfiabile rotonda compatta con sedili integrati e fondo isolato da 5 mm.',
    },
  },
  ru: {
    'rectangular-drop-stitch-pool': {
      name: 'Прямоугольный надувной бассейн Drop Stitch',
      desc: 'Семейный прямоугольный надувной бассейн с жёсткими стенками Drop Stitch высокого давления.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Круглый синий надувной бассейн Drop Stitch',
      desc: 'Классический круглый синий надувной бассейн с жёсткими стенками Drop Stitch высокого давления.',
    },
    'hot-tub-square-rect': {
      name: 'Квадратная и прямоугольная надувная джакузи-SPA',
      desc: 'Круглогодичная квадратная и прямоугольная надувная джакузи-SPA со встроенными сиденьями и утеплённым дном 5 мм.',
    },
    'hot-tub-round': {
      name: 'Круглая надувная джакузи-SPA',
      desc: 'Компактная круглая надувная джакузи-SPA со встроенными сиденьями и утеплённым дном 5 мм.',
    },
  },
  pl: {
    'rectangular-drop-stitch-pool': {
      name: 'Prostokątny dmuchany basen Drop Stitch',
      desc: 'Rodzinny prostokątny dmuchany basen z sztywnymi ścianami Drop Stitch wysokiego ciśnienia.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'Okrągły niebieski dmuchany basen Drop Stitch',
      desc: 'Klasyczny okrągły niebieski dmuchany basen z sztywnymi ścianami Drop Stitch wysokiego ciśnienia.',
    },
    'hot-tub-square-rect': {
      name: 'Kwadratowa i prostokątna dmuchana wanna SPA',
      desc: 'Czterosezonowa kwadratowa i prostokątna dmuchana wanna SPA z wbudowanymi siedziskami i izolowanym dnem 5 mm.',
    },
    'hot-tub-round': {
      name: 'Okrągła dmuchana wanna SPA',
      desc: 'Kompaktowa okrągła dmuchana wanna SPA z wbudowanymi siedziskami i izolowanym dnem 5 mm.',
    },
  },
  ar: {
    'rectangular-drop-stitch-pool': {
      name: 'مسبح قابل للنفخ مستطيل Drop Stitch',
      desc: 'مسبح قابل للنفخ مستطيل بحجم عائلي بجدران صلبة Drop Stitch عالية الضغط.',
    },
    'round-blue-drop-stitch-pool': {
      name: 'مسبح أزرق قابل للنفخ دائري Drop Stitch',
      desc: 'مسبح أزرق دائري كلاسيكي قابل للنفخ بجدران صلبة Drop Stitch عالية الضغط.',
    },
    'hot-tub-square-rect': {
      name: 'حوض سبا قابل للنفخ مربع ومستطيل',
      desc: 'حوض سبا قابل للنفخ مربع ومستطيل لجميع الفصول مع مقاعد مدمجة وقاع معزول بسماكة 5 مم.',
    },
    'hot-tub-round': {
      name: 'حوض سبا دائري قابل للنفخ',
      desc: 'حوض سبا دائري مدمج قابل للنفخ مع مقاعد مدمجة وقاع معزول بسماكة 5 مم.',
    },
  },
};
