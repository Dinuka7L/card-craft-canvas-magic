import React, { useState } from "react";
import { TemplatePicker } from "./TemplatePicker";
import { CanvasEditor } from "./CanvasEditor";

export const BirthdayCardGenerator: React.FC = () => {
  const [selected, setSelected] = useState<string>("template1");

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pt-4 w-full">
      <div className="w-full max-w-full">
        <h2 className="font-playfair text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">Choose a Card Template</h2>
        <TemplatePicker selected={selected} onSelect={setSelected} />
      </div>
      <div className="w-full">
        <h2 className="font-playfair text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">Edit Your Card</h2>
        <CanvasEditor templateId={selected} />
      </div>
    </div>
  );
};