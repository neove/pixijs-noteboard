/**
 * 选区
 */

import { Container, Graphics, Sprite, Text, HTMLText } from "pixi.js";
import { Application, extend, useApplication } from "@pixi/react";
import { useCallback } from "react";
extend({
  Container,
  Graphics,
  Sprite,
  Text,
  HtmlText: HTMLText,
});

export const SelectionBox = ({
  selectionBoxGraphicsRef,
}: {
  selectionBoxGraphicsRef: React.RefObject<Graphics>;
}) => {
  const draw = useCallback((graphics: Graphics) => {
    graphics.clear();
    graphics.rect(0, 0, 100, 100).stroke({
      width: 1,
      color: "red",
    });
  }, []);
  return (
    <pixiGraphics ref={selectionBoxGraphicsRef} draw={draw}></pixiGraphics>
  );
};
