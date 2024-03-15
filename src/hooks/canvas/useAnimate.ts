import {IGameState} from "../../types/game.type.ts";
import {useRef, useState} from "react";
import {CANVAS_PADDING, PLANE_FRAME_RATE, PLANE_HEIGHT, PLANE_WIDTH} from "../../common/constants.ts";
import {planeSprites} from "../../common/images.ts";

interface AnimationProps  {
  gameState: IGameState,
  multiplier: number
}

interface CanvasSize {
  width: number;
  height: number;
}

const useAnimate = () => {
	
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrameId, setAnimationFrameID] = useState<number>(0);
  const startAnimation = ({gameState, multiplier}: AnimationProps) => {
    if(!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const animate = () => {
      if(!ctx) return;
      let xPos = CANVAS_PADDING;
      let yPos = ctx.canvas.height - CANVAS_PADDING;
      let currentSprite = 0;
      let spriteFrameCounter = 0;
      const drawBackground = () => {

        switch (gameState) {
          case "WAITING":
            break;
          case "PLAYING":
            break;
          case "ENDED":
            break;
        }
      }

      const drawPlane = () => {
        if(!ctx) return;
        switch (gameState){
          case "WAITING":
            ctx.drawImage(planeSprites[currentSprite], CANVAS_PADDING, ctx.canvas.height - PLANE_HEIGHT - CANVAS_PADDING, PLANE_WIDTH, PLANE_HEIGHT);
            break;
          case "PLAYING":
            break;
          case "ENDED":
            break;

        }
      }

      if (spriteFrameCounter % PLANE_FRAME_RATE === 0) {
        if (currentSprite === planeSprites.length - 1) {
          currentSprite = 0;
        } else {
          currentSprite += 1;
        }
      }
      spriteFrameCounter++;
      drawBackground();
      drawPlane();
      const frameID  = requestAnimationFrame(animate);
      setAnimationFrameID(frameID);
    }
    animate();
  }

  const cancelAnimation = () => {
    cancelAnimationFrame(animationFrameId);
  }
	
  const resizeCanvas = (canvasSize: CanvasSize) => {
    console.log(canvasSize);
    if(!canvasRef.current) return;
    canvasRef.current.width = canvasSize.width;
    canvasRef.current.height = canvasSize.height;
  }


  return {startAnimation, resizeCanvas, cancelAnimationFrame, canvasRef}
}

export default useAnimate;	