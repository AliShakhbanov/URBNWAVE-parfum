import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

type AdminTab = "orders" | "products" | "content";

type DbOrder = {
  id: string;
  created_at: string;
  status: "new" | "confirmed" | "packed" | "shipped" | "done" | "cancelled";
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_city: string | null;
  total: number;
  items: Array<{ name: string; qty: number; volume: number; price: number }>;
};

const orderStatusLabels: Record<DbOrder["status"], string> = {
  new: "Новый",
  confirmed: "Подтвержден",
  packed: "Собран",
  shipped: "Отправлен",
  done: "Доставлен",
  cancelled: "Отменен",
};

type DbProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  volume: number;
  family: "цитрус" | "древесный" | "восточный" | "цветочный";
  is_new: boolean;
  is_hit: boolean;
  sale_percent: number | null;
  popularity: number;
  release_year: number;
  longevity: "легкий" | "средний" | "стойкий";
  inspired_by: string | null;
  notes: { top: string[]; heart: string[]; base: string[] };
  scenarios: string[];
  gallery: string[] | null;
};

type SiteContent = {
  hero: {
    title: string;
    subtitle: string;
    badge: string;
    image: string;
  };
  menu: {
    catalog: string;
    decants: string;
    atelier: string;
    top: string;
    quiz: string;
  };
  benefits: {
    items: Array<{ title: string; text: string }>;
  };
  brand: {
    title: string;
    subtitle: string;
    image: string;
    points: string[];
  };
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

const defaultSiteContent: SiteContent = {
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

const emptyProduct: DbProduct = {
  id: 0,
  name: "",
  category: "Atelier URBNWAVE · Вдохновленные",
  price: 2990,
  image: "/images/perfume/photo_20_2026-03-03_11-43-39.jpg",
  description: "",
  volume: 10,
  family: "восточный",
  is_new: true,
  is_hit: false,
  sale_percent: null,
  popularity: 80,
  release_year: new Date().getFullYear(),
  longevity: "средний",
  inspired_by: "",
  notes: { top: ["нота 1"], heart: ["нота 2"], base: ["нота 3"] },
  scenarios: ["вечер"],
  gallery: [],
};

const pageLabels: Array<{ key: keyof SiteContent["pages"]; label: string }> = [
  { key: "delivery", label: "Доставка" },
  { key: "returns", label: "Возврат" },
  { key: "payment", label: "Оплата" },
  { key: "faq", label: "FAQ" },
  { key: "about", label: "О бренде" },
  { key: "contacts", label: "Контакты" },
  { key: "stores", label: "Магазины" },
  { key: "careers", label: "Карьера" },
];

export function AdminPage() {
  const [sessionEmail, setSessionEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [editing, setEditing] = useState<DbProduct>(emptyProduct);
  const [isEditMode, setIsEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const canUseSupabase = useMemo(() => isSupabaseConfigured && supabase, []);

  useEffect(() => {
    if (!canUseSupabase) return;
    supabase!.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? "");
    });
    const { data: sub } = supabase!.auth.onAuthStateChange((_evt, session) => {
      setSessionEmail(session?.user.email ?? "");
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [canUseSupabase]);

  useEffect(() => {
    if (!sessionEmail) return;
    void loadOrders();
    void loadProducts();
    void loadContent();
  }, [sessionEmail]);
  useEffect(() => {
    if (!sessionEmail || tab !== "orders") return;
    const timer = setInterval(() => {
      void loadOrders();
    }, 10000);
    return () => clearInterval(timer);
  }, [sessionEmail, tab]);

  const uploadAsset = async (file: File, folder = "cms") => {
    if (!supabase) throw new Error("Supabase не подключен");
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("site-assets").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, onDone: (url: string) => void, folder = "cms") => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setMessage("");
      const url = await uploadAsset(file, folder);
      onDone(url);
      setMessage("Изображение загружено");
    } catch (error: any) {
      setMessage(`Ошибка загрузки: ${error?.message ?? "не удалось загрузить"}. Убедитесь, что bucket site-assets создан.`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const loadOrders = async () => {
    const { data, error } = await supabase!
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      setMessage(`Ошибка заказов: ${error.message}`);
      return;
    }
    setOrders((data ?? []) as DbOrder[]);
  };

  const loadProducts = async () => {
    const { data, error } = await supabase!
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    if (error) {
      setMessage(`Ошибка товаров: ${error.message}`);
      return;
    }
    setProducts((data ?? []) as DbProduct[]);
  };

  const loadContent = async () => {
    const { data, error } = await supabase!
      .from("site_content")
      .select("key, value")
      .in("key", ["hero", "menu", "benefits", "brand", "pages", "faq_items"]);
    if (error) {
      setMessage(`Ошибка контента: ${error.message}`);
      return;
    }
    const next = { ...defaultSiteContent };
    (data ?? []).forEach((row: any) => {
      if (row.key === "hero") next.hero = { ...next.hero, ...(row.value ?? {}) };
      if (row.key === "menu") next.menu = { ...next.menu, ...(row.value ?? {}) };
      if (row.key === "benefits") next.benefits = { ...next.benefits, ...(row.value ?? {}) };
      if (row.key === "brand") next.brand = { ...next.brand, ...(row.value ?? {}) };
      if (row.key === "pages") next.pages = { ...next.pages, ...(row.value ?? {}) };
      if (row.key === "faq_items") next.faqItems = Array.isArray(row.value?.items) ? row.value.items : next.faqItems;
    });
    setContent(next);
  };

  const login = async (e: FormEvent) => {
    e.preventDefault();
    if (!canUseSupabase) return;
    setAuthLoading(true);
    setMessage("");
    const { error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
    setAuthLoading(false);
  };

  const logout = async () => {
    if (!canUseSupabase) return;
    await supabase!.auth.signOut();
  };

  const updateOrderStatus = async (id: string, status: DbOrder["status"]) => {
    const { error } = await supabase!.from("orders").update({ status }).eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  };

  const startCreate = () => {
    setEditing({ ...emptyProduct, id: 0 });
    setIsEditMode(false);
  };

  const startEdit = (product: DbProduct) => {
    setEditing(product);
    setIsEditMode(true);
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = { ...editing };
    if (!payload.name.trim()) {
      setMessage("Название обязательно");
      setSaving(false);
      return;
    }
    const { error } = isEditMode
      ? await supabase!.from("products").update(payload).eq("id", payload.id)
      : await supabase!.from("products").insert({ ...payload, id: undefined });
    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }
    await loadProducts();
    setSaving(false);
    setMessage("Товар сохранен");
    if (!isEditMode) startCreate();
  };

  const removeProduct = async (id: number) => {
    const { error } = await supabase!.from("products").delete().eq("id", id);
    if (error) {
      setMessage(error.message);
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const saveContent = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    const { error } = await supabase!.from("site_content").upsert([
      { key: "hero", value: content.hero },
      { key: "menu", value: content.menu },
      { key: "benefits", value: content.benefits },
      { key: "brand", value: content.brand },
      { key: "pages", value: content.pages },
      { key: "faq_items", value: { items: content.faqItems } },
    ], { onConflict: "key" });
    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }
    setSaving(false);
    setMessage("Контент сохранен");
  };

  if (!canUseSupabase) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <h1 className="text-display text-white mb-4">Admin · Supabase</h1>
          <p className="text-neutral-300 mb-2">Supabase не настроен.</p>
          <p className="text-neutral-400 text-sm">Добавьте в `.env` переменные `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.</p>
        </div>
      </section>
    );
  }

  if (!sessionEmail) {
    return (
      <section className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <form onSubmit={login} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h1 className="text-display text-white mb-1">Admin Login</h1>
          <p className="text-neutral-400 text-sm">Вход в админку URBNWAVE</p>
          <input className="input-main w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-main w-full" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="btn-primary w-full" disabled={authLoading}>{authLoading ? "Входим..." : "Войти"}</button>
          {message && <p className="text-red-300 text-sm">{message}</p>}
        </form>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-display text-white">Admin Panel</h1>
          <p className="text-neutral-400">{sessionEmail}</p>
        </div>
        <button className="btn-secondary" onClick={logout}>Выйти</button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={`chip ${tab === "orders" ? "chip-active" : ""}`} onClick={() => setTab("orders")}>Заказы</button>
        <button className={`chip ${tab === "products" ? "chip-active" : ""}`} onClick={() => setTab("products")}>Товары</button>
        <button className={`chip ${tab === "content" ? "chip-active" : ""}`} onClick={() => setTab("content")}>Контент</button>
      </div>

      {message && <div className="mb-4 bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-neutral-200">{message}</div>}

      {tab === "orders" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button type="button" className="btn-secondary" onClick={() => void loadOrders()}>Обновить заказы</button>
          </div>
          {orders.length === 0 && <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-neutral-400">Заказов пока нет.</div>}
          {orders.map((order) => (
            <article key={order.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <p className="text-white">#{order.id.slice(0, 8)} · {order.customer_name} · {order.total.toLocaleString("ru-RU")} ₽ · {orderStatusLabels[order.status]}</p>
                <select className="input-main" value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as DbOrder["status"])}>
                  <option value="new">Новый</option>
                  <option value="confirmed">Подтвержден</option>
                  <option value="packed">Собран</option>
                  <option value="shipped">Отправлен</option>
                  <option value="done">Доставлен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              <p className="text-neutral-400 text-sm">{new Date(order.created_at).toLocaleString("ru-RU")} · {order.customer_phone} · {order.customer_city ?? "-"}</p>
            </article>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-2">
            {products.map((product) => (
              <article key={product.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white truncate">{product.name}</p>
                  <p className="text-neutral-400 text-sm">{product.category} · {product.price.toLocaleString("ru-RU")} ₽ · {product.volume} мл</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary" onClick={() => startEdit(product)}>Изменить</button>
                  <button className="btn-secondary border-red-500/30 text-red-300" onClick={() => removeProduct(product.id)}>Удалить</button>
                </div>
              </article>
            ))}
          </div>
          <form onSubmit={saveProduct} className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-xl">{isEditMode ? "Редактирование товара" : "Новый товар"}</h3>
              <button type="button" className="btn-secondary" onClick={startCreate}>Очистить</button>
            </div>
            <input className="input-main w-full" placeholder="Название" value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            <input className="input-main w-full" placeholder="Категория" value={editing.category} onChange={(e) => setEditing((p) => ({ ...p, category: e.target.value }))} />
            <input className="input-main w-full" placeholder="URL фото" value={editing.image} onChange={(e) => setEditing((p) => ({ ...p, image: e.target.value }))} />
            <label className="text-sm text-neutral-400">Загрузка фото товара в Storage
              <input type="file" accept="image/*" className="input-main w-full mt-1" onChange={(e) => void handleImageUpload(e, (url) => setEditing((p) => ({ ...p, image: url })), "products")} disabled={uploading} />
            </label>
            <textarea className="input-main w-full min-h-20" placeholder="Описание" value={editing.description} onChange={(e) => setEditing((p) => ({ ...p, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2">
              <input className="input-main w-full" type="number" placeholder="Цена" value={editing.price} onChange={(e) => setEditing((p) => ({ ...p, price: Number(e.target.value) }))} />
              <input className="input-main w-full" type="number" placeholder="Объем" value={editing.volume} onChange={(e) => setEditing((p) => ({ ...p, volume: Number(e.target.value) }))} />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={saving}>{saving ? "Сохраняем..." : "Сохранить товар"}</button>
          </form>
        </div>
      )}

      {tab === "content" && (
        <form onSubmit={saveContent} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-white text-2xl">Контент сайта</h3>
            <p className="text-neutral-400 text-sm">Главный баннер, блоки главной, меню и сервисные страницы.</p>
          </div>

          <div className="space-y-3 border border-neutral-800 rounded-xl p-4">
            <h4 className="text-white text-lg">Hero</h4>
            <input className="input-main w-full" placeholder="Hero title" value={content.hero.title} onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, title: e.target.value } }))} />
            <input className="input-main w-full" placeholder="Hero subtitle" value={content.hero.subtitle} onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, subtitle: e.target.value } }))} />
            <input className="input-main w-full" placeholder="Hero badge" value={content.hero.badge} onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, badge: e.target.value } }))} />
            <input className="input-main w-full" placeholder="Hero image URL" value={content.hero.image} onChange={(e) => setContent((c) => ({ ...c, hero: { ...c.hero, image: e.target.value } }))} />
            <label className="text-sm text-neutral-400">Загрузка hero-изображения
              <input type="file" accept="image/*" className="input-main w-full mt-1" onChange={(e) => void handleImageUpload(e, (url) => setContent((c) => ({ ...c, hero: { ...c.hero, image: url } })), "cms/hero")} disabled={uploading} />
            </label>
          </div>

          <div className="space-y-3 border border-neutral-800 rounded-xl p-4">
            <h4 className="text-white text-lg">Меню</h4>
            <div className="grid md:grid-cols-2 gap-2">
              <input className="input-main w-full" placeholder="Меню: Каталог" value={content.menu.catalog} onChange={(e) => setContent((c) => ({ ...c, menu: { ...c.menu, catalog: e.target.value } }))} />
              <input className="input-main w-full" placeholder="Меню: Именитые" value={content.menu.decants} onChange={(e) => setContent((c) => ({ ...c, menu: { ...c.menu, decants: e.target.value } }))} />
              <input className="input-main w-full" placeholder="Меню: Atelier" value={content.menu.atelier} onChange={(e) => setContent((c) => ({ ...c, menu: { ...c.menu, atelier: e.target.value } }))} />
              <input className="input-main w-full" placeholder="Меню: Популярные" value={content.menu.top} onChange={(e) => setContent((c) => ({ ...c, menu: { ...c.menu, top: e.target.value } }))} />
              <input className="input-main w-full" placeholder="Меню: Подбор" value={content.menu.quiz} onChange={(e) => setContent((c) => ({ ...c, menu: { ...c.menu, quiz: e.target.value } }))} />
            </div>
          </div>

          <div className="space-y-3 border border-neutral-800 rounded-xl p-4">
            <h4 className="text-white text-lg">Преимущества под hero</h4>
            {content.benefits.items.map((item, index) => (
              <div key={`benefit_${index}`} className="grid md:grid-cols-2 gap-2">
                <input className="input-main w-full" placeholder={`Преимущество ${index + 1} — заголовок`} value={item.title} onChange={(e) => setContent((c) => ({ ...c, benefits: { items: c.benefits.items.map((x, i) => i === index ? { ...x, title: e.target.value } : x) } }))} />
                <input className="input-main w-full" placeholder={`Преимущество ${index + 1} — текст`} value={item.text} onChange={(e) => setContent((c) => ({ ...c, benefits: { items: c.benefits.items.map((x, i) => i === index ? { ...x, text: e.target.value } : x) } }))} />
              </div>
            ))}
          </div>

          <div className="space-y-3 border border-neutral-800 rounded-xl p-4">
            <h4 className="text-white text-lg">Бренд-блок главной</h4>
            <input className="input-main w-full" placeholder="Brand title" value={content.brand.title} onChange={(e) => setContent((c) => ({ ...c, brand: { ...c.brand, title: e.target.value } }))} />
            <textarea className="input-main w-full min-h-20" placeholder="Brand subtitle" value={content.brand.subtitle} onChange={(e) => setContent((c) => ({ ...c, brand: { ...c.brand, subtitle: e.target.value } }))} />
            <input className="input-main w-full" placeholder="Brand image URL" value={content.brand.image} onChange={(e) => setContent((c) => ({ ...c, brand: { ...c.brand, image: e.target.value } }))} />
            <label className="text-sm text-neutral-400">Загрузка изображения бренд-блока
              <input type="file" accept="image/*" className="input-main w-full mt-1" onChange={(e) => void handleImageUpload(e, (url) => setContent((c) => ({ ...c, brand: { ...c.brand, image: url } })), "cms/brand")} disabled={uploading} />
            </label>
            {content.brand.points.map((point, index) => (
              <input key={`brand_point_${index}`} className="input-main w-full" placeholder={`Пункт ${index + 1}`} value={point} onChange={(e) => setContent((c) => ({ ...c, brand: { ...c.brand, points: c.brand.points.map((x, i) => i === index ? e.target.value : x) } }))} />
            ))}
          </div>

          <div className="space-y-3 border border-neutral-800 rounded-xl p-4">
            <h4 className="text-white text-lg">Сервисные страницы</h4>
            {pageLabels.map((page) => (
              <div key={page.key} className="space-y-2 border border-neutral-800 rounded-xl p-3">
                <p className="text-sm text-neutral-400">{page.label}</p>
                <input className="input-main w-full" placeholder={`${page.label} — заголовок`} value={content.pages[page.key].title} onChange={(e) => setContent((c) => ({ ...c, pages: { ...c.pages, [page.key]: { ...c.pages[page.key], title: e.target.value } } }))} />
                <textarea className="input-main w-full min-h-20" placeholder={`${page.label} — текст`} value={content.pages[page.key].text} onChange={(e) => setContent((c) => ({ ...c, pages: { ...c.pages, [page.key]: { ...c.pages[page.key], text: e.target.value } } }))} />
              </div>
            ))}
          </div>

          <div className="space-y-3 border border-neutral-800 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-white text-lg">Вопросы и ответы (FAQ)</h4>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setContent((c) => ({ ...c, faqItems: [...c.faqItems, { question: "", answer: "" }] }))}
              >
                Добавить вопрос
              </button>
            </div>
            {content.faqItems.map((item, index) => (
              <div key={`faq_item_${index}`} className="space-y-2 border border-neutral-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-neutral-400">Вопрос #{index + 1}</p>
                  <button
                    type="button"
                    className="btn-secondary border-red-500/30 text-red-300"
                    onClick={() => setContent((c) => ({ ...c, faqItems: c.faqItems.filter((_, i) => i !== index) }))}
                  >
                    Удалить
                  </button>
                </div>
                <input
                  className="input-main w-full"
                  placeholder="Вопрос"
                  value={item.question}
                  onChange={(e) => setContent((c) => ({ ...c, faqItems: c.faqItems.map((x, i) => i === index ? { ...x, question: e.target.value } : x) }))}
                />
                <textarea
                  className="input-main w-full min-h-20"
                  placeholder="Ответ"
                  value={item.answer}
                  onChange={(e) => setContent((c) => ({ ...c, faqItems: c.faqItems.map((x, i) => i === index ? { ...x, answer: e.target.value } : x) }))}
                />
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={saving || uploading}>{saving ? "Сохраняем..." : "Сохранить контент"}</button>
        </form>
      )}
    </section>
  );
}
