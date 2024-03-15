import {ComponentPropsWithoutRef, FC, useEffect, useRef, useState} from "react";
import AudioFile from '../assets/audio/audio.mp3';
import BgAudioFile from '../assets/audio/bg_music.mp3'
import {css} from "@emotion/react";
import {IGameState, IPlaneDirection} from "../types/game.type.ts";
import useClearCanvas from "../hooks/useClearCanvas.ts";
import {backgroundImage, planeSprites, spinnerImage} from "../common/images.ts";
import {COLORS} from "../common/colors.ts";
import {CANVAS_PADDING, PLANE_FRAME_RATE, PLANE_HEIGHT, PLANE_WIDTH, PLAYING, WAITING} from "../common/constants.ts";
import {useAudio} from "../hooks/audio/useAudio.ts";
import {GRADIENTS} from "../styles/colors.ts";
import useAnimate from "../hooks/canvas/useAnimate.ts";


const gameStyles = css({
  width: '100%', 
  padding: 8, 
  backgroundSize: 'cover', 
  display: 'flex', 
  flexDirection: 'column', 
  gap: 16, 
  canvas: {
    position: 'absolute', 
    top: CANVAS_PADDING, 
    left: CANVAS_PADDING,
  },
})


export const NewGameView: FC<ComponentPropsWithoutRef<'div'>> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  // const canvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const textCanvasRef = useRef<HTMLCanvasElement>(null);
  const waitingCanvasRef = useRef<HTMLCanvasElement>(null);

  const {audioRef, playSegment, isPlaying, bgAudioRef} = useAudio();

  const clearWaitingCanvas = useClearCanvas({canvasRef: waitingCanvasRef});
  const clearTextCanvas = useClearCanvas({canvasRef: textCanvasRef});
  const clearBgCanvas = useClearCanvas({canvasRef: bgCanvasRef});

  const {startAnimation,resizeCanvas, canvasRef} = useAnimate();


  let currentMultiplier = 1;

  const [canvasWidth, setCanvasWidth] = useState(300);
  const [canvasHeight, setCanvasHeight] = useState(300);

  const [gameState, setGameState] = useState<IGameState>('WAITING');

  const [mainMultiplier, setMainMultiplier] = useState(1);


  const [backgroundFrameId, setBackgroundFrameId] = useState(0);
  const [spinnerFrameId, setSpinnerFrameId] = useState(0);

  let yPos = canvasRef.current ? canvasRef.current.height - PLANE_HEIGHT : 50;
  let xPos = PLANE_HEIGHT;

  const [planeXPos, setPlaneXPos] = useState(PLANE_HEIGHT);
  const [planeYPos, setPlaneYPos] = useState(0);


  useEffect(() => {
    const ref = audioRef.current
    return () => {
      if (isPlaying && ref) {
        ref.pause();
        ref.currentTime = 0;
      }
    };
  }, [audioRef, isPlaying]);

  const drawBackground = () => {
    let angle = 0;
    const animate = () => {
      if (bgCanvasRef.current) {
        const ctx = bgCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.save();
          ctx.canvas.style.marginLeft = `${CANVAS_PADDING}px`;
          ctx.canvas.style.marginBottom = `${CANVAS_PADDING}px`;
          ctx.translate(0, ctx.canvas.width)
          ctx.rotate(angle);
          ctx.scale(1, -1)
          ctx.globalAlpha = 0.2;
          ctx.drawImage(backgroundImage, -Math.floor(ctx.canvas.width * 4), -Math.floor(ctx.canvas.height * 4), ctx.canvas.width * 8, ctx.canvas.width * 8,);
          ctx.globalAlpha = 1;
          ctx.canvas.style.background = GRADIENTS.dark;
          ctx.canvas.style.borderLeft = '1px solid white';
          ctx.canvas.style.borderBottom = '1px solid white';

          ctx.restore();

          angle += 0.003;
          if (angle > 360) {
            angle = 0;
          }
        }
        const frameID = requestAnimationFrame(animate);
        setBackgroundFrameId(frameID);
      }
    }
    animate();
  }

  const drawWaiting = () => {
    let angle = 0;
    let progress = 0;
    const startTime = Date.now();
    const animate = () => {
      const canvas = waitingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(angle);
      ctx.drawImage(spinnerImage, -spinnerImage.width / 2, -spinnerImage.height / 2,);
      const progressInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        progress = Math.min(elapsedTime / 8000, 1) * 100;

        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 50);
      ctx.restore();
      angle += 0.14;
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#c9c9c9';
      ctx.fillText('Waiting for next round', canvas.width / 2, canvas.height * 0.85);
      ctx.canvas.style.background = 'rgba(0,0,0,0.5)';
      ctx.fillStyle = 'red';
      ctx.fillRect(canvas.width / 2 - 100, canvas.height * 0.75, progress * 2, 7);
      const frameId = requestAnimationFrame(animate);
      setSpinnerFrameId(frameId);
    }
    animate()
  }

  const animatePlane = () => {
    let x = planeXPos;
    let currentGameState: IGameState = 'WAITING';
    let currentSprite = 0;
    let currentPlaneDirection: IPlaneDirection = 'UP';
    let steps = 0;
    let counter = 0;
    const dotSpacing = 80;
    let moveX = 0;
    const dotRadius = 2
    let moveY = dotRadius;


    const drawDots = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      for (let dotX = canvasWidth; dotX >= 0; dotX -= dotSpacing) {
        ctx.arc(dotX - moveX, canvasHeight - dotRadius, dotRadius, 0, Math.PI * 2, false);
      }
      ctx.fillStyle = COLORS.white;
      ctx.fill();
      ctx.closePath();
    }
    const drawYDots = (ctx: CanvasRenderingContext2D) => {
      ctx.beginPath();
      for (let dotY = moveY; dotY < canvasHeight; dotY += dotSpacing) {
        ctx.arc(dotRadius, dotY, dotRadius, 0, 2 * Math.PI, false);
      }
      ctx.fillStyle = COLORS.blue;
      ctx.fill();
      ctx.closePath();
    }
    const animate = () => {
      currentGameState = gameState;
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        switch (currentGameState) {
          case 'WAITING' :
            ctx.drawImage(planeSprites[currentSprite], CANVAS_PADDING, ctx.canvas.height - PLANE_HEIGHT - CANVAS_PADDING, PLANE_WIDTH, PLANE_HEIGHT);
            break;
          case 'PLAYING':
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(planeSprites[currentSprite], xPos + CANVAS_PADDING, yPos - PLANE_HEIGHT - CANVAS_PADDING, PLANE_WIDTH, PLANE_HEIGHT);
            ctx.beginPath();
            ctx.moveTo(CANVAS_PADDING, ctx.canvas.height - CANVAS_PADDING - 4);
            ctx.lineWidth = 5
            ctx.strokeStyle = COLORS.error;
            ctx.quadraticCurveTo(xPos / 2.5, ctx.canvas.height - CANVAS_PADDING, xPos + (CANVAS_PADDING * 2), yPos - (CANVAS_PADDING * 2));
            ctx.stroke();
            ctx.lineWidth = 0.5;
            ctx.lineTo(xPos + (CANVAS_PADDING * 2), ctx.canvas.height - (CANVAS_PADDING + 4));
            ctx.closePath();
            ctx.strokeStyle = COLORS.error;
            ctx.stroke();
            ctx.fillStyle = COLORS.bgRed;
            ctx.fill();
            drawDots(ctx);
            drawYDots(ctx);

            if (yPos > 100 && xPos < canvasRef.current.width * 0.85) {
              if (xPos > ctx.canvas.width * 0.65) {
                if (currentPlaneDirection === 'UP') {
                  yPos += 1.2
                  xPos += 0.4
                  if (steps === 120) {
                    currentPlaneDirection = 'DOWN';
                    steps = 0
                  } else steps++;
                } else {
                  yPos -= 1.2
                  xPos -= 0.4
                  if (steps === 120) {
                    currentPlaneDirection = 'UP';
                    steps = 0
                  } else steps++;
                }
                setPlaneYPos(yPos);

                moveX++;
                if (moveX > dotSpacing) moveX = 0;

                moveY++;
                if (moveY - dotRadius > dotSpacing) moveY = dotRadius;

              } else {
                const xOffset = xPos / (canvasRef.current.width * 0.85); // Normalize x position for curve calculation
                yPos = canvasRef.current.height - canvasRef.current.height * Math.pow(xOffset, 2); // Parabolic equation
                xPos += 1.5;
                setPlaneXPos(xPos);
                setPlaneYPos(yPos);
              }
            }
            break;
          case 'ENDED':
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(planeSprites[currentSprite], x, planeYPos - PLANE_HEIGHT, PLANE_WIDTH, PLANE_HEIGHT);
            if (x < ctx.canvas.width * 1.5) {
              x += 12;
              yPos -= 2;
              setPlaneYPos(yPos);
              setPlaneXPos(x);
            }
            break;
          default:
            break;
        }
        if (counter % PLANE_FRAME_RATE === 0) {
          if (currentSprite === planeSprites.length - 1) {
            currentSprite = 0;
          } else {
            currentSprite += 1;
          }
        }
        counter++;
        requestAnimationFrame(animate);
      }
    }
    animate()
  }
  const animateMultiplier = () => {
    let currentState = gameState
    const animate = () => {
      currentState = gameState;
      if (textCanvasRef.current && currentState !== 'WAITING') {
        const ctx = textCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          ctx.save();
          if (currentState === 'ENDED') {
            ctx.fillStyle = '#f7f7f7';
            ctx.font = 'bold 32px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`FLEW AT`, ctx.canvas.width / 2, ctx.canvas.height / 2.3);
            ctx.fillStyle = currentMultiplier < mainMultiplier ? 'white' : 'red';
            ctx.fillStyle = 'red';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${mainMultiplier.toFixed(2)}x`, ctx.canvas.width / 2, ctx.canvas.height / 1.7);
          } else if (currentState === 'PLAYING') {
            ctx.fillStyle = currentMultiplier < mainMultiplier ? 'white' : 'red';
            ctx.font = 'bold 72px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${currentMultiplier.toFixed(2)}x`, ctx.canvas.width / 2, ctx.canvas.height / 1.7);
          }

          ctx.restore();
          currentMultiplier += 0.01;
        }
        if (currentMultiplier < mainMultiplier && currentState === 'PLAYING') {
          requestAnimationFrame(animate);
        } else {
          setGameState("ENDED");
        }

      }
    }
    animate()
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const currentWidth = containerRef.current.clientWidth;
    const currentHeight = containerRef.current.clientHeight;
    const resizeAndStyleCanvases = () => {
      resizeCanvas({width: currentWidth, height: currentHeight});
    }
    const resizeObserver = new ResizeObserver(resizeAndStyleCanvases);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [canvasRef, containerRef]);

  useEffect(() => {
    // switch (gameState) {
    //   case 'WAITING':
    //     clearTextCanvas();
    //     animatePlane();
    //     drawWaiting()
    //     setTimeout(() => {
    //       // setMainMultiplier(getRandomNumber(1, 12));
    //       setMainMultiplier(14.4555)
    //       setGameState(PLAYING);
    //     }, 6000)
    //     break;
    //   case 'PLAYING':
    //     playSegment(AUDIO_START);
    //     cancelAnimationFrame(spinnerFrameId);
    //     clearWaitingCanvas();
    //     drawBackground();
    //     animateMultiplier();
    //     animatePlane();
    //     break;
    //   case 'ENDED':
    //     playSegment(AUDIO_FLY_AWAY);
    //     animatePlane();
    //     animateMultiplier();
    //     cancelAnimationFrame(backgroundFrameId);
    //     drawBackground();
    //     clearBgCanvas();
    //     setTimeout(() => {
    //       setGameState(WAITING);
    //     }, 5000)
    //     break;
    //   default:
    //     break;
    // }

    startAnimation({gameState: gameState, multiplier: mainMultiplier})
  }, [gameState])

  return (<div style={{minHeight: canvasHeight, minWidth: canvasWidth}} css={gameStyles}>
    <audio ref={bgAudioRef} src={BgAudioFile} loop/>
    <audio ref={audioRef} src={AudioFile}/>
    <div ref={containerRef} style={{width: '100%', minHeight: canvasHeight, borderRadius: 8}}>
      {/*<canvas  ref={bgCanvasRef}/>*/}
      <canvas style={{background: GRADIENTS.dark}} ref={canvasRef}/>
      {/*<canvas ref={textCanvasRef}/>*/}
      {/*<canvas style={{display: gameState === 'WAITING' ? 'block' : 'none'}} ref={waitingCanvasRef}/>*/}
    </div>
  </div>)
}
