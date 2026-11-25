import { useMemo } from 'react';
import { useRootData } from '../app/useRootData';
import { makeGame, type Game } from './game';

/** The awards for this content and these rules (SRS v2.3 §3.8). */
export function useGame(): Game {
  const { content, gamification } = useRootData();
  return useMemo(() => makeGame(content, gamification), [content, gamification]);
}
