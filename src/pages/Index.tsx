import React, { useState } from "react";
import { BirthdayCardGenerator } from "@/components/BirthdayCardGenerator";
import { Navbar } from "@/components/Navbar";
import { Header } from "@/components/Header";

// Stubs for future pages
const PosterGen = () => (
  <div className="flex justify-center items-center h-[60vh] text-xl sm:text-2xl font-semibold text-muted-foreground">
    Poster generator coming soon!
  </div>
);
const QuoteGen = () => (
  <div className="flex justify-center items-center h-[60vh] text-xl sm:text-2xl font-semibold text-muted-foreground">
    Quote generator coming soon!
  </div>
);

const Index = () => {
  const [section, setSection] = useState<"birthday" | "poster" | "quote">("birthday");

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eef0ff] to-[#fffbee] px-3 sm:px-4 lg:px-10 py-0 w-full">
      <Header />
      <div className="mt-2 mb-4">
        <h1 className="font-playfair text-2xl sm:text-4xl lg:text-5xl tracking-tight mb-2 sm:mb-3">
          Birthday Card Generator
        </h1>
        <p className="text-sm sm:text-base lg:text-lg max-w-2xl mb-3 sm:mb-4 text-muted-foreground font-inter leading-relaxed">
          Create stunning birthday cards in seconds. Upload a photo and make it your own—drag, crop, add texts and download in any format.
        </p>
        <Navbar current={section} onNav={setSection} />
      </div>
      <main className="w-full pb-8">
        {section === "birthday" && <BirthdayCardGenerator />}
        {section === "poster" && <PosterGen />}
        {section === "quote" && <QuoteGen />}
      </main>
    </div>
  );
};

export default Index;