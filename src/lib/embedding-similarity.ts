export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

export interface DriftResult {
  day1: number[];
  day7: number[];
  cosineSimilarity: number;
  euclideanDistance: number;
  driftStatus: 'stable' | 'minor' | 'unstable';
}

export function analyzeDrift(day1: number[], day7: number[]): DriftResult {
  const cos = cosineSimilarity(day1, day7);
  const euc = euclideanDistance(day1, day7);
  let driftStatus: 'stable' | 'minor' | 'unstable';
  if (euc < 0.05) {
    driftStatus = 'stable';
  } else if (euc < 0.15) {
    driftStatus = 'minor';
  } else {
    driftStatus = 'unstable';
  }
  return { day1, day7, cosineSimilarity: cos, euclideanDistance: euc, driftStatus };
}

export interface SimilarityMatrix {
  source: string;
  targets: { target: string; similarity: number }[];
}

export function buildSimilarityMatrix(source: number[], targets: Record<string, number[]>): SimilarityMatrix {
  return {
    source: 'query',
    targets: Object.entries(targets)
      .map(([target, vec]) => ({
        target,
        similarity: cosineSimilarity(source, vec),
      }))
      .sort((a, b) => b.similarity - a.similarity),
  };
}

export function detectOpportunityGap(
  brandVec: number[],
  competitorVecs: Record<string, number[]>,
  threshold = 0.3
): string[] {
  const gaps: string[] = [];
  for (const [name, vec] of Object.entries(competitorVecs)) {
    const sim = cosineSimilarity(brandVec, vec);
    if (sim < threshold) {
      gaps.push(`${name}: similarity=${sim.toFixed(3)} — low overlap, potential gap`);
    }
  }
  return gaps;
}
