
import React from "react";

export const Header: React.FC = () => (
  <header className="flex items-center gap-3 sm:gap-6 py-3 px-2 sm:px-6 bg-white bg-opacity-80 shadow-md rounded-b-xl sticky top-0 z-30">
    <img
      src="/logo.svg"
      alt="WishMe! logo"
      className="w-10 h-10 rounded-full bg-primary object-cover"
      onError={e => {
        // fallback to letter logo if logo.svg missing
        const el = e.currentTarget;
        el.onerror = null;
        el.src =
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='100%' height='100%' fill='%235981f7'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='Playfair Display'>W</text></svg>";
      }}
    />
    <span className="font-playfair text-xl sm:text-2xl font-bold select-none tracking-wide text-primary">
      WishMe!
    </span>
  </header>
);
