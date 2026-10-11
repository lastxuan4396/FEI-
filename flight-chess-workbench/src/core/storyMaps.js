export const LEGACY_STORY={
 start:{title:'今天，把时间交给一段旅程',text:'车站有两张地图：一张通向森林，一张通向城市。',options:[{label:'走进森林',to:'forest'},{label:'探索城市',to:'city'}]},
 forest:{title:'林间岔路',text:'溪水传来声音，树屋亮着灯。',options:[{label:'沿溪流慢慢走',to:'creek'},{label:'拜访树屋',to:'tree'}]},
 city:{title:'街角的邀请',text:'书店与画廊都还开着门。',options:[{label:'走进书店',to:'books'},{label:'去看画展',to:'gallery'}]},
 creek:{title:'溪流旁的约定',text:'交换一个想一起去的地方。',task:true,to:'camp'},
 tree:{title:'树屋里的故事',text:'一起接龙一个三句话的小故事。',task:true,to:'camp'},
 books:{title:'写给彼此的书签',text:'说一句希望对方记住的话。',task:true,to:'square'},
 gallery:{title:'给作品起名字',text:'各想一个标题，说说为什么。',task:true,to:'square'},
 camp:{title:'夜色将近',text:'你们想把旅程停在哪里？',options:[{label:'留下看星星',to:'stars'},{label:'一起带着故事回家',to:'home'}]},
 square:{title:'广场上的最后一首歌',text:'城市还没有睡。',options:[{label:'在露台写一封信',to:'letter'},{label:'加入广场的小演出',to:'show'}]},
 stars:{title:'星空结局',ending:'你们收藏了一片共同看过的星空。'},home:{title:'归途结局',ending:'日常里多了一段可以慢慢讲的故事。'},letter:{title:'书信结局',ending:'两封信记录下了今天的心情。'},show:{title:'舞台结局',ending:'你们把一个普通夜晚变成了小小庆典。'}
};
const CHAPTERS=[
 {title:'林间的邀请',text:'溪水与树屋各留下一条路线，今天由谁带路？',routes:[['沿溪流寻找风景','溪流旁的约定','交换一个想一起去的地方。','溪流书签'],['拜访树屋','树屋里的故事','一起接龙一个三句话的小故事。','树屋剪影']]},
 {title:'街角的灯光',text:'旧书店还开着门，画廊也亮起了灯。',routes:[['走进旧书店','写给彼此的书签','说一句希望对方记住的话。','书店纸签'],['去看画展','给作品起名字','各想一个标题，说说为什么。','画展门票']]},
 {title:'海边的岔路',text:'一条路通向灯塔，一条路靠近沙滩。',routes:[['沿着海岸去灯塔','灯塔下的愿望','各说一个期待一起完成的小愿望。','灯塔邮戳'],['去沙滩散步','潮水带来的礼物','为今天的旅程想一个名字。','贝壳纪念']]},
 {title:'花园午后',text:'花房和茶亭都邀请你们停一会儿。',routes:[['去花房寻找颜色','花房里的配色','各用三个词形容今天的心情。','花园色卡'],['到茶亭坐坐','茶亭里的约定','分享一件最近感谢对方的事。','茶亭票根']]},
 {title:'山间来信',text:'山路分为观景台和驿站两条小径。',routes:[['登上观景台','山顶的眺望','轮流描述一个理想的周末。','山顶印章'],['拜访山间驿站','驿站的明信片','互相推荐一个想去的地方。','驿站信封']]},
 {title:'夜市相遇',text:'小剧场和夜市摊位都传来热闹的声音。',routes:[['去听小剧场演出','掌声里的心意','一起哼十秒喜欢的旋律。','剧场票根'],['逛逛夜市','街角的小惊喜','分享一件今天值得开心的小事。','夜市地图']]}
];
const legacyMementos={start:'出发车票',forest:'林间书签',city:'城市明信片',camp:'星空剪影',square:'街角音符'};
const cache=new Map();
export function storyMap(config={}){
 if(!config.story)return LEGACY_STORY;
 const count=config.story.chapters;if(cache.has(count))return cache.get(count);
 const graph={};
 for(let i=0;i<count;i++){
  const chapter=CHAPTERS[i%CHAPTERS.length],id=`chapter${i+1}`,next=i+1<count?`chapter${i+2}`:'finale';
  graph[id]={title:`第${i+1}章 · ${chapter.title}`,text:chapter.text,chapter:i+1,memento:`第${i+1}章 · 旅途印记`,options:chapter.routes.map((r,j)=>({label:r[0],to:`${id}_${j}`}))};
  chapter.routes.forEach((r,j)=>{graph[`${id}_${j}`]={title:r[1],text:r[2],task:true,to:next,chapter:i+1};});
 }
 graph.finale={title:'最后一站，想把旅程留在哪里？',text:'一路的选择和收藏，都写进今天的结局。',chapter:count,options:[{label:'留下看星星',to:'stars'},{label:'带着故事回家',to:'home'},{label:'写信纪念今天',to:'letter'},{label:'一起庆祝这段旅程',to:'show'}]};
 for(const id of ['stars','home','letter','show'])graph[id]={...LEGACY_STORY[id],chapter:count};
 cache.set(count,graph);return graph;
}
export function storyMemento(config,node){return config.story?storyMap(config)[node]?.memento:legacyMementos[node];}
export function storyDetourLimit(config){return config.story?.detours??3;}
export function storyEntry(config){return config.story?'chapter1':'start';}
