
import React, { useState } from "react";
import { TemplatePicker } from "./TemplatePicker";
import { CanvasEditor } from "./CanvasEditor";

export const BirthdayCardGenerator: React.FC = () => {
  const [selected, setSelected] = useState<string>("template1");

  return (
    <div className="flex flex-col gap-6 lg:gap-12 pt-6 w-full">
      <div className="w-full max-w-full">
        <h2 className="font-playfair text-2xl lg:text-3xl mb-3">Choose a Card Template</h2>
        <TemplatePicker selected={selected} onSelect={setSelected} />
      </div>
      <div className="w-full">
        <h2 className="font-playfair text-2xl lg:text-3xl mb-3">Edit Your Card</h2>
        <CanvasEditor templateId={selected} />
      </div>
    </div>
  );
};
