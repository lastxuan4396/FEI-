// Display-only quarter turns; saved pixels and normalized source regions stay unchanged.
export function imageDisplay(image, region) {
 const {width:w,height:h}=image,rotation=image.displayRotation??0;
 const transform=rotation===90?`translate(${h},0) rotate(90)`:rotation===180?`translate(${w},${h}) rotate(180)`:rotation===270?`translate(0,${w}) rotate(-90)`:undefined;
 const result={width:rotation%180?h:w,height:rotation%180?w:h,transform};
 if(region){const x=region.x*w,y=region.y*h,rw=region.width*w,rh=region.height*h;result.crop=rotation===90?{x:h-y-rh,y:x,width:rh,height:rw}:rotation===180?{x:w-x-rw,y:h-y-rh,width:rw,height:rh}:rotation===270?{x:y,y:w-x-rw,width:rh,height:rw}:{x,y,width:rw,height:rh};}
 return result;
}

// Upright overlay content is laid out in the displayed cell's dimensions,
// then counter-rotated inside the existing source-pixel coordinate group.
export function imageTaskOverlay(image,region){
 const rotation=image.displayRotation??0,cx=(region.x+region.width/2)*image.width,cy=(region.y+region.height/2)*image.height;
 const w=region.width*image.width,h=region.height*image.height,width=rotation%180?h:w,height=rotation%180?w:h;
 return {x:cx-width/2,y:cy-height/2,width,height,...(rotation?{transform:`rotate(${-rotation},${cx},${cy})`}:{})};
}
