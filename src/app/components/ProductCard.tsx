import { Eye, Heart, Plus } from "lucide-react";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  volume: number;
  family: "цитрус" | "древесный" | "восточный" | "цветочный";
  isNew?: boolean;
  isHit?: boolean;
  salePercent?: number;
  popularity: number;
  releaseYear: number;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  scenarios: string[];
  longevity?: "легкий" | "средний" | "стойкий";
  inspiredBy?: string;
  gallery?: string[];
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
  onToggleFavorite: (productId: number) => void;
  onQuickView: (product: Product) => void;
  isFavorite: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onProductClick,
  onToggleFavorite,
  onQuickView,
  isFavorite,
}: ProductCardProps) {
  const discountedPrice = product.salePercent
    ? Math.round(product.price * (1 - product.salePercent / 100))
    : product.price;

  return (
    <div className="product-card group relative bg-neutral-900 rounded-2xl overflow-hidden card-enter border border-neutral-800 hover:border-neutral-700 transition-colors">
      <div
        className="relative aspect-square overflow-hidden bg-neutral-950 cursor-pointer"
        onClick={() => onProductClick(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          width={640}
          height={640}
        />

        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {product.isNew && <span className="badge-new">NEW</span>}
          {product.isHit && <span className="badge-hit">HIT</span>}
          {product.salePercent && <span className="badge-sale">SALE {product.salePercent}%</span>}
        </div>

        <div className="absolute inset-x-3 bottom-3 grid grid-cols-3 gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className="quick-btn"
            aria-label="В корзину"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product.id);
            }}
            className={`quick-btn ${isFavorite ? "quick-btn-active" : ""}`}
            aria-label="В избранное"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="quick-btn"
            aria-label="Быстрый просмотр"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 cursor-pointer" onClick={() => onProductClick(product)}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs uppercase tracking-wide text-neutral-400 lux-meta">{product.category}</p>
          <p className="text-xs text-neutral-500">{product.volume} мл</p>
        </div>

        <h3 className="mb-2 text-white text-2xl lux-card-title">{product.name}</h3>
        <p className="text-sm text-neutral-400 mb-3 line-clamp-2">{product.description}</p>

        <div className="flex items-center gap-2">
          <p className="text-white text-lg">{discountedPrice.toLocaleString("ru-RU")} ₽</p>
          {product.salePercent && (
            <p className="text-sm text-neutral-500 line-through">{product.price.toLocaleString("ru-RU")} ₽</p>
          )}
        </div>
      </div>
    </div>
  );
}

