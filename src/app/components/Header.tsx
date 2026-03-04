import { ShoppingCart, Heart, Menu, Search, User, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, NavLink } from "react-router-dom";

interface HeaderProps {
  cartItemCount: number;
  favoriteCount: number;
  isAuthorized: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors ${isActive ? "text-white" : "text-neutral-400 hover:text-white"}`;

export function Header({
  cartItemCount,
  favoriteCount,
  isAuthorized,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    onSearchSubmit();
  };

  return (
    <header className="sticky top-0 z-50 bg-neutral-900/95 backdrop-blur border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          <Link to="/" className="flex-shrink-0 text-3xl tracking-tight text-white text-display leading-none">
            URBNWAVE
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/catalog" className={navLinkClass}>Весь каталог</NavLink>
            <NavLink to="/decants" className={navLinkClass}>Именитые распивы</NavLink>
            <NavLink to="/atelier" className={navLinkClass}>Atelier URBNWAVE</NavLink>
            <NavLink to="/top-decants" className={navLinkClass}>Популярные распивы</NavLink>
            <NavLink to="/quiz" className={navLinkClass}>Подбор</NavLink>
          </nav>

          <form onSubmit={submitSearch} className="hidden sm:flex items-center gap-2 bg-neutral-800 rounded-lg px-2 py-1 min-w-56">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Поиск по каталогу"
              className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
            />
          </form>

          <div className="flex items-center gap-2">
            <Link to="/account" className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <User className={`w-5 h-5 ${isAuthorized ? "text-white" : "text-neutral-400"}`} />
            </Link>
            <Link to="/favorites" className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <Heart className="w-5 h-5 text-neutral-400" />
              {favoriteCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favoriteCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative p-2 hover:bg-neutral-800 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-neutral-400" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              aria-label="Открыть меню"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-neutral-400" /> : <Menu className="w-5 h-5 text-neutral-400" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-900 page-enter">
          <div className="px-4 py-4 space-y-3">
            <form onSubmit={submitSearch} className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск по каталогу"
                className="w-full bg-transparent text-sm text-white placeholder:text-neutral-500 focus:outline-none"
              />
            </form>
            <NavLink to="/catalog" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">Весь каталог</NavLink>
            <NavLink to="/decants" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">Именитые распивы</NavLink>
            <NavLink to="/atelier" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">Atelier URBNWAVE</NavLink>
            <NavLink to="/top-decants" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">Популярные распивы</NavLink>
            <NavLink to="/quiz" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">Подбор аромата</NavLink>
            <NavLink to="/account" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2 text-neutral-400 hover:bg-neutral-800 rounded-lg transition-colors">Личный кабинет</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
