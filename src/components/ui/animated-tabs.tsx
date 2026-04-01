"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface AnimatedTabsProps {
  tabs?: Tab[];
  defaultTab?: string;
  className?: string;
}

const AnimatedTabs = ({
  tabs = [],
  defaultTab,
  className,
}: AnimatedTabsProps) => {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || tabs[0]?.id);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full flex flex-col gap-y-0", className)}>
      {/* Tab buttons — black bg with red active */}
      <div className="flex gap-0 bg-black p-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2 text-[11px] font-black uppercase tracking-wider text-white/50 outline-none transition-colors"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-recap-tab"
                className="absolute inset-0 bg-brand-red"
                transition={{ type: "spring", duration: 0.5 }}
              />
            )}
            <span className="relative z-10 text-white">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area — black bg, red border */}
      <div className="p-5 bg-black text-white border-2 border-brand-red min-h-[200px]">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                transition={{ duration: 0.4, ease: "circInOut", type: "spring" }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </div>
    </div>
  );
};

export { AnimatedTabs };
export type { Tab };
