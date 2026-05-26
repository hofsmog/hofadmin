"use client";

import { useMemo, useState } from "react";
import type { ModuleDefinition } from "@/types";

export function useModuleState(initialModules: ModuleDefinition[]) {
  const [enabledIds, setEnabledIds] = useState(
    () => new Set(initialModules.filter((module) => module.status === "enabled").map((module) => module.id)),
  );

  return useMemo(
    () => ({
      enabledIds,
      toggleModule(moduleId: string) {
        setEnabledIds((current) => {
          const next = new Set(current);
          if (next.has(moduleId)) {
            next.delete(moduleId);
          } else {
            next.add(moduleId);
          }
          return next;
        });
      },
    }),
    [enabledIds],
  );
}
