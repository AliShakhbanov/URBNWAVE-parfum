import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flame, Heart, MessageCircle, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Star, Truck, X } from "lucide-react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { AccountOrder, AccountPage, AccountProfile } from "./components/AccountPage";
import { AdminPage } from "./components/AdminPage";
import { Header } from "./components/Header";
import { Product, ProductCard } from "./components/ProductCard";
import { products } from "./data/products";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

type SortBy = "popular" | "newest" | "price-asc" | "price-desc" | "name-asc";
type Longevity = "легкий" | "средний" | "стойкий";

type QuizAnswers = {
  mood?: "fresh" | "bold" | "romantic" | "mysterious";
  season?: "summer" | "winter" | "all";
  style?: "office" | "evening" | "casual";
  budget?: "low" | "mid" | "high";
};

interface CartItem extends Product {
  quantity: number;
  selectedVolume: number;
  unitPrice: number;
  cartKey: string;
}

interface CheckoutPayload {
  customer: AccountProfile;
  items: CartItem[];
  total: number;
}

interface CatalogPrefs {
  activeFilter: string;
  sortBy: SortBy;
  priceRange: [number, number];
  selectedVolumes: number[];
  selectedFamilies: Product["family"][];
  selectedScenarios: string[];
  selectedLongevity: Longevity[];
}

type ToastItem = { id: number; text: string };

const STORAGE_KEYS = {
  cart: "urbnwave_cart_v3",
  favorites: "urbnwave_favorites_v3",
  prefs: "urbnwave_catalog_prefs_v3",
  analytics: "urbnwave_analytics_v1",
  clientId: "urbnwave_client_id_v1",
  accountProfile: "urbnwave_account_profile_v1",
  accountOrders: "urbnwave_account_orders_v1",
};

const BRAND_DESCRIPTION = "URBNWAVE: премиальный распив именитых ароматов и вдохновленная линейка Atelier. Доставка по РФ, подбор аромата, удобный checkout.";
const SITE_URL = "https://urbnwave.ru";

const allVolumes = [2, 5, 10, 20, 50] as const;
const allFamilies: Product["family"][] = ["цитрус", "древесный", "восточный", "цветочный"];
const allScenarios = ["офис", "вечер", "casual", "лето", "зима"] as const;
const allLongevity: Longevity[] = ["легкий", "средний", "стойкий"];

const basePrefs: CatalogPrefs = {
  activeFilter: "Все",
  sortBy: "popular",
  priceRange: [1000, 6000],
  selectedVolumes: [],
  selectedFamilies: [],
  selectedScenarios: [],
  selectedLongevity: [],
};

type SiteSettings = {
  hero: { title: string; subtitle: string; badge: string; image: string };
  menu: { catalog: string; decants: string; atelier: string; top: string; quiz: string };
  benefits: { items: Array<{ title: string; text: string }> };
  brand: { title: string; subtitle: string; image: string; points: string[] };
  pages: {
    delivery: { title: string; text: string };
    returns: { title: string; text: string };
    payment: { title: string; text: string };
    faq: { title: string; text: string };
    about: { title: string; text: string };
    contacts: { title: string; text: string };
    stores: { title: string; text: string };
    careers: { title: string; text: string };
  };
  faqItems: Array<{ question: string; answer: string }>;
};

const defaultSiteSettings: SiteSettings = {
  hero: {
    title: "Премиальный бренд распива и авторского парфюма URBNWAVE",
    subtitle: "Сильная воронка: сначала именитые распивы, затем переход в вашу Atelier-линейку.",
    badge: "-15% на первый заказ",
    image: "/images/perfume/photo_11_2026-03-03_11-43-39.jpg",
  },
  menu: {
    catalog: "Весь каталог",
    decants: "Именитые распивы",
    atelier: "Atelier URBNWAVE",
    top: "Популярные распивы",
    quiz: "Подбор",
  },
  benefits: {
    items: [
      { title: "Доставка 1-3 дня", text: "Москва, СПб и вся РФ" },
      { title: "Контроль качества", text: "Партии и розлив фиксируются" },
      { title: "Возврат 14 дней", text: "Прозрачные условия без бюрократии" },
    ],
  },
  brand: {
    title: "Премиальный бренд, который продает и вызывает доверие",
    subtitle: "Стратегия URBNWAVE: покупатель сначала тестирует знакомые ароматические направления в распиве, затем знакомится с вашей авторской линией.",
    image: "/images/perfume/photo_6_2026-03-03_11-43-39.jpg",
    points: [
      "Именитые ароматы на распив для первого доверия к качеству.",
      "Atelier-линейка URBNWAVE для перехода на ваш собственный бренд.",
      "Премиальный визуал, упаковка и прозрачная клиентская коммуникация.",
    ],
  },
  pages: {
    delivery: { title: "Доставка", text: "Доставляем по всей России. Курьер, ПВЗ и экспресс-доставка." },
    returns: { title: "Возврат", text: "Вы можете вернуть товар в срок до 14 дней при соблюдении условий." },
    payment: { title: "Оплата", text: "Онлайн-оплата пока не подключена. Заказы подтверждаются менеджером в WhatsApp/Telegram." },
    faq: { title: "Вопросы", text: "Ответы о распиве, доставке и оплате." },
    about: { title: "О бренде", text: "URBNWAVE: именитые ароматы для доверия и Atelier-линейка для роста собственного бренда." },
    contacts: { title: "Контакты", text: "support@urbnwave.ru и Telegram @urbnwave_support" },
    stores: { title: "Магазины", text: "Офлайн-точки и партнерские пространства в Москве и Санкт-Петербурге." },
    careers: { title: "Карьера", text: "Ищем сильных людей в маркетинг, продукт и retail." },
  },
  faqItems: [
    { question: "Что такое распив?", answer: "Это возможность протестировать аромат в меньшем объеме перед покупкой полноразмера." },
    { question: "Как долго держится аромат?", answer: "Стойкость зависит от композиции и типа кожи, обычно от 4 до 10 часов." },
  ],
};



function getDiscountedPrice(product: Product) {
  return product.salePercent ? Math.round(product.price * (1 - product.salePercent / 100)) : product.price;
}

function getPriceForVolume(product: Product, selectedVolume: number) {
  const scaled = Math.round(getDiscountedPrice(product) * (selectedVolume / product.volume));
  return Math.max(590, scaled);
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getClientId() {
  const existing = localStorage.getItem(STORAGE_KEYS.clientId);
  if (existing) return existing;
  const next = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(STORAGE_KEYS.clientId, next);
  return next;
}

function track(event: string, payload: Record<string, string | number | boolean> = {}) {
  const entry = {
    event,
    payload,
    at: new Date().toISOString(),
    path: window.location.pathname,
    search: window.location.search,
    clientId: getClientId(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.analytics);
    const previous = raw ? (JSON.parse(raw) as Array<Record<string, unknown>>) : [];
    previous.push(entry);
    localStorage.setItem(STORAGE_KEYS.analytics, JSON.stringify(previous.slice(-500)));
  } catch {
    // ignore analytics errors
  }

  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  if (!endpoint) return;
  try {
    const body = JSON.stringify(entry);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    // ignore network analytics errors
  }
}

function filterProducts(items: Product[], query: string, prefs: CatalogPrefs, showFilter: boolean) {
  const q = query.trim().toLowerCase();
  return items
    .filter((p) => {
      const price = getDiscountedPrice(p);
      if (price < prefs.priceRange[0] || price > prefs.priceRange[1]) return false;
      if (prefs.selectedVolumes.length && !prefs.selectedVolumes.includes(p.volume)) return false;
      if (prefs.selectedFamilies.length && !prefs.selectedFamilies.includes(p.family)) return false;
      if (prefs.selectedScenarios.length && !prefs.selectedScenarios.some((s) => p.scenarios.includes(s))) return false;
      if (prefs.selectedLongevity.length && !prefs.selectedLongevity.includes((p.longevity ?? "средний") as Longevity)) return false;
      if (showFilter && prefs.activeFilter === "Новинки" && !p.isNew) return false;
      if (showFilter && prefs.activeFilter === "Хиты" && !p.isHit) return false;
      if (!q) return true;
      return [p.name, p.category, p.description, p.family, p.inspiredBy ?? ""].join(" ").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (prefs.sortBy === "price-asc") return getDiscountedPrice(a) - getDiscountedPrice(b);
      if (prefs.sortBy === "price-desc") return getDiscountedPrice(b) - getDiscountedPrice(a);
      if (prefs.sortBy === "name-asc") return a.name.localeCompare(b.name, "ru");
      if (prefs.sortBy === "newest") return b.releaseYear - a.releaseYear;
      return b.popularity - a.popularity;
    });
}

function createProductSchema(product: Product) {
  const price = getDiscountedPrice(product);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Каталог", item: `${SITE_URL}/catalog` },
          { "@type": "ListItem", position: 3, name: product.name, item: `${SITE_URL}/product/${product.id}` },
        ],
      },
      {
        "@type": "Product",
        name: product.name,
        image: [`${SITE_URL}${product.image}`],
        description: product.description,
        brand: { "@type": "Brand", name: "URBNWAVE" },
        category: product.category,
        offers: {
          "@type": "Offer",
          priceCurrency: "RUB",
          price,
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/product/${product.id}`,
        },
      },
    ],
  };
}

function SeoManager({ path }: { path: string }) {
  useEffect(() => {
    const map: Record<string, { title: string; description: string }> = {
      "/": { title: "URBNWAVE - премиальный распив и Atelier-парфюмерия", description: BRAND_DESCRIPTION },
      "/catalog": { title: "Каталог ароматов URBNWAVE", description: "Каталог распива и вдохновленной линейки URBNWAVE: фильтры по семье, стойкости, цене и сценарию." },
      "/decants": { title: "Именитые распивы - URBNWAVE", description: "Премиальные бренды в формате распива для знакомства и теста перед полноразмером." },
      "/top-decants": { title: "Популярные распивы - URBNWAVE", description: "Самые востребованные ароматы в формате распива с высоким рейтингом покупателей." },
      "/atelier": { title: "Atelier URBNWAVE - вдохновленные композиции", description: "Авторская линейка URBNWAVE в премиальном стиле, вдохновленная нишевыми направлениями." },
      "/quiz": { title: "Подбор аромата - URBNWAVE", description: "Мини-квиз поможет подобрать 3-5 ароматов под ваш стиль, сезон и бюджет." },
      "/cart": { title: "Корзина - URBNWAVE", description: "Проверьте выбранные ароматы и переходите к оформлению заказа." },
      "/checkout": { title: "Оформление заказа - URBNWAVE", description: "Быстрый checkout: контакты, доставка, комментарий и подтверждение заказа." },
      "/guides": { title: "Гид по ароматам - URBNWAVE", description: "Практические статьи о выборе аромата, стойкости и нанесении." },
      "/analytics": { title: "Аналитика воронки - URBNWAVE", description: "Ключевые события воронки: просмотры, корзина, checkout и конверсия." },
      "/account": { title: "Личный кабинет - URBNWAVE", description: "Профиль клиента, история заказов и быстрый повтор покупок." },
    };

    const productPathMatch = path.startsWith("/product/") ? Number(path.split("/")[2]) : null;
    const productForMeta = productPathMatch ? products.find((item) => item.id === productPathMatch) : null;
    const current = productForMeta
      ? { title: `${productForMeta.name} - URBNWAVE`, description: productForMeta.description }
      : map[path] ?? map["/"];
    document.title = current.title;

    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.append(description);
    }
    description.setAttribute("content", current.description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    canonical.href = `${SITE_URL}${path}`;

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.append(ogTitle);
    }
    ogTitle.setAttribute("content", current.title);

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement("meta");
      ogDescription.setAttribute("property", "og:description");
      document.head.append(ogDescription);
    }
    ogDescription.setAttribute("content", current.description);

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
      ogImage = document.createElement("meta");
      ogImage.setAttribute("property", "og:image");
      document.head.append(ogImage);
    }
    ogImage.setAttribute("content", productForMeta ? `${SITE_URL}/og/product-${productForMeta.id}.svg` : `${SITE_URL}/og/default.svg`);

    let schema = document.getElementById("urbnwave-schema");
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "urbnwave-schema";
      schema.setAttribute("type", "application/ld+json");
      document.head.append(schema);
    }

    const schemaData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          name: "URBNWAVE",
          url: SITE_URL,
          logo: `${SITE_URL}/images/perfume/photo_2_2026-03-03_11-43-39.jpg`,
          description: current.description,
        },
        {
          "@type": "WebSite",
          name: "URBNWAVE",
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/catalog?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        },
      ],
    };

    if (path.startsWith("/product/")) {
      const productId = Number(path.split("/")[2]);
      const product = products.find((item) => item.id === productId);
      if (product) {
        schema.textContent = JSON.stringify(createProductSchema(product));
        return;
      }
    }

    if (path === "/faq") {
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Что такое распив?", acceptedAnswer: { "@type": "Answer", text: "Это возможность протестировать аромат в меньшем объеме перед покупкой полноразмера." } },
          { "@type": "Question", name: "Как долго держится аромат?", acceptedAnswer: { "@type": "Answer", text: "Стойкость зависит от композиции и типа кожи, обычно от 4 до 10 часов." } },
        ],
      });
      return;
    }

    schema.textContent = JSON.stringify(schemaData);
  }, [path]);

  return null;
}

function ToastStack({ toasts }: { toasts: ToastItem[] }) {
  return <div className="fixed top-20 right-4 z-[60] space-y-2">{toasts.map((t) => <div key={t.id} className="bg-neutral-900 border border-neutral-700 text-white rounded-xl px-4 py-3 shadow-lg">{t.text}</div>)}</div>;
}

function BenefitsStrip({ items }: { items: Array<{ title: string; text: string }> }) {
  const icons = [Truck, ShieldCheck, Check];
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{items.map((item, index) => { const Icon = icons[index % icons.length]; return <div key={`${item.title}-${index}`} className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-5 backdrop-blur reveal-up"><Icon className="w-6 h-6 text-[#e7b16c] mb-3" /><h3 className="text-white mb-1">{item.title}</h3><p className="text-neutral-400 text-sm">{item.text}</p></div>; })}</div></section>;
}

function BrandStory({ content }: { content: SiteSettings["brand"] }) {
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 page-enter"><div className="grid lg:grid-cols-2 gap-8 items-center"><div><p className="lux-kicker mb-2">Brand Narrative</p><h2 className="text-display text-white mb-4 lux-section-title">{content.title}</h2><p className="text-neutral-300 mb-6">{content.subtitle}</p><ul className="space-y-2">{content.points.map((p, index) => <li key={`${p}-${index}`} className="text-neutral-200 flex items-start gap-2"><Sparkles className="w-4 h-4 mt-1 text-[#e7b16c]" />{p}</li>)}</ul></div><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"><img src={content.image} alt="URBNWAVE premium storytelling" className="w-full rounded-xl object-cover aspect-[4/3]" loading="lazy" /><div className="grid grid-cols-3 gap-3 mt-4 text-center"><div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800"><p className="text-white text-2xl">24ч</p><p className="text-neutral-400 text-xs">подтверждение заказа</p></div><div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800"><p className="text-white text-2xl">1k+</p><p className="text-neutral-400 text-xs">отгрузок в месяц</p></div><div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800"><p className="text-white text-2xl">4.9</p><p className="text-neutral-400 text-xs">средний рейтинг</p></div></div></div></div></section>;
}

function QuickViewModal({ product, onClose, onAddToCart, onToggleFavorite, isFavorite }: { product: Product | null; onClose: () => void; onAddToCart: (product: Product) => void; onToggleFavorite: (id: number) => void; isFavorite: boolean }) {
  if (!product) return null;
  return <div className="fixed inset-0 z-[70] bg-black/70 flex items-center justify-center p-4" onClick={onClose}><div className="w-full max-w-3xl bg-neutral-900 border border-neutral-700 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}><div className="grid md:grid-cols-2"><img src={product.image} alt={product.name} className="w-full h-full object-cover min-h-80" /><div className="p-6"><div className="flex justify-between items-start mb-3"><h3 className="text-2xl text-white lux-card-title">{product.name}</h3><button onClick={onClose}><X className="w-5 h-5 text-neutral-400" /></button></div><p className="text-sm text-neutral-400 mb-3">{product.category} · {product.family}</p><p className="text-neutral-300 mb-6">{product.description}</p><p className="text-3xl text-white mb-6">{getDiscountedPrice(product).toLocaleString("ru-RU")} ₽</p><div className="flex gap-3"><button onClick={() => onAddToCart(product)} className="btn-primary flex-1">В корзину</button><button onClick={() => onToggleFavorite(product.id)} className={`btn-secondary ${isFavorite ? "border-[#d89b4a] text-[#f3c98f]" : ""}`}>{isFavorite ? "В избранном" : "В избранное"}</button></div></div></div></div></div>;
}

function CatalogSection(props: { title: string; subtitle: string; items: Product[]; searchQuery: string; prefs: CatalogPrefs; showFilter: boolean; onSearchChange: (value: string) => void; onFilterChange: (value: string) => void; onSortChange: (value: SortBy) => void; onPriceChange: (value: [number, number]) => void; onVolumeToggle: (value: number) => void; onFamilyToggle: (value: Product["family"]) => void; onScenarioToggle: (value: string) => void; onLongevityToggle: (value: Longevity) => void; onResetFilters: () => void; onAddToCart: (product: Product) => void; onProductClick: (product: Product) => void; onToggleFavorite: (id: number) => void; onQuickView: (product: Product) => void; favorites: Set<number>; }) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [mobileView, setMobileView] = useState<"cards" | "grid2" | "list">("cards");
  const visibleProducts = useMemo(() => filterProducts(props.items, props.searchQuery, props.prefs, props.showFilter), [props.items, props.searchQuery, props.prefs, props.showFilter]);
  const activeCount = props.prefs.selectedVolumes.length + props.prefs.selectedFamilies.length + props.prefs.selectedScenarios.length + props.prefs.selectedLongevity.length;

  const mobileLayoutClass = mobileView === "list" ? "catalog-mobile-list" : mobileView === "grid2" ? "catalog-mobile-grid2" : "";

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-4">
        <div>
          <h2 className="text-display text-white mb-2 lux-section-title">{props.title}</h2>
          <p className="text-neutral-400 lux-kicker">{props.subtitle}</p>
          <p className="text-sm text-neutral-500 mt-2">Найдено: {visibleProducts.length}</p>
        </div>
        {props.showFilter && (
          <div className="flex items-center gap-2">
            {(["Все", "Новинки", "Хиты"] as const).map((f) => (
              <button key={f} className={`chip ${props.prefs.activeFilter === f ? "chip-active" : ""}`} onClick={() => props.onFilterChange(f)}>{f}</button>
            ))}
          </div>
        )}
      </div>

      <div className="md:hidden mb-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-2 inline-flex gap-2">
          <button onClick={() => setMobileView("cards")} className={`chip ${mobileView === "cards" ? "chip-active" : ""}`}>Карточки</button>
          <button onClick={() => setMobileView("grid2")} className={`chip ${mobileView === "grid2" ? "chip-active" : ""}`}>Сетка 2</button>
          <button onClick={() => setMobileView("list")} className={`chip ${mobileView === "list" ? "chip-active" : ""}`}>Список</button>
        </div>
      </div>

      <div className="bg-neutral-900/95 border border-neutral-800 rounded-2xl p-4 md:p-5 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <label className="lg:col-span-7 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" value={props.searchQuery} onChange={(e) => props.onSearchChange(e.target.value)} placeholder="Поиск по названию, категории, семейству" className="input-main h-11 pl-10 w-full" />
          </label>
          <select value={props.prefs.sortBy} onChange={(e) => props.onSortChange(e.target.value as SortBy)} className="input-main h-11 lg:col-span-3">
            <option value="popular">Популярность</option>
            <option value="newest">Новизна</option>
            <option value="price-asc">Цена: дешевле</option>
            <option value="price-desc">Цена: дороже</option>
            <option value="name-asc">Название: А-Я</option>
          </select>
          <button onClick={() => setFiltersOpen((v) => !v)} className="btn-secondary h-11 lg:col-span-2 inline-flex items-center justify-center gap-2"><SlidersHorizontal className="w-4 h-4" />Фильтры {activeCount > 0 ? `(${activeCount})` : ""}</button>
        </div>
        {filtersOpen && (
          <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="xl:col-span-2">
              <p className="text-sm text-neutral-300 mb-2">Цена: {props.prefs.priceRange[0]} - {props.prefs.priceRange[1]} ₽</p>
              <input type="range" min={1000} max={6000} step={100} value={props.prefs.priceRange[0]} onChange={(e) => props.onPriceChange([Number(e.target.value), props.prefs.priceRange[1]])} className="w-full" />
              <input type="range" min={1000} max={6000} step={100} value={props.prefs.priceRange[1]} onChange={(e) => props.onPriceChange([props.prefs.priceRange[0], Number(e.target.value)])} className="w-full mt-1" />
            </div>
            <div><p className="text-sm text-neutral-300 mb-2">Объем</p><div className="flex flex-wrap gap-2">{allVolumes.map((v) => <button key={v} onClick={() => props.onVolumeToggle(v)} className={`chip ${props.prefs.selectedVolumes.includes(v) ? "chip-active" : ""}`}>{v} мл</button>)}</div></div>
            <div><p className="text-sm text-neutral-300 mb-2">Семейство</p><div className="flex flex-wrap gap-2">{allFamilies.map((f) => <button key={f} onClick={() => props.onFamilyToggle(f)} className={`chip ${props.prefs.selectedFamilies.includes(f) ? "chip-active" : ""}`}>{f}</button>)}</div></div>
            <div><p className="text-sm text-neutral-300 mb-2">Сценарий</p><div className="flex flex-wrap gap-2">{allScenarios.map((s) => <button key={s} onClick={() => props.onScenarioToggle(s)} className={`chip ${props.prefs.selectedScenarios.includes(s) ? "chip-active" : ""}`}>{s}</button>)}</div></div>
            <div><p className="text-sm text-neutral-300 mb-2">Стойкость</p><div className="flex flex-wrap gap-2">{allLongevity.map((v) => <button key={v} onClick={() => props.onLongevityToggle(v)} className={`chip ${props.prefs.selectedLongevity.includes(v) ? "chip-active" : ""}`}>{v}</button>)}</div><button onClick={props.onResetFilters} className="btn-secondary w-full mt-3">Сбросить</button></div>
          </div>
        )}
      </div>

      <div className={`catalog-grid ${mobileLayoutClass} grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6`}>
        {visibleProducts.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onAddToCart={props.onAddToCart}
            onProductClick={props.onProductClick}
            onToggleFavorite={props.onToggleFavorite}
            onQuickView={props.onQuickView}
            isFavorite={props.favorites.has(p.id)}
          />
        ))}
      </div>

      {visibleProducts.length === 0 && (
        <div className="mt-8 text-center border border-neutral-800 rounded-2xl py-10 px-4 bg-neutral-900">
          <p className="text-white mb-2 text-xl">Ничего не найдено</p>
          <p className="text-neutral-400 text-sm mb-4">Попробуйте изменить фильтры и запрос</p>
          <button onClick={props.onResetFilters} className="btn-primary">Сбросить</button>
        </div>
      )}
    </section>
  );
}

function SeoLandingBlock({ title, paragraphs, faq }: { title: string; paragraphs: string[]; faq: { q: string; a: string }[] }) {
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8"><h2 className="text-display text-white mb-4 lux-section-title">{title}</h2><div className="space-y-3 mb-6">{paragraphs.map((p) => <p key={p} className="text-neutral-300 leading-relaxed">{p}</p>)}</div><div className="grid md:grid-cols-2 gap-3">{faq.map((item) => <details key={item.q} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"><summary className="cursor-pointer text-white">{item.q}</summary><p className="text-neutral-400 mt-2 text-sm">{item.a}</p></details>)}</div></div></section>;
}

function HomePage(props: any) {
  return (
    <>
      <section className="relative h-[62vh] sm:h-[74vh] overflow-hidden bg-neutral-900 page-enter">
        <img
          src={props.hero.image}
          alt="URBNWAVE premium hero"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/65 to-neutral-950" />
        <div className="relative h-full flex items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center editorial-shell">
            <p className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#f3c98f] border border-[#d89b4a66] bg-[#d89b4a1a] rounded-full px-3 py-1 mb-5">
              <Flame className="w-3 h-3" /> {props.hero.badge}
            </p>
            <h1 className="text-display text-white mb-4 lux-section-title lux-rule-center editorial-title">{props.hero.title}</h1>
            <p className="text-lg text-neutral-200 mb-8 editorial-lead">{props.hero.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/catalog" className="btn-primary">Купить сейчас</Link>
              <Link to="/quiz" className="btn-secondary">Подобрать аромат</Link>
            </div>
          </div>
        </div>
      </section>
      <BenefitsStrip items={props.benefits.items} />
      <BrandStory content={props.brand} />
      <CatalogSection {...props} title="Распив и Atelier URBNWAVE" subtitle="Именитые распивы + вдохновленные композиции" items={products} showFilter={true} />
    </>
  );
}

function FaqPage({ title, text, items }: { title: string; text: string; items: Array<{ question: string; answer: string }> }) {
  return <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"><h2 className="text-display text-white mb-4 lux-section-title lux-rule-center">{title}</h2><p className="text-neutral-300 leading-relaxed mb-8">{text}</p><div className="space-y-3">{items.map((item, index) => <details key={`${item.question}-${index}`} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"><summary className="cursor-pointer text-white">{item.question}</summary><p className="text-neutral-400 mt-2 text-sm">{item.answer}</p></details>)}</div></div></section>;
}

function ProductPage({ product, onAddToCart, onToggleFavorite, favorites, onProductClick }: { product: Product; onAddToCart: (p: Product, volume?: number) => void; onToggleFavorite: (id: number) => void; favorites: Set<number>; onProductClick: (p: Product) => void }) {
  const [selectedVolume, setSelectedVolume] = useState(10);
  const [activeImage, setActiveImage] = useState(product.gallery?.[0] ?? product.image);
  const similar = products.filter((p) => p.id !== product.id && p.family === product.family).slice(0, 4);
  const currentPrice = getPriceForVolume(product, selectedVolume);
  const waLink = `https://wa.me/79999999999?text=${encodeURIComponent(`Хочу заказать ${product.name}, объем ${selectedVolume} мл`)}`;
  const tgLink = `https://t.me/urbnwave_support?text=${encodeURIComponent(`Хочу заказать ${product.name}, объем ${selectedVolume} мл`)}`;
  useEffect(() => { setSelectedVolume(allVolumes.includes(product.volume as typeof allVolumes[number]) ? product.volume : 10); setActiveImage(product.gallery?.[0] ?? product.image); }, [product.id, product.gallery, product.image, product.volume]);

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter pb-28 md:pb-16"><div className="text-sm text-neutral-500 mb-4"><Link to="/" className="hover:text-white">Главная</Link> / <Link to="/catalog" className="hover:text-white">Каталог</Link> / <span className="text-neutral-300">{product.name}</span></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12"><div><img src={activeImage} alt={product.name} className="w-full rounded-2xl object-cover max-h-[560px]" /><div className="grid grid-cols-4 gap-2 mt-3">{(product.gallery?.length ? product.gallery : [product.image]).map((src) => <button key={src} onClick={() => setActiveImage(src)} className={`rounded-xl overflow-hidden border ${activeImage === src ? "border-[#d89b4a]" : "border-neutral-800"}`}><img src={src} alt={product.name} className="w-full aspect-square object-cover" loading="lazy" /></button>)}</div></div><div><p className="text-[#f3c98f] text-sm mb-2 uppercase tracking-wider">{product.category} · {product.family}</p><h1 className="text-display text-white mb-2 lux-product-title">{product.name}</h1><p className="text-neutral-400 mb-4">Базовый объем {product.volume} мл · Стойкость {product.longevity}</p><p className="text-4xl text-white mb-2">{currentPrice.toLocaleString("ru-RU")} ₽</p><p className="text-neutral-300 mb-6">{product.description}</p><div className="mb-6"><p className="text-sm text-neutral-300 mb-2">Выберите объем</p><div className="flex flex-wrap gap-2">{allVolumes.map((v) => <button key={v} onClick={() => setSelectedVolume(v)} className={`chip ${selectedVolume === v ? "chip-active" : ""}`}>{v} мл</button>)}</div></div><div className="flex flex-wrap gap-3 mb-6"><button onClick={() => onAddToCart(product, selectedVolume)} className="btn-primary">Добавить в корзину</button><button onClick={() => onToggleFavorite(product.id)} className={`btn-secondary ${favorites.has(product.id) ? "border-[#d89b4a] text-[#f3c98f]" : ""}`}>{favorites.has(product.id) ? "В избранном" : "В избранное"}</button></div><div className="grid sm:grid-cols-3 gap-3 mb-6">{(["top", "heart", "base"] as const).map((k) => <div key={k} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4"><p className="text-sm text-[#f3c98f] mb-1">{k === "top" ? "Верхние" : k === "heart" ? "Сердце" : "База"}</p><p className="text-neutral-200 text-sm">{product.notes[k].join(", ")}</p></div>)}</div><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6"><p className="text-[#e7b16c] text-sm mb-1">На что вдохновлен аромат</p><p className="text-neutral-200">{product.inspiredBy}</p></div><div className="grid sm:grid-cols-2 gap-3"><a href={waLink} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2"><MessageCircle className="w-4 h-4" /> Заказ в WhatsApp</a><a href={tgLink} target="_blank" rel="noreferrer" className="btn-secondary inline-flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Заказ в Telegram</a></div></div></div><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-8"><h3 className="text-xl text-white mb-3 lux-section-title">Отзывы</h3><div className="grid md:grid-cols-3 gap-3">{[{ a: "Илья", s: 5, t: "Теплый и дорогой шлейф." }, { a: "Марина", s: 4, t: "Идеально на зиму и вечер." }, { a: "Алексей", s: 5, t: "Качественный розлив, очень доволен." }].map((r) => <article key={r.a} className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"><p className="text-white mb-1">{r.a}</p><p className="flex gap-0.5 text-[#e7b16c] mb-2">{Array.from({ length: r.s }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</p><p className="text-neutral-300 text-sm">{r.t}</p></article>)}</div></div><h3 className="text-2xl text-white mb-4 lux-section-title">Похожие ароматы</h3><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{similar.map((p) => <button key={p.id} onClick={() => onProductClick(p)} className="text-left bg-neutral-900 border border-neutral-800 rounded-2xl p-3 hover:border-neutral-700"><img src={p.image} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-2" loading="lazy" /><p className="text-white lux-card-title">{p.name}</p></button>)}</div><div className="sticky-buy-bar md:hidden"><div><p className="text-xs text-neutral-400">{selectedVolume} мл</p><p className="text-white font-semibold">{currentPrice.toLocaleString("ru-RU")} ₽</p></div><button onClick={() => onAddToCart(product, selectedVolume)} className="btn-primary">Купить</button></div></section>;
}

function CartPage({ items, onUpdateQuantity, onRemoveFromCart }: { items: CartItem[]; onUpdateQuantity: (key: string, q: number) => void; onRemoveFromCart: (key: string) => void }) {
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter"><h2 className="text-display text-white mb-6 lux-section-title">Корзина</h2>{items.length === 0 ? <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-10 text-center"><p className="text-white text-2xl mb-2">Корзина пуста</p><Link to="/catalog" className="btn-primary">Перейти в каталог</Link></div> : <div className="grid lg:grid-cols-12 gap-6"><div className="lg:col-span-8 space-y-4">{items.map((item) => <div key={item.cartKey} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4"><img src={item.image} alt={item.name} className="w-24 h-28 rounded-xl object-cover" /><div className="flex-1"><h3 className="text-white mb-1">{item.name}</h3><p className="text-neutral-400 text-sm mb-3">{item.category} · {item.selectedVolume} мл</p><p className="text-white">{item.unitPrice.toLocaleString("ru-RU")} ₽</p></div><div className="flex items-center gap-2"><button onClick={() => onUpdateQuantity(item.cartKey, Math.max(1, item.quantity - 1))} className="btn-secondary">-</button><span className="w-8 text-center text-white">{item.quantity}</span><button onClick={() => onUpdateQuantity(item.cartKey, item.quantity + 1)} className="btn-secondary">+</button><button onClick={() => onRemoveFromCart(item.cartKey)} className="btn-secondary border-red-500/30 text-red-300">Удалить</button></div></div>)}</div><aside className="lg:col-span-4"><div className="sticky top-24 bg-neutral-900 border border-neutral-800 rounded-2xl p-6"><h3 className="text-white text-xl mb-4">Итого</h3><div className="space-y-2 mb-6 text-neutral-300"><div className="flex justify-between"><span>Позиции</span><span>{items.length}</span></div><div className="flex justify-between text-white text-xl pt-2 border-t border-neutral-800"><span>К оплате</span><span>{total.toLocaleString("ru-RU")} ₽</span></div></div><Link to="/checkout" onClick={() => track("begin_checkout", { items: items.length, total })} className="btn-primary w-full text-center">Оформить заказ</Link></div></aside></div>}</section>;
}

function CheckoutPage({ items, profile, onOrderComplete }: { items: CartItem[]; profile: AccountProfile | null; onOrderComplete: (payload: CheckoutPayload) => void }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [city, setCity] = useState(profile?.city ?? "");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim() || !email.trim()) return;
    onOrderComplete({
      customer: { name: name.trim(), phone: phone.trim(), email: email.trim(), city: city.trim() },
      items,
      total,
    });
    setSubmitted(true);
    track("checkout_submit", { total, items: items.length });
  };

  if (submitted) return <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center"><h2 className="text-display text-white mb-3 lux-section-title">Заказ оформлен</h2><p className="text-neutral-300 mb-6">Менеджер свяжется с вами в течение 15 минут.</p><Link to="/catalog" className="btn-primary">Вернуться в каталог</Link></div></section>;

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><h2 className="text-display text-white mb-6 lux-section-title">Оформление заказа</h2><div className="grid lg:grid-cols-12 gap-6"><form onSubmit={submit} className="lg:col-span-8 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя" className="input-main w-full" /><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон" className="input-main w-full" /><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-main w-full" /><input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город" className="input-main w-full" /><input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Адрес/ПВЗ" className="input-main w-full" /><textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Комментарий к заказу" className="input-main w-full min-h-24" /><button type="submit" className="btn-primary">Подтвердить заказ</button></form><aside className="lg:col-span-4"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sticky top-24"><p className="text-neutral-400 mb-2">К оплате</p><p className="text-white text-3xl mb-4">{total.toLocaleString("ru-RU")} ₽</p><p className="text-neutral-400 text-sm">После подтверждения вы получите сообщение в WhatsApp/Telegram.</p></div></aside></div></section>;
}

function QuizSection({ onComplete }: { onComplete: (result: Product[]) => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const steps = [
    { id: "mood", title: "Какое настроение хотите передать?", options: [{ l: "Свежесть", v: "fresh" }, { l: "Смелость", v: "bold" }, { l: "Романтика", v: "romantic" }, { l: "Таинственность", v: "mysterious" }] },
    { id: "season", title: "Для какого сезона?", options: [{ l: "Лето", v: "summer" }, { l: "Зима", v: "winter" }, { l: "На весь год", v: "all" }] },
    { id: "style", title: "Где чаще будете носить аромат?", options: [{ l: "Офис", v: "office" }, { l: "Вечер", v: "evening" }, { l: "Каждый день", v: "casual" }] },
    { id: "budget", title: "Ваш бюджет?", options: [{ l: "До 2 500 ₽", v: "low" }, { l: "2 500-3 200 ₽", v: "mid" }, { l: "От 3 200 ₽", v: "high" }] },
  ] as const;
  const current = steps[step];
  const pick = (value: string) => {
    const merged = { ...answers, [current.id]: value } as QuizAnswers;
    setAnswers(merged);
    if (step === steps.length - 1) {
      const scored = products.map((p) => ({ p, score: p.popularity + (merged.mood === "fresh" && p.family === "цитрус" ? 10 : 0) + (merged.style === "office" && p.scenarios.includes("офис") ? 10 : 0) + (merged.budget === "low" && getDiscountedPrice(p) <= 2500 ? 8 : 0) }));
      onComplete(scored.sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.p));
      return;
    }
    setStep((prev) => prev + 1);
  };
  return <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 page-enter"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8"><p className="text-sm text-[#e7b16c] mb-2">Подбор аромата • Шаг {step + 1}/{steps.length}</p><h2 className="text-3xl text-white mb-6">{current.title}</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{current.options.map((o) => <button key={o.v} onClick={() => pick(o.v)} className="btn-secondary text-left">{o.l}</button>)}</div></div></section>;
}

function QuizResults({ items, onReset, onProductClick, onToggleFavorite, favorites }: { items: Product[]; onReset: () => void; onProductClick: (p: Product) => void; onToggleFavorite: (id: number) => void; favorites: Set<number> }) {
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 page-enter"><div className="flex items-center justify-between mb-6 gap-3 flex-wrap"><div><h2 className="text-display text-white mb-2 lux-section-title">Ваш персональный подбор</h2><p className="text-neutral-400">Топ-5 ароматов под ваш стиль и сценарий использования.</p></div><button onClick={onReset} className="btn-secondary">Пройти заново</button></div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">{items.map((p) => <article key={p.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"><img src={p.image} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-3" loading="lazy" /><h3 className="text-white mb-1 lux-card-title">{p.name}</h3><p className="text-neutral-400 text-sm mb-3">{p.family}</p><div className="flex gap-2"><button onClick={() => onProductClick(p)} className="btn-secondary flex-1">Открыть</button><button onClick={() => onToggleFavorite(p.id)} className={`btn-secondary ${favorites.has(p.id) ? "border-[#d89b4a] text-[#f3c98f]" : ""}`}><Heart className={`w-4 h-4 ${favorites.has(p.id) ? "fill-current" : ""}`} /></button></div></article>)}</div></section>;
}

function GuidesPage() {
  const guides = [
    { title: "Как выбрать аромат по сезону", text: "Простой алгоритм выбора, чтобы аромат звучал чисто и дорого в любую погоду." },
    { title: "Как проверить стойкость корректно", text: "Нанесение, тайминг и точки фиксации, которые дают честный результат." },
    { title: "Распив vs полноразмер", text: "Когда выгоднее тестировать, а когда сразу брать большой объем." },
  ];
  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><h2 className="text-display text-white mb-6 lux-section-title">Гид по ароматам</h2><div className="grid md:grid-cols-3 gap-4 mb-8">{guides.map((g) => <article key={g.title} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"><h3 className="text-white mb-2 lux-card-title">{g.title}</h3><p className="text-neutral-400 text-sm">{g.text}</p></article>)}</div><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6"><h3 className="text-white text-2xl mb-3 lux-section-title">SEO-материал для органики</h3><p className="text-neutral-300 mb-2">Распив помогает снизить риск неудачной покупки и подобрать аромат под реальные условия жизни: офис, вечер, сезон, стиль одежды.</p><p className="text-neutral-300 mb-2">Atelier URBNWAVE расширяет выбор и повышает LTV: после теста именитых направлений клиент переходит на вашу авторскую линейку.</p><p className="text-neutral-300">Для лучшего результата сочетайте квиз, фильтры и страницу товара с пирамидами нот и сценариями использования.</p></div></section>;
}

function AnalyticsPage() {
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  const base = endpoint ? endpoint.replace(/\/collect\/?$/, "") : "http://localhost:8787";
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`${base}/metrics`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [base]);

  if (loading) return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-neutral-300">Загружаем аналитику...</div></section>;
  if (!metrics) return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"><h2 className="text-display text-white mb-3 lux-section-title">Аналитика недоступна</h2><p className="text-neutral-300">Запустите <code>npm run analytics:server</code>, затем обновите страницу.</p></div></section>;

  const totals = metrics.totals ?? {};
  const byEvent = Object.entries(metrics.byEvent ?? {}) as Array<[string, number]>;
  const topPaths = Object.entries(metrics.topPaths ?? {}) as Array<[string, number]>;
  const funnel = metrics.funnel ?? {};

  return <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter"><h2 className="text-display text-white mb-6 lux-section-title">Аналитика продаж и поведения</h2><div className="grid md:grid-cols-4 gap-4 mb-6">{[{ l: "События", v: totals.events ?? 0 }, { l: "Клиенты", v: totals.clients ?? 0 }, { l: "24 часа", v: totals.last24h ?? 0 }, { l: "CR checkout", v: `${funnel.conversionPercent ?? 0}%` }].map((i) => <article key={i.l} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"><p className="text-neutral-400 text-sm mb-1">{i.l}</p><p className="text-white text-3xl">{i.v}</p></article>)}</div><div className="grid lg:grid-cols-2 gap-5"><article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"><h3 className="text-white mb-3">События</h3><div className="space-y-2">{byEvent.map(([name, count]) => <div key={name} className="flex items-center justify-between border border-neutral-800 rounded-xl px-3 py-2"><span className="text-neutral-300">{name}</span><span className="text-white">{count}</span></div>)}</div></article><article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5"><h3 className="text-white mb-3">Топ страниц</h3><div className="space-y-2">{topPaths.map(([name, count]) => <div key={name} className="flex items-center justify-between border border-neutral-800 rounded-xl px-3 py-2"><span className="text-neutral-300 truncate">{name || "/"}</span><span className="text-white">{count}</span></div>)}</div></article></div></section>;
}

function InfoPage({ title, text }: { title: string; text: string }) {
  return <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter"><div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8"><h2 className="text-display text-white mb-4 lux-section-title lux-rule-center">{title}</h2><p className="text-neutral-300 leading-relaxed mb-8">{text}</p><Link to="/catalog" className="btn-primary inline-flex">Перейти в каталог</Link></div></section>;
}

function ProductRoute({ onAddToCart, onToggleFavorite, favorites, onProductClick }: { onAddToCart: (product: Product, volume?: number) => void; onToggleFavorite: (id: number) => void; favorites: Set<number>; onProductClick: (product: Product) => void }) {
  const { id } = useParams();
  const product = products.find((item) => item.id === Number(id));
  if (!product) return <Navigate to="/catalog" replace />;
  return <ProductPage product={product} onAddToCart={onAddToCart} onToggleFavorite={onToggleFavorite} favorites={favorites} onProductClick={onProductClick} />;
}

function Footer({ onToast }: { onToast: (text: string) => void }) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const telegramChatLink = "https://t.me/+BTrrEUr72ioxMjYy";

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      onToast("Введите корректный email");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          source: "footer_form",
          page: window.location.pathname,
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Не удалось отправить подписку");
      }
      setEmail("");
      onToast("Подписка принята");
    } catch {
      onToast("Подписка временно недоступна. Напишите нам в Telegram.");
      window.open(telegramChatLink, "_blank", "noopener,noreferrer");
    } finally {
      setSubmitting(false);
    }
  };

  return <footer className="bg-neutral-900 border-t border-neutral-800 py-12 mt-12"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8"><div><h3 className="mb-4 text-white text-xl">URBNWAVE</h3><p className="text-neutral-400 text-sm">Премиальный распив и авторская Atelier-линейка.</p></div><div><h4 className="mb-4 text-white">Покупателям</h4><ul className="space-y-2 text-neutral-400 text-sm"><li><Link to="/delivery" className="hover:text-white">Доставка</Link></li><li><Link to="/returns" className="hover:text-white">Возврат</Link></li><li><Link to="/payment" className="hover:text-white">Оплата (скоро)</Link></li><li><Link to="/faq" className="hover:text-white">Вопросы</Link></li></ul></div><div><h4 className="mb-4 text-white">Контент</h4><ul className="space-y-2 text-neutral-400 text-sm"><li><Link to="/guides" className="hover:text-white">Гид по ароматам</Link></li><li><Link to="/quiz" className="hover:text-white">Подбор аромата</Link></li><li><Link to="/about" className="hover:text-white">О бренде</Link></li><li><Link to="/analytics" className="hover:text-white">Аналитика</Link></li></ul></div><div><h4 className="mb-4 text-white">Подписка</h4><p className="text-neutral-400 text-sm mb-4">Получайте новости и закрытые предложения.</p><form className="flex gap-2 mb-3" onSubmit={handleSubscribe}><input type="email" placeholder="Email" className="input-main flex-1" value={email} onChange={(event) => setEmail(event.target.value)} required /><button className="btn-primary" type="submit" aria-label="Подписаться" disabled={submitting}>{submitting ? "..." : "→"}</button></form><a href={telegramChatLink} target="_blank" rel="noreferrer" className="inline-flex text-sm text-[#e1ad63] hover:text-[#f2c687]">Обратная связь в Telegram</a></div></div><div className="mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-400 text-sm">© 2026 URBNWAVE. Все права защищены.</div></div></footer>;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadJSON<CartItem[]>(STORAGE_KEYS.cart, []));
  const [favorites, setFavorites] = useState<Set<number>>(() => new Set(loadJSON<number[]>(STORAGE_KEYS.favorites, [])));
  const [searchQuery, setSearchQuery] = useState("");
  const [prefs, setPrefs] = useState<CatalogPrefs>(() => loadJSON<CatalogPrefs>(STORAGE_KEYS.prefs, basePrefs));
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quizResults, setQuizResults] = useState<Product[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [accountProfile, setAccountProfile] = useState<AccountProfile | null>(() => loadJSON<AccountProfile | null>(STORAGE_KEYS.accountProfile, null));
  const [accountOrders, setAccountOrders] = useState<AccountOrder[]>(() => loadJSON<AccountOrder[]>(STORAGE_KEYS.accountOrders, []));
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cartItems)); }, [cartItems]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(Array.from(favorites))); }, [favorites]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.prefs, JSON.stringify(prefs)); }, [prefs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.accountProfile, JSON.stringify(accountProfile)); }, [accountProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.accountOrders, JSON.stringify(accountOrders)); }, [accountOrders]);
  useEffect(() => {
    const query = new URLSearchParams(location.search).get("q") ?? "";
    setSearchQuery(query);
  }, [location.search]);
  useEffect(() => {
    track("page_view", { route: location.pathname });
  }, [location.pathname]);
  useEffect(() => {
    if (location.pathname.startsWith("/product/")) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location.pathname]);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let mounted = true;
    const loadSiteSettings = async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("key, value")
        .in("key", ["hero", "menu", "benefits", "brand", "pages", "faq_items"]);
      if (error || !mounted) return;
      const next = { ...defaultSiteSettings };
      (data ?? []).forEach((row: any) => {
        if (row.key === "hero") next.hero = { ...next.hero, ...(row.value ?? {}) };
        if (row.key === "menu") next.menu = { ...next.menu, ...(row.value ?? {}) };
        if (row.key === "benefits") next.benefits = { ...next.benefits, ...(row.value ?? {}) };
        if (row.key === "brand") next.brand = { ...next.brand, ...(row.value ?? {}) };
        if (row.key === "pages") next.pages = { ...next.pages, ...(row.value ?? {}) };
        if (row.key === "faq_items") next.faqItems = Array.isArray(row.value?.items) ? row.value.items : next.faqItems;
      });
      setSiteSettings(next);
    };
    void loadSiteSettings();
    const timer = setInterval(() => {
      void loadSiteSettings();
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !accountProfile?.phone) return;
    let mounted = true;
    const normalize = (value?: string | null) => (value ?? "").replace(/\D/g, "");
    const localPhone = normalize(accountProfile.phone);
    const localEmail = accountProfile.email.trim().toLowerCase();
    const loadClientOrders = async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error || !mounted) return;
      const mapped: AccountOrder[] = (data ?? [])
        .filter((row: any) => {
          const byPhone = localPhone.length > 0 && normalize(row.customer_phone) === localPhone;
          const byEmail = localEmail.length > 0 && String(row.customer_email ?? "").trim().toLowerCase() === localEmail;
          return byPhone || byEmail;
        })
        .map((row: any) => {
          const rowItems = Array.isArray(row.items) ? row.items : [];
          return {
            id: String(row.id),
            createdAt: row.created_at ?? new Date().toISOString(),
            status: row.status ?? "new",
            total: Number(row.total ?? 0),
            items: rowItems.map((item: any) => {
              const source = products.find((p) => p.name === item.name);
              return {
                id: source?.id ?? 0,
                name: String(item.name ?? source?.name ?? "Товар"),
                image: source?.image ?? "/images/perfume/photo_20_2026-03-03_11-43-39.jpg",
                selectedVolume: Number(item.volume ?? source?.volume ?? 10),
                quantity: Number(item.qty ?? 1),
                unitPrice: Number(item.price ?? source?.price ?? 0),
              };
            }),
          };
        });
      setAccountOrders(mapped);
    };
    void loadClientOrders();
    const timer = setInterval(() => {
      void loadClientOrders();
    }, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [accountProfile?.phone, accountProfile?.email]);

  const pushToast = (text: string) => { const id = Date.now() + Math.floor(Math.random() * 1000); setToasts((p) => [...p, { id, text }]); setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 2200); };
  const handleAddToCart = (product: Product, volume = product.volume) => { const cartKey = `${product.id}-${volume}`; const unitPrice = getPriceForVolume(product, volume); setCartItems((prev) => { const existing = prev.find((i) => i.cartKey === cartKey); if (!existing) return [...prev, { ...product, quantity: 1, selectedVolume: volume, unitPrice, cartKey }]; return prev.map((i) => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i); }); pushToast(`Добавлено в корзину: ${product.name} (${volume} мл)`); track("add_to_cart", { productId: product.id, volume }); };
  const handleUpdateQuantity = (key: string, quantity: number) => setCartItems((prev) => prev.map((i) => i.cartKey === key ? { ...i, quantity } : i));
  const handleRemoveFromCart = (key: string) => setCartItems((prev) => prev.filter((i) => i.cartKey !== key));
  const handleProductClick = (product: Product) => navigate(`/product/${product.id}`);
  const handleToggleFavorite = (productId: number) => setFavorites((prev) => { const next = new Set(prev); next.has(productId) ? next.delete(productId) : next.add(productId); return next; });
  const handleOrderComplete = (payload: CheckoutPayload) => {
    const order: AccountOrder = {
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      status: "new",
      total: payload.total,
      items: payload.items.map((item) => ({
        id: item.id,
        name: item.name,
        image: item.image,
        selectedVolume: item.selectedVolume,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };
    setAccountProfile(payload.customer);
    setAccountOrders((prev) => [order, ...prev].slice(0, 30));
    setCartItems([]);
    track("account_order_saved", { total: payload.total, items: payload.items.length });

    if (isSupabaseConfigured && supabase) {
      void supabase
        .from("orders")
        .insert({
          status: "new",
          customer_name: payload.customer.name,
          customer_phone: payload.customer.phone,
          customer_email: payload.customer.email || null,
          customer_city: payload.customer.city || null,
          total: payload.total,
          items: payload.items.map((item) => ({
            name: item.name,
            qty: item.quantity,
            volume: item.selectedVolume,
            price: item.unitPrice,
          })),
        })
        .then(({ error }) => {
          if (error) {
            pushToast(`Ошибка отправки в админку: ${error.message}`);
            return;
          }
          pushToast("Заказ отправлен в админку");
        });
    } else {
      pushToast("Заказ сохранен локально (Supabase не подключен)");
    }
  };
  const handleRepeatOrder = (order: AccountOrder) => {
    setCartItems((prev) => {
      const next = [...prev];
      order.items.forEach((it) => {
        const cartKey = `${it.id}-${it.selectedVolume}`;
        const existing = next.find((x) => x.cartKey === cartKey);
        if (existing) {
          existing.quantity += it.quantity;
          return;
        }
        const source = products.find((p) => p.id === it.id);
        if (!source) return;
        next.push({
          ...source,
          cartKey,
          quantity: it.quantity,
          selectedVolume: it.selectedVolume,
          unitPrice: it.unitPrice,
        });
      });
      return next;
    });
    pushToast("Позиции добавлены в корзину");
    navigate("/cart");
  };
  const handleSaveProfile = (next: AccountProfile) => {
    setAccountProfile(next);
    pushToast("Профиль сохранен");
    track("account_login", { hasCity: Boolean(next.city) });
  };
  const handleLogout = () => {
    setAccountProfile(null);
    pushToast("Вы вышли из кабинета");
  };

  const handleSearchSubmit = () => {
    const normalized = searchQuery.trim();
    track("search_submit", { hasQuery: normalized.length > 0, queryLength: normalized.length });
    navigate(normalized ? `/catalog?q=${encodeURIComponent(normalized)}` : "/catalog");
  };
  const handlePriceChange = (value: [number, number]) => setPrefs((p) => ({ ...p, priceRange: [Math.min(value[0], value[1]), Math.max(value[0], value[1])] }));
  const sharedCatalogProps = { searchQuery, prefs, onSearchChange: setSearchQuery, onFilterChange: (value: string) => setPrefs((p) => ({ ...p, activeFilter: value })), onSortChange: (value: SortBy) => setPrefs((p) => ({ ...p, sortBy: value })), onPriceChange: handlePriceChange, onVolumeToggle: (v: number) => setPrefs((p) => ({ ...p, selectedVolumes: p.selectedVolumes.includes(v) ? p.selectedVolumes.filter((x) => x !== v) : [...p.selectedVolumes, v] })), onFamilyToggle: (f: Product["family"]) => setPrefs((p) => ({ ...p, selectedFamilies: p.selectedFamilies.includes(f) ? p.selectedFamilies.filter((x) => x !== f) : [...p.selectedFamilies, f] })), onScenarioToggle: (s: string) => setPrefs((p) => ({ ...p, selectedScenarios: p.selectedScenarios.includes(s) ? p.selectedScenarios.filter((x) => x !== s) : [...p.selectedScenarios, s] })), onLongevityToggle: (v: Longevity) => setPrefs((p) => ({ ...p, selectedLongevity: p.selectedLongevity.includes(v) ? p.selectedLongevity.filter((x) => x !== v) : [...p.selectedLongevity, v] })), onResetFilters: () => { setPrefs(basePrefs); setSearchQuery(""); }, onAddToCart: (p: Product) => handleAddToCart(p, p.volume), onProductClick: handleProductClick, onToggleFavorite: handleToggleFavorite, onQuickView: setQuickViewProduct, favorites };
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const favoriteProducts = products.filter((p) => favorites.has(p.id));

  return <div className="min-h-screen bg-neutral-950"><SeoManager path={location.pathname} /><Header cartItemCount={totalItems} favoriteCount={favorites.size} searchQuery={searchQuery} onSearchChange={setSearchQuery} isAuthorized={Boolean(accountProfile)} menuLabels={siteSettings.menu} onSearchSubmit={handleSearchSubmit} /><ToastStack toasts={toasts} /><AnimatePresence mode="wait" initial={false}><motion.main key={`${location.pathname}${location.search}`} initial={{ opacity: 0, y: 14, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -10, filter: "blur(3px)" }} transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}><Routes location={location}><Route path="/" element={<HomePage {...sharedCatalogProps} hero={siteSettings.hero} benefits={siteSettings.benefits} brand={siteSettings.brand} />} /><Route path="/catalog" element={<CatalogSection {...sharedCatalogProps} title="Распив и Atelier" subtitle="Именитые ароматы в распиве и вдохновленная линейка" items={products} showFilter={true} />} /><Route path="/decants" element={<><CatalogSection {...sharedCatalogProps} title="Именитые распивы" subtitle="Популярные брендовые композиции" items={products.filter((x) => x.category === "Именитые распивы")} showFilter={false} /><SeoLandingBlock title="Именитые распивы: выгодный тест перед полноразмером" paragraphs={["Распив позволяет безопасно познакомиться с дорогими парфюмерными направлениями и выбрать аромат под личный стиль.", "Для SEO это важная посадочная страница под запросы о тестировании и подборе нишевых композиций."]} faq={[{ q: "Чем распив выгоднее полноразмера?", a: "Вы получаете возможность проверить аромат в реальных условиях, не переплачивая за большой объем." }, { q: "Кому подходит распив?", a: "Новичкам в нишевой парфюмерии и тем, кто выбирает аромат под сезон/сценарий." }]} /></>} /><Route path="/atelier" element={<><CatalogSection {...sharedCatalogProps} title="Atelier URBNWAVE" subtitle="Вдохновленные композиции бренда" items={products.filter((x) => x.category === "Atelier URBNWAVE · Вдохновленные")} showFilter={false} /><SeoLandingBlock title="Atelier URBNWAVE: авторская линейка бренда" paragraphs={["Atelier-линейка усиливает доверие после распива и переводит покупателя в ваш собственный продукт.", "На странице собраны композиции с разным характером: от легкого citrus до густых evening-аккордов."]} faq={[{ q: "В чем отличие Atelier от именитых распивов?", a: "Atelier — это ваша собственная интерпретация ароматических направлений, а не копия брендов." }, { q: "С чего начать знакомство?", a: "С компактных объемов 5-10 мл и мини-квиза под ваш стиль." }]} /></>} /><Route path="/top-decants" element={<CatalogSection {...sharedCatalogProps} title="Популярные распивы" subtitle="Топ ароматы по интересу покупателей" items={[...products].sort((a, b) => b.popularity - a.popularity).slice(0, 8)} showFilter={false} />} /><Route path="/favorites" element={<CatalogSection {...sharedCatalogProps} title="Избранное" subtitle="Ваш персональный список ароматов" items={favoriteProducts} showFilter={false} />} /><Route path="/quiz" element={quizResults.length === 0 ? <QuizSection onComplete={setQuizResults} /> : <QuizResults items={quizResults} onReset={() => setQuizResults([])} onProductClick={handleProductClick} onToggleFavorite={handleToggleFavorite} favorites={favorites} />} /><Route path="/cart" element={<CartPage items={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemoveFromCart={handleRemoveFromCart} />} /><Route path="/checkout" element={<CheckoutPage items={cartItems} profile={accountProfile} onOrderComplete={handleOrderComplete} />} /><Route path="/product/:id" element={<ProductRoute onAddToCart={handleAddToCart} onToggleFavorite={handleToggleFavorite} favorites={favorites} onProductClick={handleProductClick} />} /><Route path="/guides" element={<GuidesPage />} /><Route path="/analytics" element={<AnalyticsPage />} /><Route path="/account" element={<AccountPage profile={accountProfile} orders={accountOrders} favoriteProducts={favoriteProducts} onSaveProfile={handleSaveProfile} onLogout={handleLogout} onRepeatOrder={handleRepeatOrder} onOpenProduct={handleProductClick} />} /><Route path="/admin" element={<AdminPage />} /><Route path="/delivery" element={<InfoPage title={siteSettings.pages.delivery.title} text={siteSettings.pages.delivery.text} />} /><Route path="/returns" element={<InfoPage title={siteSettings.pages.returns.title} text={siteSettings.pages.returns.text} />} /><Route path="/payment" element={<InfoPage title={siteSettings.pages.payment.title} text={siteSettings.pages.payment.text} />} /><Route path="/faq" element={<FaqPage title={siteSettings.pages.faq.title} text={siteSettings.pages.faq.text} items={siteSettings.faqItems} />} /><Route path="/about" element={<InfoPage title={siteSettings.pages.about.title} text={siteSettings.pages.about.text} />} /><Route path="/contacts" element={<InfoPage title={siteSettings.pages.contacts.title} text={siteSettings.pages.contacts.text} />} /><Route path="/stores" element={<InfoPage title={siteSettings.pages.stores.title} text={siteSettings.pages.stores.text} />} /><Route path="/careers" element={<InfoPage title={siteSettings.pages.careers.title} text={siteSettings.pages.careers.text} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></motion.main></AnimatePresence><QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} onAddToCart={(p) => handleAddToCart(p, p.volume)} onToggleFavorite={handleToggleFavorite} isFavorite={quickViewProduct ? favorites.has(quickViewProduct.id) : false} /><Footer onToast={pushToast} /></div>;
}





