
import React, { useState } from "react";
import { TemplatePicker } from "./TemplatePicker";
import { CanvasEditor } from "./CanvasEditor";

export const BirthdayCardGenerator: React.FC = () => {
  const [selected, setSelected] = useState<string>("template1");

  return (
    <div className="flex gap-12 pt-8">
      <div>
        <h2 className="font-playfair text-3xl mb-3">Choose a Card Template</h2>
        <TemplatePicker selected={selected} onSelect={setSelected} />
      </div>
      <div className="flex-1">
        <h2 className="font-playfair text-3xl mb-3">Edit Your Card</h2>
        <CanvasEditor templateId={selected} />
      </div>
    </div>
  );
};
