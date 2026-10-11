declare module 'spin-wheel' {
 interface WheelProps {items:{label:string}[];itemBackgroundColors?:string[];itemLabelColors?:string[];itemLabelFontSizeMax?:number;itemLabelRadius?:number;itemLabelRadiusMax?:number;itemLabelAlign?:string;pointerAngle?:number;isInteractive?:boolean;lineColor?:string;lineWidth?:number;onRest?:(event:{currentIndex:number})=>void;rotation?:number}
 export class Wheel {constructor(container:HTMLElement,props:WheelProps);rotation:number;spinToItem(index:number,duration:number,center?:boolean,revolutions?:number,direction?:number):void;remove():void;stop():void;getCurrentIndex():number}
}
