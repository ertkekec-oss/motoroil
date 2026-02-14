"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }: any) => (
  <TabsPrimitive.List className={cn("flex gap-2", className)} {...props} />
);

export const TabsTrigger = ({ className, ...props }: any) => (
  <TabsPrimitive.Trigger className={cn("px-3 py-1 border", className)} {...props} />
);

export const TabsContent = ({ className, ...props }: any) => (
  <TabsPrimitive.Content className={cn("mt-2", className)} {...props} />
);
