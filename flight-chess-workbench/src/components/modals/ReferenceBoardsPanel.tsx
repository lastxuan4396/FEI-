import {useEffect,useState} from 'react';
export interface ReferenceBoard {id:number;name:string;title:string;width:number;height:number;ocrLines:number;preparedCells?:number}
export function ReferenceBoardsPanel({busy,onImage,onMap}:{busy:boolean;onImage:(board:ReferenceBoard)=>void;onMap:(board:ReferenceBoard)=>void}){
 const [boards,setBoards]=useState<ReferenceBoard[]>([]),[error,setError]=useState(false);
 useEffect(()=>{let live=true;void fetch(`${import.meta.env.BASE_URL}api/reference-boards`).then(async r=>{if(!r.ok)return;const data=await r.json();if(live&&Array.isArray(data.boards))setBoards(data.boards);}).catch(()=>{if(live)setError(true);});return()=>{live=false;};},[]);
 if(!boards.length)return error?<small>原图集合暂时读不到，仍可使用上传图片。</small>:null;
 return <details className="studio-reference-library"><summary>你发过的原图 · {boards.length}张</summary><p>选图继续整理。文字识别是待核对候选；已整理地图也可能有待补内容和人工条件。</p><div className="studio-reference-grid">{boards.map(board=><article key={board.id} data-reference-board={board.id}><img loading="lazy" src={`${import.meta.env.BASE_URL}api/reference-boards/${board.id}/thumbnail`} alt={board.title}/><b>{board.title}</b><small>{board.width} × {board.height} · 候选文字{board.ocrLines}行</small><button disabled={busy} onClick={()=>onImage(board)}>载入原图 {board.id}</button>{board.preparedCells&&<button disabled={busy} onClick={()=>onMap(board)}>打开已整理{board.preparedCells}格地图</button>}</article>)}</div></details>;
}
