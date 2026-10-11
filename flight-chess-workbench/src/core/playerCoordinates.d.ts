import type {CoreConfig,EngineState} from './types';
export function playerCoordinates(config:CoreConfig,players:EngineState['players']):{id:string;coordinate:[number,number];sourceCoordinate?:[number,number]}[];
