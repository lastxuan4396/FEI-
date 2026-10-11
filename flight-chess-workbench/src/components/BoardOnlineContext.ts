import {createContext} from 'react';
import type {SharedTimer} from '../core/boardRoomPolicy.js';
export const BoardOnlineContext=createContext<{allowed:(type:string)=>boolean;freeTimer?:SharedTimer;timerAction?:(mode:string,duration?:number)=>void;serverOffset?:number}|null>(null);
