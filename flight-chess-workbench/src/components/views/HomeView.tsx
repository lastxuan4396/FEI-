import { Player, Theme } from '../../types';
import { ChevronRight, User, UserRound } from 'lucide-react';

interface HomeViewProps {
  players: Player[];
  themes: Theme[];
  onSelectTheme: (playerId: number) => void;
  hasActive?: boolean;
  useTileDecks?: boolean;
  onSettings: () => void;
  onNewGame: () => void;
}

export function HomeView({ players, themes, onSelectTheme, hasActive, useTileDecks, onSettings, onNewGame }: HomeViewProps) {
  return (
    <div className="flex-1 flex flex-col justify-start space-y-5">
      <div className="text-center mb-4">
        <h2 className="text-xl text-gray-300 font-medium">配置游戏角色</h2>
        <p className="text-sm text-gray-500 mt-2">{useTileDecks ? '每个格子使用自己的题库，可在任务库中编辑' : '为每位玩家选择任务包，可在任务库中编辑'}</p>
      </div>

      <div className="space-y-4">
        {players.map((player, idx) => {
          const theme = themes.find(t => t.id === player.themeId);
          const isMale = idx === 0;

          return (
            <div
              key={player.id}
              className="ios-card p-5 flex items-center justify-between ios-btn cursor-pointer group border border-white/5"
              onClick={() => { if (!useTileDecks) onSelectTheme(player.id); }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: player.color,
                    boxShadow: `0 10px 15px -3px ${player.color}30`
                  }}
                >
                  {isMale ? (
                    <User className="text-white" size={24} />
                  ) : (
                    <UserRound className="text-white" size={24} />
                  )}
                </div>
                <div>
                  <div className="text-base font-semibold text-white">
                    {player.name} (Player {player.id + 1})
                  </div>
                  <div className="text-sm font-medium text-white mt-0.5">
                    {useTileDecks ? '按棋盘格子抽取任务' : theme?.name || '未选择主题'}
                  </div>
                </div>
              </div>
              <ChevronRight className="text-gray-600" size={20} />
            </div>
          );
        })}
      </div>

      <div className="flex gap-3"><button onClick={onSettings} className="flex-1 rounded-xl bg-white/10 py-3 text-sm text-white">玩家与规则</button>{hasActive && <button onClick={onNewGame} className="flex-1 rounded-xl bg-white/10 py-3 text-sm text-gray-300">结束当前局</button>}</div><div className="flex-1" />


    </div>
  );
}
