import {createContext,type ReactNode} from 'react';

// The expanded map keeps the current game's task controls inside its focus boundary.
export const MapActivitiesContext=createContext<ReactNode>(null);
