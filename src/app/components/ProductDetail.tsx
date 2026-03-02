import { X, Plus, Heart } from "lucide-react";
import { Product } from "./ProductCard";

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductDetail({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailProps) {
  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-50 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-neutral-900 rounded-lg max-w-4xl w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-neutral-800 rounded-lg transition-colors z-10"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
                {/* Image */}
                <div className="relative aspect-square bg-neutral-800 rounded-lg overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.isNew && (
                    <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 text-sm">
                      NEW
                    </div>
                  )}
                  <button className="absolute top-4 right-4 bg-neutral-800 p-2 rounded-full hover:bg-neutral-700 transition-colors">
                    <Heart className="w-5 h-5 text-white" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex flex-col">
                  <p className="text-sm text-neutral-400 mb-2">
                    {product.category}
                  </p>
                  <h2 className="text-3xl text-white mb-2">{product.name}</h2>
                  <p className="text-sm text-neutral-400 mb-4">
                    {product.volume} мл
                  </p>
                  <p className="text-2xl text-white mb-6">
                    {product.price.toLocaleString("ru-RU")} ₽
                  </p>

                  <div className="mb-6">
                    <h3 className="text-lg text-white mb-3">Описание</h3>
                    <p className="text-neutral-300 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  <div className="mt-auto space-y-3">
                    <button
                      onClick={() => {
                        onAddToCart(product);
                        onClose();
                      }}
                      className="w-full bg-white text-black py-3 px-6 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Добавить в корзину
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full border border-neutral-700 text-white py-3 px-6 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
