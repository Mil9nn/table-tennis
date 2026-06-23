import { describe, it, expect } from 'vitest';
import { computeServeTypeStats } from '@/lib/match-stats-utils';

describe('computeServeTypeStats', () => {
  it('counts serve types when server won the point (server === player)', () => {
    const games = [
      {
        shots: [
          {
            stroke: 'serve_point',
            serveType: 'side_spin',
            server: 'p1',
            player: 'p1',
          },
        ],
      },
    ];

    const stats = computeServeTypeStats(games as any[]);
    expect(stats['p1']).toBeDefined();
    expect(stats['p1'].serve.side_spin).toBe(1);
  });

  it('does not count serve types when server did not win the point', () => {
    const games = [
      {
        shots: [
          {
            stroke: 'serve_point',
            serveType: 'side_spin',
            server: 'p2',
            player: 'p1',
          },
        ],
      },
    ];

    const stats = computeServeTypeStats(games as any[]);
    expect(Object.keys(stats).length).toBe(0);
  });

  it('uses player as fallback server id when server is missing and counts the serve', () => {
    const games = [
      {
        shots: [
          {
            stroke: 'serve_point',
            serveType: 'back_spin',
            server: null,
            player: 'p3',
          },
        ],
      },
    ];

    const stats = computeServeTypeStats(games as any[]);
    expect(stats['p3']).toBeDefined();
    expect(stats['p3'].serve.back_spin).toBe(1);
  });
});
