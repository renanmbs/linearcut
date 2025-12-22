// optimizer.js
// High-efficiency cutting stock optimizer (pattern-based, bounded)

export function runMasterOptimization(stockLen, kerf, partsList) {
  if (stockLen <= 0) return [];

  // Expand parts
  const partTypes = partsList
    .map(p => ({ len: Number(p.length), qty: Number(p.qty) }))
    .filter(p => p.len > 0 && p.qty > 0)
    .sort((a, b) => b.len - a.len);

  if (!partTypes.length) return [];

  // Remaining demand
  const demand = partTypes.map(p => p.qty);

  // --- Phase 1: Generate GOOD patterns (bounded DFS) ---
  const patterns = [];

  const dfs = (idx, cuts, used, counts) => {
    if (used > stockLen) return;

    const waste = stockLen - used;
    if (cuts.length > 0) {
      patterns.push({
        cuts: [...cuts],
        counts: [...counts],
        waste,
        efficiency: 1 - waste / stockLen
      });
    }

    for (let i = idx; i < partTypes.length; i++) {
      if (counts[i] >= partTypes[i].qty) continue;

      const needed = partTypes[i].len + kerf;
      if (used + needed > stockLen) continue;

      counts[i]++;
      cuts.push(partTypes[i].len);
      dfs(i, cuts, used + needed, counts);
      cuts.pop();
      counts[i]--;
    }
  };

  dfs(0, [], 0, Array(partTypes.length).fill(0));

  // Sort best patterns first
  patterns.sort((a, b) => {
    if (Math.abs(b.efficiency - a.efficiency) > 0.0001)
      return b.efficiency - a.efficiency;
    return b.cuts.length - a.cuts.length;
  });

  // --- Phase 2: Global pattern selection ---
  const selected = [];

  while (demand.some(q => q > 0)) {
    let best = null;
    let bestScore = -Infinity;

    for (const p of patterns) {
      let covered = 0;
      let over = 0;

      p.counts.forEach((c, i) => {
        covered += Math.min(c, demand[i]);
        over += Math.max(0, c - demand[i]);
      });

      if (!covered) continue;

      const score =
        p.efficiency * 100 +
        covered * 15 -
        over * 8 -
        p.waste * 0.05;

      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }

    if (!best) break;

    selected.push(best);
    best.counts.forEach((c, i) => {
      demand[i] = Math.max(0, demand[i] - c);
    });
  }

  // --- Phase 3: Group layouts ---
  const map = new Map();

  selected.forEach(p => {
    const key = [...p.cuts].sort((a, b) => b - a).join(",");
    if (!map.has(key)) {
      map.set(key, {
        stockLength: stockLen,
        cuts: [...p.cuts].sort((a, b) => b - a),
        waste: p.waste,
        repetition: 1
      });
    } else {
      map.get(key).repetition++;
    }
  });

  return [...map.values()].sort((a, b) => b.repetition - a.repetition);
}
