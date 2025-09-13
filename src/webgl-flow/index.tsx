import { Application, extend } from "@pixi/react";
import { Container, Graphics, Sprite, Text } from "pixi.js";
extend({
  Container,
  Graphics,
  Sprite,
  Text,
});

export default function WebGLFlow() {
  return (
    <Application
      backgroundColor="#ddd"
      width={document.documentElement.clientWidth}
      height={1000}
      preference="webgpu"
      interactive
      eventMode="static"
    >
      <pixiContainer
        onPointerDown={(e) => {
          debugger;
        }}
      >
        <pixiGraphics
          draw={(graphics) => {
            graphics.clear();
            graphics.setFillStyle({ color: "red" });
            graphics.rect(0, 0, 100, 100);
            graphics.fill();
          }}
        />
        <pixiText text="132"></pixiText>
      </pixiContainer>
    </Application>
  );
}
