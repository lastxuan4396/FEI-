import {Story} from 'inkjs';
import storyData from './arcadeStory.json' with {type:'json'};
import storyMapsData from './arcadeStoryMaps.json' with {type:'json'};
const data=config=>config?.story?storyMapsData[config.story.chapters]:storyData;
function load(saved,config){
 if(!config?.story)return saved;
 const envelope=JSON.parse(saved);if(envelope.format!=='chapter-journey'||envelope.chapters!==config.story.chapters||typeof envelope.ink!=='string')throw Error('剧情章节与存档不一致');return envelope.ink;
}
function save(ink,config){return config?.story?JSON.stringify({format:'chapter-journey',chapters:config.story.chapters,ink}):ink;}

export function readStoryStep(saved, index, config) {
 const story=new Story(data(config));
 if(saved)story.state.LoadJson(load(saved,config));
 if(index!==undefined)story.ChooseChoiceIndex(index);
 let node='';const text=[];
 while(story.canContinue){text.push(story.Continue().trim());for(const tag of story.currentTags??[])if(tag.startsWith('node:'))node=tag.slice(5);}
 if(!node)throw Error('剧情节点不完整');
 return {node,text,choices:story.currentChoices.map(c=>c.text),saved:save(story.state.ToJson(),config)};
}

export function verifyStorySave(saved,node,choices,config){
 if(typeof saved!=='string'||!saved||saved.length>50000)throw Error('剧情存档不正确');
 const story=new Story(data(config));story.state.LoadJson(load(saved,config));
 const tag=(story.currentTags??[]).find(t=>t.startsWith('node:'));
 if(story.canContinue||JSON.stringify(story.currentChoices.map(c=>c.text))!==JSON.stringify(choices))throw Error('剧情分支记录不一致');
 if(tag!=='node:'+node)throw Error('剧情存档与节点不一致');
}
