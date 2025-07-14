export async function semanticSearch(rule: string, { seedData }: any) {
  if (!seedData) return null;
  let best = null, minDist = Infinity;
  for (const key of Object.keys(seedData)) {
    const dist = levenshtein(rule, key);
    if (dist < minDist) {
      minDist = dist;
      best = seedData[key];
    }
  }
  return minDist <= 2 ? best : null;
}

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++)
    for (let j = 1; j <= a.length; j++)
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
  return matrix[b.length][a.length];
}
