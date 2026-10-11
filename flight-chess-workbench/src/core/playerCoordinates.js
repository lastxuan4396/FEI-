import {boardGeometry} from './boardLayouts.js';
import {imageDisplay} from './imageDisplay.js';

// Inspection coordinates must use the same source-region transform as the artwork.
export function playerCoordinates(config, players) {
 const image=config.layout.image;
 if(!image){const path=boardGeometry(config).path;return players.map(p=>({id:p.id,coordinate:path[p.position]}));}
 return players.map(p=>{
  const region=image.regions[p.position],display=imageDisplay(image,region),box=display.crop;
  return {id:p.id,coordinate:[box.x+box.width/2,box.y+box.height/2],sourceCoordinate:[(region.x+region.width/2)*image.width,(region.y+region.height/2)*image.height]};
 });
}
