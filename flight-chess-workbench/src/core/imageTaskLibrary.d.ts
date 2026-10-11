export interface ImageTask {image:number;cell:string;text:string;duration?:number;reviewed:boolean}
export const IMAGE_TASK_LIBRARY:readonly ImageTask[];
export const IMAGE_TASK_TEXTS:readonly string[];
export function imageTask(text:string):ImageTask|undefined;

export interface ImageContentLine {text:string;confidence:number;x:number;y:number;width:number;height:number;reviewed:boolean}
export interface ImageContentCell extends ImageContentLine {index:number;type:string;label?:string}
export interface ImageReviewIssue {position?:number;area?:string;reason:string}
export interface ImageContentBoard {id:number;name:string;width:number;height:number;lines:ImageContentLine[];cells:ImageContentCell[];rawCells?:ImageContentCell[];reviewedNotes?:ImageContentLine[];reviewStatus?:{method:string;sourceSha256:string;reviewedPositions:number;positions:number;unresolved:ImageReviewIssue[]|{bodyPositions:number[];notes?:number[];additionalTasks?:string[];reason:string}}}
export const IMAGE_CONTENT:{version:number;boards:ImageContentBoard[]};

export function imageReviewIssues(board:ImageContentBoard):ImageReviewIssue[];
