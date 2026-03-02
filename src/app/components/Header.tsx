import { ShoppingCart, Heart, Menu, Search, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export function Header({ cartItemCount, onCartClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl tracking-tight text-white">URBNWAVE</h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              URBNWAVE
            </a>
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              Для него
            </a>
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              Для неё
            </a>
            <a href="#" className="text-neutral-400 hover:text-white transition-colors">
              Унисекс
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="hidden sm:block p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <Search className="w-5 h-5 text-neutral-400" />
            </button>
            <button className="hidden sm:block p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <Heart className="w-5 h-5 text-neutral-400" />
            </button>
            <button
              onClick={onCartClick}
              className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-neutral-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-neutral-400" />
              ) : (
                <Menu className="w-5 h-5 text-neutral-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-900">
          <nav className="px-4 py-4 space-y-2">
            <a href="#" className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">
              URBNWAVE
            </a>
            <a href="#" className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">
              Для него
            </a>
            <a href="#" className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">
              Для неё
            </a>
            <a href="#" className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">
              Унисекс
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}