import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CardSplitAccordianProps {
  children: React.ReactNode;
}

export const CardSplitAccordian: React.FC<CardSplitAccordianProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Separate header and expandable content
  const childrenArray = React.Children.toArray(children);
  const header = childrenArray[0];
  const content = childrenArray.slice(1);

  return (
    <div className="w-full transition-all duration-300">
      {/* Clickable Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="cursor-pointer select-none relative group hover:bg-zinc-900/30 transition duration-200"
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">{header}</div>
          <div className="pr-4 flex items-center justify-center pointer-events-none">
            <ChevronDown
              size={18}
              className={`text-zinc-500 transition-transform duration-300 ${
                isOpen ? "rotate-180 text-amber-500" : "group-hover:text-zinc-300"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Expandable Section */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.2 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                opacity: { duration: 0.15 },
              },
            }}
            className="overflow-hidden"
          >
            <div>{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
