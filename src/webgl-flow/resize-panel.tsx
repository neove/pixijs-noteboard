import { useApplication } from "@pixi/react";
import { Container, Graphics, Sprite, Text, HTMLText } from "pixi.js";
import { extend, useTick } from "@pixi/react";

extend({
  Container,
  Graphics,
  Sprite,
  Text,
});

export const ResizePanel = ({ zoom }: { zoom: number }) => {
  //   useTick(() => console.log("This will be logged on every tick"));

  return (
    <pixiContainer>
      <pixiText text={`12312312312312`} />
    </pixiContainer>
  );
};
