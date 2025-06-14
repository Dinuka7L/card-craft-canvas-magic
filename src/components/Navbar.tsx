
import React from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  current: "birthday" | "poster" | "quote";
  onNav: (section: "birthday" | "poster" | "quote") => void;
}

const sections = [
  { key: "birthday", label: "Birthday Card Generator" },
  { key: "poster", label: "Poster Generator" },
  { key: "quote", label: "Quote Generator" },
] as const;

export const Navbar: React.FC<NavbarProps> = ({ current, onNav }) => (
  <nav className="flex justify-center gap-8 py-6 bg-background shadow-sm rounded-xl my-4 animate-fade-in">
    {sections.map(({ key, label }) => (
      <button
        key={key}
        onClick={() => onNav(key)}
        className={cn(
          "px-6 py-2 rounded-full text-lg font-semibold transition-all duration-200",
          current === key
            ? "bg-primary text-primary-foreground shadow"
            : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </button>
    ))}
  </nav>
);
