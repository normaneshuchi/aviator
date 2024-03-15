import {breakpoints} from "../styles/breakpoints.ts";

export const PLANE_FRAME_RATE = 8;
export const BORDER_RADIUS = '8px';
export const PLANE_WIDTH = window.innerWidth > breakpoints[0] ? 150 : 75;
export const PLANE_HEIGHT = window.innerWidth > breakpoints[0] ? 74 : 37;

export const CANVAS_PADDING = window.innerWidth > breakpoints[0] ? 16 : 8;

export const WAITING = 'WAITING';
export const PLAYING  = 'PLAYING';
export const ENDED = 'ENDED';
export const UP = 'UP';
export const DOWN = 'DOWN';

export const AUDIO_START = "start";
export const AUDIO_FLY_AWAY = "flyAway";