import React from "react";

export const Header: React.FC = () => (
  <header className="flex items-center gap-3 sm:gap-6 py-3 px-3 sm:px-6 bg-white bg-opacity-80 shadow-md rounded-b-xl sticky top-0 z-30 backdrop-blur-sm">
    <img
      src="/logo.svg"
      alt="WishMe! logo"
      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary object-cover"
      onError={e => {
        const el = e.currentTarget;
        el.onerror = null;
        el.src =
          "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><rect width='100%' height='100%' fill='%235981f7'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-size='32' fill='white' font-family='Playfair Display'>W</text></svg>";
      }}
    />
    <span className="font-playfair text-lg sm:text-xl lg:text-2xl font-bold select-none tracking-wide text-primary">
      WishMe! Birthday Card Maker
    </span>
  </header>
);