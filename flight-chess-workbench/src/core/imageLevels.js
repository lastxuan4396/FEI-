// Initial content classification for filtering the supplied text, not OCR proof.
export const IMAGE_LEVEL_LABELS = [{id:1,name:'基础'},{id:2,name:'进阶'},{id:3,name:'高阶'}];
export function validateImageLevels(value=[1,2,3]){
 if(!Array.isArray(value)||value.length<1||value.length>3||new Set(value).size!==value.length||value.some(n=>!Number.isInteger(n)||n<1||n>3))throw Error('请选择至少一个等级，等级只能为1、2、3。');
 return [...value].sort((a,b)=>a-b);
}
export function imageTaskLevel(text){
 text=text.replace(/\s/g,'');
 if(/电击|呼吸|窒息|憋尿|禁止.*尿|不准.*尿|插入|抽插|插穴|肛交|口交|菊花|尿道|肛门|强行|强制|不能拒绝|无权|奴|母狗|鞭|抽打|耳光|藤条|皮带|sp\b|otk\b|高潮|射精|射出|禁.*射|不许射|不许停|不射|至射|禁.*潮|捆|束缚|全包|重度|吊|冰块/i.test(text))return 3;
 if(/乳|奶头|私处|阴|鸡巴|鸡吧|撸鸡|撸管|睾丸|蛋蛋|揉档|揉裆|分泌物|龟头|下体|口爱|自慰|自愈|自感|自嗨|自慰|性器|生殖|裸|脱.*衣|内裤|胯|腿根|挑逗|69|屁股|亲吻.*身体|舔/i.test(text))return 2;
 return 1;
}
