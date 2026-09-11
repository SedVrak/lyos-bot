export interface QuestReward {
  type: string;
  amount: number;
}

export interface Quest {
  _id: string;
  quest_id: string;
  quest_key: string;
  title: string;
  description: string;
  category: string;
  rarity: string;
  current_value: number;
  target_value: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: QuestReward;
}

export interface QuestStreak {
  current: number;
  best: number;
  total_completed: number;
  next_milestone: number;
  freezes: number;
  freeze_days_left: number;
  lost_streak_value: number;
  freezes_consumed_on_break: number;
}

export interface QuestStats {
  completed: number;
  total: number;
  canClaim: number;
}

export interface DailyQuestsResponse {
  quests: Quest[];
  starterQuests: Quest[];
  streak: QuestStreak;
  stats: QuestStats;
}
