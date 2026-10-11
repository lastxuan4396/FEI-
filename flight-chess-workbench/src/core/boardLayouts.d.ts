import type { CoreConfig } from './types';
export const BOARD_STYLES: string[];
export function referenceLayout(id: string): CoreConfig['layout'];
export function boardGeometry(config: CoreConfig): CoreConfig['layout'];

export function extendedLayout(id:string,count:number,shape?:'reference'|'snake'|'spiral'):CoreConfig['layout'];
