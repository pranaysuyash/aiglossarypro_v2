import type { ComponentType } from "react";

declare module "react" {
  export const ViewTransition: ComponentType<any>;
  export function addTransitionType(type: string): void;
}

export {};
