import React from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  current: "birthday" | "poster" | "quote";
  onNav: (section: "birthday" | "poster" | "quote") => void;
}

const sections = [
  { key: "birthday", label: "Birthday Cards" },
  { key: "poster", label: "Posters" },
  { key: "quote", label: "Quotes" },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ current, onNav }) => (
  <nav className="flex flex-col gap-2 sm:flex-row sm:justify-center sm:gap-4 lg:gap-8 py-3 sm:py-4 bg-background shadow-sm rounded-xl animate-fade-in overflow-x-auto">
    <div className="flex gap-2 sm:gap-4 lg:gap-8 min-w-max px-2 sm:px-0">
      {sections.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onNav(key)}
          className={cn(
            "px-4 py-2 sm:px-6 sm:py-3 min-w-[120px] sm:min-w-[140px] text-center rounded-full text-sm sm:text-base lg:text-lg font-semibold transition-all duration-200 whitespace-nowrap",
            current === key
              ? "bg-primary text-primary-foreground shadow-md scale-105"
              : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground hover:scale-105"
          )}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {label}
        </button>
      ))}
    </div>
  </nav>
);