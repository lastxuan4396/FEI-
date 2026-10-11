import {EditableTaskLibrary} from '../EditableTaskLibrary';
import type {Workspace} from '../../core/workspace';
import type {LibraryAction} from '../../core/taskLibrary';
import { Theme } from '../../types';

interface ThemesViewProps {
  themes: Theme[];
  workspace:Workspace;
  onLevels:(levels:number[])=>Promise<boolean|null>;
  onLibraryChange:(action:LibraryAction)=>Promise<boolean|null>;
  onCreateTheme: () => void;
  onEditTheme: (themeId: string) => void;
}

const audienceLabel: Record<Theme['audience'], string> = {
  common: '通用',
  male: '仅男方',
  female: '仅女方'
};

export function ThemesView({ themes, workspace,onLevels,onLibraryChange,onCreateTheme, onEditTheme }: ThemesViewProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">题库</h2>
      </div>
      <EditableTaskLibrary workspace={workspace} onLevels={onLevels} onChange={onLibraryChange}/>
      <details className="library-legacy"><summary>其他题库与旧主题 · 可继续编辑</summary><div className="space-y-3">
        <button className="h-9 px-4 rounded-full bg-white text-black text-sm font-semibold ios-btn" onClick={onCreateTheme}>新建主题</button>
        {themes.map(theme => (
          <div
            key={theme.id}
            className="ios-card p-4 border border-white/5 ios-btn cursor-pointer"
            onClick={() => onEditTheme(theme.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="text-white font-semibold">{theme.name}</div>
                <div className="text-xs text-gray-500 mt-1">{theme.desc}</div>
                <div className="mt-2 inline-flex items-center gap-2">
                  <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300">
                    {audienceLabel[theme.audience]}
                  </div>
                </div>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded text-[10px] text-gray-300">
                {theme.tasks.length}卡
              </div>
            </div>
          </div>
        ))}
      </div></details>
    </div>
  );
}
