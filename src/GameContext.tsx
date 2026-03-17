import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RiceIssue, ALL_RICE_ISSUES, IssueType } from './data/riceIssues';

// Game context for managing the current issue and game state

interface GameContextType {
  currentIssue: RiceIssue | null;
  usedIssueIds: string[];
  selectRandomIssue: (excludeIds?: string[]) => RiceIssue;
  selectIssueByType: (type: IssueType) => RiceIssue;
  resetUsedIssues: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentIssue, setCurrentIssue] = useState<RiceIssue | null>(null);
  const [usedIssueIds, setUsedIssueIds] = useState<string[]>([]);

  const selectRandomIssue = useCallback((excludeIds: string[] = []) => {
    const availableIssues = ALL_RICE_ISSUES.filter(
      issue => !excludeIds.includes(issue.id) && !usedIssueIds.includes(issue.id)
    );
    
    // If all issues used, reset
    if (availableIssues.length === 0) {
      const allExcluded = [...usedIssueIds, ...excludeIds];
      const remaining = ALL_RICE_ISSUES.filter(issue => !excludeIds.includes(issue.id));
      const selected = remaining[Math.floor(Math.random() * remaining.length)];
      setUsedIssueIds([selected.id]);
      setCurrentIssue(selected);
      return selected;
    }
    
    const selected = availableIssues[Math.floor(Math.random() * availableIssues.length)];
    setUsedIssueIds(prev => [...prev, selected.id]);
    setCurrentIssue(selected);
    return selected;
  }, [usedIssueIds]);

  const selectIssueByType = useCallback((type: IssueType) => {
    const issuesByType = ALL_RICE_ISSUES.filter(
      issue => issue.type === type && !usedIssueIds.includes(issue.id)
    );
    
    // If no issues of this type available, reset
    if (issuesByType.length === 0) {
      const allOfType = ALL_RICE_ISSUES.filter(issue => issue.type === type);
      const selected = allOfType[Math.floor(Math.random() * allOfType.length)];
      setUsedIssueIds([selected.id]);
      setCurrentIssue(selected);
      return selected;
    }
    
    const selected = issuesByType[Math.floor(Math.random() * issuesByType.length)];
    setUsedIssueIds(prev => [...prev, selected.id]);
    setCurrentIssue(selected);
    return selected;
  }, [usedIssueIds]);

  const resetUsedIssues = useCallback(() => {
    setUsedIssueIds([]);
    setCurrentIssue(null);
  }, []);

  return (
    <GameContext.Provider value={{
      currentIssue,
      usedIssueIds,
      selectRandomIssue,
      selectIssueByType,
      resetUsedIssues
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
