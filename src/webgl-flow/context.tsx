import { createContext } from "react";
import { Application } from "@pixi/react";
import { Viewport } from "pixi-viewport";

export const CanvasContext = createContext<{
  app: typeof Application | null;
  viewport: typeof Viewport | null;
}>({
  app: null,
  viewport: null,
});
