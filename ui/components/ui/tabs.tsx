"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const TabsContext = React.createContext<{
  selectedValue?: string;
}>({
  selectedValue: undefined,
});

function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  const [selectedValue, setSelectedValue] = React.useState<string | undefined>(
    value || defaultValue
  );

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  const handleValueChange = (newValue: string) => {
    setSelectedValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ selectedValue }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        defaultValue={defaultValue}
        value={value}
        onValueChange={handleValueChange}
        {...props}
      />
    </TabsContext.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] relative",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  value,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const { selectedValue } = React.useContext(TabsContext);
  const isActive = selectedValue === value;

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      value={value}
      className={cn(
        "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 relative z-10 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        isActive && "text-primary data-[state=active]:text-primary dark:data-[state=active]:text-primary",
        className
      )}
      {...props}
    >
      {props.children}
      {isActive && (
        <motion.div
          layoutId="tab-highlight"
          className="absolute inset-0 rounded-md bg-background dark:bg-input/30 border border-transparent dark:border-input shadow-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 500, 
            damping: 30,
            duration: 0.25
          }}
          style={{ zIndex: -1 }}
        />
      )}
    </TabsPrimitive.Trigger>
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
