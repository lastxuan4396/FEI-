export async function readScene(file:File){
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10_000_000)throw Error('请选择10 MB以内的PNG、JPEG或WebP图片');
 const bitmap=await createImageBitmap(file);try{const ratio=Math.min(1,1000/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*ratio);canvas.height=Math.round(bitmap.height*ratio);const ctx=canvas.getContext('2d');if(!ctx)throw Error('图片处理失败');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);for(const quality of [.88,.75,.6,.5]){const url=canvas.toDataURL('image/jpeg',quality);if(url.length<=750000)return url;}throw Error('图片仍然过大，请裁剪后导入');}finally{bitmap.close();}
}
