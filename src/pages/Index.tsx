
// Landing page and generator nav

import React, { useState } from "react";
import { BirthdayCardGenerator } from "@/components/BirthdayCardGenerator";
// Stubs for future pages
const PosterGen = () => (
  <div className="flex justify-center items-center h-[60vh] text-2xl font-semibold text-muted-foreground">
    Poster generator coming soon!
  </div>
);
const QuoteGen = () => (
  <div className="flex justify-center items-center h-[60vh] text-2xl font-semibold text-muted-foreground">
    Quote generator coming soon!
  </div>
);
import { Navbar } from "@/components/Navbar";

const Index = () => {
  // "birthday" | "poster" | "quote"
  const [section, setSection] = useState<"birthday" | "poster" | "quote">(
    "birthday"
  );

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eef0ff] to-[#fffbee] px-2 sm:px-4 lg:px-10 py-3 sm:py-7 w-full">
      <header className="mb-2">
        <h1 className="font-playfair text-3xl sm:text-5xl tracking-tight mb-2">
          Birthday Card Generator
        </h1>
        <p className="text-base sm:text-lg max-w-2xl mb-2 text-muted-foreground font-inter">
          Create stunning birthday cards in seconds. Upload a photo and make it your own—drag, crop, add texts and download in any format.
        </p>
        <Navbar current={section} onNav={setSection} />
      </header>
      <main className="w-full">
        {section === "birthday" && <BirthdayCardGenerator />}
        {section === "poster" && <PosterGen />}
        {section === "quote" && <QuoteGen />}
      </main>
    </div>
  );
};

export default Index;

