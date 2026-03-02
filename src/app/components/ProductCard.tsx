import { Heart, Plus } from "lucide-react";

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  isNew?: boolean;
  description: string;
  volume: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onProductClick }: ProductCardProps) {
  return (
    <div className="group relative bg-neutral-800 rounded-lg overflow-hidden">
      <div 
        className="relative aspect-square overflow-hidden bg-neutral-900 cursor-pointer"
        onClick={() => onProductClick(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isNew && (
          <div className="absolute top-3 left-3 bg-white text-black px-3 py-1 text-sm">
            NEW
          </div>
        )}
        <button 
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="absolute top-3 right-3 bg-neutral-800 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-700"
        >
          <Heart className="w-4 h-4 text-white" />
        </button>
      </div>
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onProductClick(product)}
      >
        <p className="text-sm text-neutral-400 mb-1">{product.category}</p>
        <h3 className="mb-2 text-white">{product.name}</h3>
        <p className="text-sm text-neutral-400 mb-2">{product.volume} мл</p>
        <p className="mb-3 text-white">{product.price.toLocaleString('ru-RU')} ₽</p>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full bg-white text-black py-2.5 px-4 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Добавить в корзину
        </button>
      </div>
    </div>
  );
}