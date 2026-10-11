"""Local-only OCR/photograph processing worker. JSON-line protocol; never executes image text."""
import base64, json, sys, time, logging
import cv2
import numpy as np
from rapidocr import RapidOCR, ModelType
from row_segmentation import reading_regions
from arrow_segmentation import isolated_arrows
logging.disable(logging.CRITICAL)
engine = None
comparison_engine = None
precision_engine = None

def decode(data):
    if not isinstance(data,str) or len(data)>8_000_000 or not data.startswith(('data:image/png;base64,','data:image/jpeg;base64,','data:image/webp;base64,')):
        raise ValueError('图片格式或大小不正确')
    image=cv2.imdecode(np.frombuffer(base64.b64decode(data.split(',',1)[1],validate=True),np.uint8),cv2.IMREAD_COLOR)
    if image is None or image.size>4096*4096*3: raise ValueError('图片无法解码或超过4096像素限制')
    return image

def encode(image):
    height,width=image.shape[:2]
    # Preserve detail for editing/OCR; map export compresses separately.
    ok,encoded=cv2.imencode('.jpg',image,[cv2.IMWRITE_JPEG_QUALITY,92])
    if not ok: raise ValueError('图片处理失败')
    return {'dataUrl':'data:image/jpeg;base64,'+base64.b64encode(encoded).decode(),'width':width,'height':height}

def recognize(image,regions,profile="default"):
    global engine, comparison_engine, precision_engine
    if profile not in ("default","comparison","rows","rowsComparison"): raise ValueError("文字识别方式不正确")
    if engine is None:
        engine=RapidOCR(params={'Global.text_score':0.35,'Global.return_single_char_box':True,'Det.limit_side_len':1600,'EngineConfig.onnxruntime.intra_op_num_threads':2,'EngineConfig.onnxruntime.inter_op_num_threads':2})
    active_engine=engine
    if profile=="comparison":
        if comparison_engine is None:
            comparison_engine=RapidOCR(params={"Global.text_score":0.35,"Global.return_single_char_box":True,"Det.limit_side_len":960,"Det.limit_type":"max","EngineConfig.onnxruntime.intra_op_num_threads":2,"EngineConfig.onnxruntime.inter_op_num_threads":2})
        active_engine=comparison_engine
    if profile=="rowsComparison":
        if precision_engine is None:
            precision_engine=RapidOCR(params={"Global.text_score":0.35,"Rec.model_type":ModelType.MEDIUM,"EngineConfig.onnxruntime.intra_op_num_threads":2,"EngineConfig.onnxruntime.inter_op_num_threads":2})
        active_engine=precision_engine
    if profile in ("rows","rowsComparison") and not regions: raise ValueError("横行识别需要已确认的格框")
    height,width=image.shape[:2];lines=[]
    jobs=[(image,0,0,width,height)]
    # Optional crops increase small text size without inventing pixels or replacing original results.
    if regions:
        if len(regions)>256: raise ValueError('最多256个分格')
        jobs=[]
        for r in regions:
            x,y,w,h=[float(r[k]) for k in ('x','y','width','height')]
            if not all(np.isfinite(v) for v in (x,y,w,h)) or x<0 or y<0 or w<=0 or h<=0 or x+w>1.000001 or y+h>1.000001: raise ValueError('分格位置不正确')
            x1=max(0,round(x*width));y1=max(0,round(y*height));x2=min(width,round((x+w)*width));y2=min(height,round((y+h)*height))
            crop=image[y1:y2,x1:x2]
            if crop.size: jobs.append((crop,x1,y1,x2-x1,y2-y1))
    if profile in ("rows","rowsComparison"):
        for crop,x,y,w,h in jobs:
            pad=min(4,max(1,min(w,h)//12));inner=crop[pad:h-pad,pad:w-pad]
            if min(inner.shape[:2])<3: continue
            arrows=isolated_arrows(inner)
            for arrow in arrows:
                first=max(0,arrow['y']-2);last=min(inner.shape[0],arrow['y']+arrow['height']+2)
                scale=min(3,2048/inner.shape[1],512/(last-first))
                strip=cv2.resize(inner[first:last],None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
                out=active_engine(strip,use_det=False,use_cls=False,use_rec=True,return_word_box=False)
                raw=''.join(out.txts or [])
                glyph={'up':'↑','down':'↓','left':'←','right':'→'}[arrow['direction']]
                lines.append({'text':glyph,'originalText':raw,'graphic':arrow['direction'],
                              'confidence':arrow['score'],'x':(x+pad+arrow['x'])/width,
                              'y':(y+pad+arrow['y'])/height,'width':arrow['width']/width,
                              'height':arrow['height']/height,'reviewed':False})
            for left,first,band_width,band_height in reading_regions(inner,arrows):
                last=first+band_height
                first=max(0,first-2);last=min(inner.shape[0],last+2)
                scale=min(3,2048/band_width,512/(last-first))
                strip=cv2.resize(inner[first:last,left:left+band_width],None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
                out=active_engine(strip,use_det=False,use_cls=False,use_rec=True,return_word_box=False)
                for text,score in zip(out.txts or [],out.scores or []):
                    lines.append({'text':text,'confidence':round(float(score),4),'x':(x+pad+left)/width,'y':(y+pad+first)/height,'width':band_width/width,'height':(last-first)/height,'reviewed':False})
                    if len(lines)>2000: raise ValueError('超过2000行文字，请将图片分段识别；已有记录不受影响')
        if len(lines)>2000: raise ValueError('超过2000行文字，请将图片分段识别；已有记录不受影响')
        return {'lines':lines,'engine':'RapidOCR 3.9.2 · '+('第二模型横行对照 · PP-OCRv6 medium' if profile=='rowsComparison' else '横行精读 · 文字/箭头分离'),'width':width,'height':height}
    for crop,x,y,w,h in jobs:
        scale=min(4,max(1,700/max(w,h))) if regions else 1
        if scale>1: crop=cv2.resize(crop,None,fx=scale,fy=scale,interpolation=cv2.INTER_CUBIC)
        out=active_engine(crop,use_det=True,use_cls=True,use_rec=True,return_word_box=True)
        if out.boxes is None: continue
        for index,(b,text,score) in enumerate(zip(out.boxes,out.txts,out.scores)):
            b=np.asarray(b)/scale
            x1=max(0,float(b[:,0].min())+x);y1=max(0,float(b[:,1].min())+y);x2=min(width,float(b[:,0].max())+x);y2=min(height,float(b[:,1].max())+y)
            words=[]
            if len(out.word_results)==len(out.txts):
                for wt,ws,wb in out.word_results[index]:
                    if wb is None: continue
                    wb=np.asarray(wb)/scale;wx1=max(0,float(wb[:,0].min())+x);wy1=max(0,float(wb[:,1].min())+y);wx2=min(width,float(wb[:,0].max())+x);wy2=min(height,float(wb[:,1].max())+y)
                    if wx2>wx1 and wy2>wy1: words.append({'text':wt,'confidence':round(float(ws),4),'x':wx1/width,'y':wy1/height,'width':(wx2-wx1)/width,'height':(wy2-wy1)/height})
            lines.append({'words':words,'text':text,'confidence':round(float(score),4),'x':x1/width,'y':y1/height,'width':max(.0001,(x2-x1)/width),'height':max(.0001,(y2-y1)/height),'reviewed':False})
    if len(lines)>2000: raise ValueError('超过2000行文字，请将图片分段识别；已有记录不受影响')
    return {'lines':lines,'engine':'RapidOCR 3.9.2 · PP-OCRv6 small'+(' · 交叉校对' if profile=='comparison' else ''),'width':width,'height':height}

def process(request):
    image=decode(request.get('dataUrl'));operation=request.get('operation','ocr')
    if operation=='ocr': return recognize(image,request.get('regions'),request.get('profile','default'))
    if operation=='enhance':
        lab=cv2.cvtColor(image,cv2.COLOR_BGR2LAB);l,a,b=cv2.split(lab)
        clahe=cv2.createCLAHE(clipLimit=1.8,tileGridSize=(8,8));l=clahe.apply(l)
        image=cv2.cvtColor(cv2.merge([l,a,b]),cv2.COLOR_LAB2BGR)
        blur=cv2.GaussianBlur(image,(0,0),1);image=cv2.addWeighted(image,1.45,blur,-.45,0)
    elif operation=='rotate':
        angle=float(request.get('angle',0))
        if not np.isfinite(angle) or abs(angle)>180: raise ValueError('旋转角度不正确')
        if angle in (90,-90,180,-180):
            image=cv2.rotate(image,{90:cv2.ROTATE_90_CLOCKWISE,-90:cv2.ROTATE_90_COUNTERCLOCKWISE,180:cv2.ROTATE_180,-180:cv2.ROTATE_180}[angle])
        else:
            h,w=image.shape[:2];matrix=cv2.getRotationMatrix2D((w/2,h/2),-angle,1)
            nw=int(h*abs(matrix[0,1])+w*abs(matrix[0,0]));nh=int(h*abs(matrix[0,0])+w*abs(matrix[0,1]));matrix[0,2]+=(nw-w)/2;matrix[1,2]+=(nh-h)/2
            image=cv2.warpAffine(image,matrix,(nw,nh),borderValue=(255,255,255))
    elif operation=='perspective':
        corners=np.asarray(request.get('corners'),dtype=np.float32)
        if corners.shape!=(4,2) or not np.isfinite(corners).all() or (corners<0).any() or (corners>1).any(): raise ValueError('请按左上、右上、右下、左下标记四角')
        h,w=image.shape[:2];corners*=np.array([w,h],dtype=np.float32)
        edges=[corners[(i+1)%4]-corners[i] for i in range(4)]
        cross=[edges[i][0]*edges[(i+1)%4][1]-edges[i][1]*edges[(i+1)%4][0] for i in range(4)]
        if not all(c>10 for c in cross): raise ValueError('四角顺序不正确或范围太小')
        nw=round(max(np.linalg.norm(corners[1]-corners[0]),np.linalg.norm(corners[2]-corners[3])));nh=round(max(np.linalg.norm(corners[3]-corners[0]),np.linalg.norm(corners[2]-corners[1])))
        if min(nw,nh)<40: raise ValueError('校正区域太小')
        matrix=cv2.getPerspectiveTransform(corners,np.float32([[0,0],[nw-1,0],[nw-1,nh-1],[0,nh-1]]));image=cv2.warpPerspective(image,matrix,(nw,nh),borderValue=(255,255,255))
    else: raise ValueError('未知操作')
    if max(image.shape[:2])>4096:
        image=cv2.resize(image,None,fx=4096/max(image.shape[:2]),fy=4096/max(image.shape[:2]),interpolation=cv2.INTER_AREA)
    return encode(image)

for source in sys.stdin:
    req={}
    try:
        req=json.loads(source);began=time.monotonic();result=process(req)
        print(json.dumps({'id':req['id'],'result':result,'elapsed':round(time.monotonic()-began,2)},ensure_ascii=False),flush=True)
    except Exception as error:
        print(json.dumps({'id':req.get('id'),'error':str(error)[:250]},ensure_ascii=False),flush=True)
