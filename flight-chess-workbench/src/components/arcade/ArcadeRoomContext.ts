import {createContext,useContext} from 'react';
import type {ArcadeAction} from '../../core/arcade.js';
import type {ArcadeRoomSnapshot} from './useArcadeRoom';
export interface ArcadeRoomControls {snapshot:ArcadeRoomSnapshot|null;allowed:(action:ArcadeAction)=>boolean}
export const ArcadeRoomContext=createContext<ArcadeRoomControls>({snapshot:null,allowed:()=>true});
export const useArcadeRoomControls=()=>useContext(ArcadeRoomContext);
