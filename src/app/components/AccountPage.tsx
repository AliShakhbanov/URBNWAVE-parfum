import { useState } from "react";
import { Link } from "react-router-dom";
import { Product } from "./ProductCard";

export interface AccountProfile {
  name: string;
  phone: string;
  email: string;
  city?: string;
}

export interface AccountOrderItem {
  id: number;
  name: string;
  image: string;
  selectedVolume: number;
  quantity: number;
  unitPrice: number;
}

export interface AccountOrder {
  id: string;
  createdAt: string;
  status: "new" | "confirmed" | "packed" | "shipped" | "done" | "cancelled";
  total: number;
  items: AccountOrderItem[];
}

const accountOrderStatusLabels: Record<AccountOrder["status"], string> = {
  new: "Новый",
  confirmed: "Подтвержден",
  packed: "Собран",
  shipped: "Отправлен",
  done: "Доставлен",
  cancelled: "Отменен",
};

interface AccountPageProps {
  profile: AccountProfile | null;
  orders: AccountOrder[];
  favoriteProducts: Product[];
  onSaveProfile: (next: AccountProfile) => void;
  onLogout: () => void;
  onRepeatOrder: (order: AccountOrder) => void;
  onOpenProduct: (product: Product) => void;
}

export function AccountPage({
  profile,
  orders,
  favoriteProducts,
  onSaveProfile,
  onLogout,
  onRepeatOrder,
  onOpenProduct,
}: AccountPageProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");

  if (!profile) {
    const submit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!name.trim() || !phone.trim() || !email.trim()) return;
      onSaveProfile({ name: name.trim(), phone: phone.trim(), email: email.trim(), city: city.trim() });
    };

    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 md:p-8">
          <h1 className="text-display text-white mb-3 lux-section-title">Личный кабинет</h1>
          <p className="text-neutral-400 mb-6">Войдите, чтобы сохранить историю заказов и быстрые повторные покупки.</p>
          <form onSubmit={submit} className="space-y-4">
            <input className="input-main w-full" placeholder="Имя" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input-main w-full" placeholder="Телефон" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input-main w-full" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input-main w-full" placeholder="Город (необязательно)" value={city} onChange={(e) => setCity(e.target.value)} />
            <button type="submit" className="btn-primary w-full">Войти</button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 page-enter">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-display text-white mb-2 lux-section-title">Личный кабинет</h1>
          <p className="text-neutral-400">{profile.name} · {profile.phone} · {profile.email}</p>
        </div>
        <button onClick={onLogout} className="btn-secondary">Выйти</button>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 mb-8">
        <article className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-neutral-400 text-sm mb-2">Заказы</p>
          <p className="text-white text-3xl">{orders.length}</p>
        </article>
        <article className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-neutral-400 text-sm mb-2">Избранное</p>
          <p className="text-white text-3xl">{favoriteProducts.length}</p>
        </article>
        <article className="lg:col-span-4 bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <p className="text-neutral-400 text-sm mb-2">Город</p>
          <p className="text-white text-3xl">{profile.city?.trim() || "-"}</p>
        </article>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h2 className="text-white text-2xl mb-4 lux-section-title">История заказов</h2>
          {orders.length === 0 && (
            <div className="text-neutral-400">
              Заказов пока нет. <Link className="text-white underline" to="/catalog">Перейти в каталог</Link>
            </div>
          )}
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-neutral-800 rounded-xl p-4 bg-neutral-950">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-white">Заказ #{order.id.slice(-6)}</p>
                  <span className="text-xs px-2 py-1 rounded-full border border-neutral-700 text-neutral-300">
                    {accountOrderStatusLabels[order.status]}
                  </span>
                </div>
                <p className="text-neutral-400 text-sm mb-2">{new Date(order.createdAt).toLocaleString("ru-RU")}</p>
                <p className="text-neutral-300 mb-3">{order.items.length} поз. · {order.total.toLocaleString("ru-RU")} ₽</p>
                <button onClick={() => onRepeatOrder(order)} className="btn-secondary w-full">Повторить заказ</button>
              </div>
            ))}
          </div>
        </article>

        <article className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
          <h2 className="text-white text-2xl mb-4 lux-section-title">Избранное</h2>
          {favoriteProducts.length === 0 && (
            <div className="text-neutral-400">
              Пока пусто. <Link className="text-white underline" to="/catalog">Добавить ароматы</Link>
            </div>
          )}
          <div className="space-y-3">
            {favoriteProducts.slice(0, 8).map((product) => (
              <button
                key={product.id}
                onClick={() => onOpenProduct(product)}
                className="w-full text-left border border-neutral-800 rounded-xl p-3 bg-neutral-950 hover:border-neutral-700"
              >
                <div className="flex items-center gap-3">
                  <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                  <div>
                    <p className="text-white">{product.name}</p>
                    <p className="text-neutral-400 text-sm">{product.category}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
