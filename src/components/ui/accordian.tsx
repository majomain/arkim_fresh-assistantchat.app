import { useState, ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";

// Root
export function Accordion({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("w-full", className)}>{children}</div>;
}

// Item
export function AccordionItem({
  children,
  defaultOpen = true,
  hideBorder = false,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  hideBorder?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);

  return (
    <AccordionItemContext.Provider value={{ open, setOpen }}>
      <div className={cn(
        hideBorder ? 'border-none' : 'border-b'
      )}>{children}</div>
    </AccordionItemContext.Provider>
  );
}

// ---- Context ----

import { createContext, useContext } from "react";

const AccordionItemContext = createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
} | null>(null);

function useAccordionItem() {
  const ctx = useContext(AccordionItemContext);
  if (!ctx) throw new Error("AccordionHeader must be inside AccordionItem");
  return ctx;
}

// ---- Header ----

export function AccordionHeader({
  children,
  iconColor = ''
}: {
  children: ReactNode;
  iconColor?: string
}) {
  const { open, setOpen } = useAccordionItem();

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full flex justify-between items-center py-3 text-left font-medium cursor-pointer"
    >
      <div>{children}</div>

      <ChevronDownIcon
        className={cn(
          "size-4 transition-transform duration-200",
          open ? "rotate-180" : "rotate-0",
          iconColor ?? 'text-foreground'
        )}
      />
    </button>
  );
}

// ---- Content ----

export function AccordionContent({
  children,
  smoothHide = true
}: {
  children: ReactNode;
  smoothHide?: boolean
}) {
  const { open } = useAccordionItem();

  return (
    <div
      className={cn(
        "overflow-hidden transition-all duration-100",
        open ? smoothHide ? "max-h-max opacity-100" : "block" : smoothHide ? "max-h-0 opacity-0" : "hidden"
      )}
    >
      <div>{children}</div>
    </div>
  );
}
