import { useState } from "react";
import { Header } from "./components/Header";
import { ProductCard, Product } from "./components/ProductCard";
import { ShoppingCartPanel, CartItem } from "./components/ShoppingCartPanel";
import { ProductDetail } from "./components/ProductDetail";

const products: Product[] = [
  {
    id: 1,
    name: "Concrete Jungle",
    price: 8990,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1759793500112-c588839cfc6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90тлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Дерзкий и современный аромат, воплощающий энергию мегаполиса. Ноты бетона смешиваются с древесными аккордами и свежими цитрусовыми оттенками.",
    volume: 100,
  },
  {
    id: 2,
    name: "Tom Ford Black Orchid",
    price: 12990,
    category: "Люкс",
    image: "https://images.unsplash.com/photo-1763631403216-8d193008481e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ25lciUyMGZyYWdyYW5jZSUyMGJvdHRлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: false,
    description: "Роскошный и чувственный аромат с нотами черной орхидеи, пачули, черного трюфеля и бергамота. Идеален для особых вечеров.",
    volume: 100,
  },
  {
    id: 3,
    name: "Urban Night",
    price: 7990,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1758871992965-836e1fb0f9bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBwZXJmdW1lJTIwY29sbGVjdGlvbnxlbnwxfHx8fDE3NzI0NTcxNzB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Загадочный ночной аромат для тех, кто живет ночной жизнью города. Смесь черного перца, кожи и амбры создает неповторимую атмосферу.",
    volume: 75,
  },
  {
    id: 4,
    name: "Dior Sauvage",
    price: 11490,
    category: "Для него",
    image: "https://images.unsplash.com/photo-1762751629196-1d9a874cdf92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcGVyZnVtZSUyMGJvdHRлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Свежий и мужественный аромат, вдохновленный дикой природой. Сочетание бергамота, перца и амброксана.",
    volume: 100,
  },
  {
    id: 5,
    name: "Chanel No.5",
    price: 13990,
    category: "Для неё",
    image: "https://images.unsplash.com/photo-1633072437275-ec3344b4b966?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYm90тлxfGVufDF8fHx8MTc3MjQyMzk4M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: false,
    description: "Легендарный аромат элегантности и женственности. Цветочные ноты жасмина, розы и иланг-иланга в классическом исполнении.",
    volume: 100,
  },
  {
    id: 6,
    name: "Steel & Smoke",
    price: 8490,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1760804876250-605a3cd49ede?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBmcmFncmFuY2UlMjBnaWZ0fGVufDF8fHx8MTc3MjQ1NzE3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Индустриальный аромат с металлическими нотами и дымчатым шлейфом. Для тех, кто ценит брутальность и стиль.",
    volume: 100,
  },
  {
    id: 7,
    name: "YSL La Nuit de l'Homme",
    price: 10990,
    category: "Для него",
    image: "https://images.unsplash.com/photo-1709095458514-573bc6277d3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwcGVyZnVtZSUyMGRpc3BsYXl8ZW58MXx8fHwxNzcyNDU3MTcxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Чувственный и соблазнительный аромат с нотами кардамона, кедра и ветивера. Создан для романтических вечеров.",
    volume: 100,
  },
  {
    id: 8,
    name: "Metro Pulse",
    price: 7490,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1759793499912-625d49ae6087?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWJлxfGVufDF8fHx8MTc3MjQ1NzE3MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: false,
    description: "Динамичный аромат в ритме метрополитена. Пульсирующие ноты мяты, имбиря и мускуса для активных людей.",
    volume: 75,
  },
  {
    id: 9,
    name: "Versace Eros",
    price: 9990,
    category: "Для него",
    image: "https://images.unsplash.com/photo-1763986665850-6e66549aa8e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9yYWwlMjBwZXJmdW1lJTIwYm90тлxfGVufDF8fHx8MTc3MjQ1NzE3Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: false,
    description: "Страстный и яркий аромат с нотами мяты, зеленого яблока и ванили. Воплощение силы и страсти.",
    volume: 100,
  },
  {
    id: 10,
    name: "Asphalt Dreams",
    price: 8990,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1761659760494-32b921a2449f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYXRvbWl6ZXIlMjBzcHJheXxlbnwxfHx8fDE3NzIzODE3NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Мечты, рожденные на городских улицах. Сочетание озона, серой амбры и древесных нот создает урбанистическую атмосферу.",
    volume: 100,
  },
  {
    id: 11,
    name: "Giorgio Armani Acqua di Gio",
    price: 10490,
    category: "Унисекс",
    image: "https://images.unsplash.com/photo-1689287428221-cd3d7b36b763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkJTIwcGVyZnVtZSUyMGJvdHRлxfGVufDF8fHx8MTc3MjQ1NzE3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Свежий морской аромат с нотами бергамота, нероли и розмарина. Классика, которая никогда не выходит из моды.",
    volume: 100,
  },
  {
    id: 12,
    name: "Lancôme La Vie Est Belle",
    price: 12490,
    category: "Для неё",
    image: "https://images.unsplash.com/photo-1621763289102-dbee7d5c88f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcnlzdGFsJTIwcGVyZnVtZSUyMGJvdHRлxfGVufDF8fHx8MTc3MjQ1NzE3Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Жизнь прекрасна - вот что говорит этот аромат. Ноты ириса, жасмина и пачули создают незабываемую композицию.",
    volume: 100,
  },
  {
    id: 13,
    name: "Neon Nights",
    price: 7990,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1672848700906-2b8ca62639e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuaWNoZSUyMHBlcmZ1bWUlMjBib3ттлеJTIwYmxhY2t8ZW58MXx8fHwxNzcyNDU3MTc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Электрический аромат неоновых огней города. Яркие ноты грейпфрута, электрические озоновые аккорды и белый мускус.",
    volume: 75,
  },
  {
    id: 14,
    name: "Paco Rabanne 1 Million",
    price: 11990,
    category: "Для него",
    image: "https://images.unsplash.com/photo-1709660628820-cfdde9b6b634?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpc2FuJTIwZnJhZ3JhbmNlJTIwYm90тлxfGVufDF8fHx8MTc3MjQ1NzE3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Роскошный и дерзкий аромат успеха. Пряные ноты корицы сочетаются с кожей и белым деревом.",
    volume: 100,
  },
  {
    id: 15,
    name: "Viktor & Rolf Flowerbomb",
    price: 13490,
    category: "Для неё",
    image: "https://images.unsplash.com/photo-1618137585731-4c33c287d2dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYm90тлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: false,
    description: "Взрывная цветочная композиция с нотами фрезии, розы и пачули. Аромат для смелых и уверенных в себе женщин.",
    volume: 100,
  },
  {
    id: 16,
    name: "Skyline Serenade",
    price: 8490,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1749191745108-c636380b2898?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJmdW1lJTIwYm90тлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Серенада городского горизонта. Воздушные ноты бергамота, кедра и серой амбры воплощают высоту небоскребов.",
    volume: 100,
  },
  {
    id: 17,
    name: "Burberry Brit",
    price: 9490,
    category: "Унисекс",
    image: "https://images.unsplash.com/photo-1759793500112-c588839cfc6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwY29sb2duZSUyMGJvdHRлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    description: "Британская элегантность в каждой капле. Свежие ноты лайма, миндаля и кедра создают изысканный образ.",
    volume: 100,
  },
  {
    id: 18,
    name: "Midnight Metro",
    price: 7490,
    category: "URBNWAVE Collection",
    image: "https://images.unsplash.com/photo-1758871992965-836e1fb0f9bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZW5zJTIwY29sb2duZSUyMGJvdHRлxfGVufDF8fHx8MTc3MjQ1NzE3V8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    isNew: true,
    description: "Последний поезд в полночь. Темные ноты кофе, табака и ветивера для ночных путешественников по городу.",
    volume: 75,
  },
];

export default function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("Все");

  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: number, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const filteredProducts = products.filter((product) => {
    if (activeFilter === "Все") return true;
    if (activeFilter === "Новинки") return product.isNew;
    if (activeFilter === "Хиты") return product.price > 10000;
    return false;
  });

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-neutral-950">
      <Header cartItemCount={totalItems} onCartClick={() => setIsCartOpen(true)} />

      {/* Hero Section */}
      <section className="relative h-[60vh] sm:h-[70vh] overflow-hidden bg-neutral-900">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1760862652442-e8ff7ebdd2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwc3RvcmUlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzI0NTcyNTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>
        <div className="relative h-full flex items-center justify-center text-center px-4">
          <div className="max-w-3xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl text-white mb-4">
              Коллекция URBNWAVE
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8">
              Эксклюзивные ароматы для урбанистического образа жизни
            </p>
            <button className="bg-white text-black px-8 py-3 rounded-lg hover:bg-neutral-200 transition-colors">
              Открыть коллекцию
            </button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="mb-2 text-white">Наши ароматы</h2>
            <p className="text-neutral-400">
              Откройте для себя мир эксклюзивной парфюмерии
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              className={`px-4 py-2 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors text-white ${
                activeFilter === "Все" ? "bg-neutral-800" : ""
              }`}
              onClick={() => handleFilterChange("Все")}
            >
              Все
            </button>
            <button
              className={`px-4 py-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 ${
                activeFilter === "Новинки" ? "bg-neutral-800 text-white" : ""
              }`}
              onClick={() => handleFilterChange("Новинки")}
            >
              Новинки
            </button>
            <button
              className={`px-4 py-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 ${
                activeFilter === "Хиты" ? "bg-neutral-800 text-white" : ""
              }`}
              onClick={() => handleFilterChange("Хиты")}
            >
              Хиты
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="mb-4 text-white">URBNWAVE</h3>
              <p className="text-neutral-400 text-sm">
                Эксклюзивные ароматы и премиальная парфюмерия для тех, кто живет в ритме города
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-white">Покупателям</h4>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li><a href="#" className="hover:text-white">Доставка</a></li>
                <li><a href="#" className="hover:text-white">Возврат</a></li>
                <li><a href="#" className="hover:text-white">Оплата</a></li>
                <li><a href="#" className="hover:text-white">Вопросы</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-white">Компания</h4>
              <ul className="space-y-2 text-neutral-400 text-sm">
                <li><a href="#" className="hover:text-white">О нас</a></li>
                <li><a href="#" className="hover:text-white">Контакты</a></li>
                <li><a href="#" className="hover:text-white">Магазины</a></li>
                <li><a href="#" className="hover:text-white">Карьера</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-white">Подписка</h4>
              <p className="text-neutral-400 text-sm mb-4">
                Получайте новости о новинках и специальных предложениях
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 px-4 py-2 border border-neutral-700 bg-neutral-800 text-white rounded-lg focus:outline-none focus:border-neutral-500"
                />
                <button className="bg-white text-black px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors">
                  →
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-neutral-800 text-center text-neutral-400 text-sm">
            © 2025 URBNWAVE. Все права защищены.
          </div>
        </div>
      </footer>

      {/* Shopping Cart Panel */}
      <ShoppingCartPanel
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      {/* Product Detail Panel */}
      <ProductDetail
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        product={selectedProduct}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}