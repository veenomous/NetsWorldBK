"use client";

import React, { useState, useEffect } from "react";
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

  // Update active tab when defaultTab changes (async data load)
  useEffect(() => {
    if (defaultTab) setActiveTab(defaultTab);
  }, [defaultTab]);

  if (!tabs?.length) return null;

  return (
    <div className={cn("w-full flex flex-col gap-y-2", className)}>
      {/* Tab buttons */}
      <div className="flex gap-2 flex-wrap bg-[#11111198] bg-opacity-50 backdrop-blur-sm p-1.5 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-2 text-sm font-bold rounded-lg text-white outline-none transition-colors"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-recap-tab"
                className="absolute inset-0 bg-brand-red shadow-[0_0_20px_rgba(228,60,62,0.3)] !rounded-lg"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="p-5 bg-white text-text-primary shadow-[0_0_20px_rgba(0,0,0,0.08)] rounded-xl min-h-[220px] h-full">
        {tabs.map(
          (tab) =>
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, scale: 0.95, x: -10, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, x: -10, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: "circInOut", type: "spring" }}
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
