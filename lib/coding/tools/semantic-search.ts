// Dummy semantic search using string similarity (replace with embeddings for production)
export async function semanticSearch(concept: string, { seedData, learntDir, domain }: any) {
  // Example: find closest concept by Levenshtein distance
  if (!seedData) return null;
  let best = null, minDist = Infinity;
  for (const key of Object.keys(seedData)) {
    const dist = levenshtein(concept, key);
    if (dist < minDist) {
      minDist = dist;
      best = seedData[key];
    }
  }
  return minDist <= 3 ? best : null; // Only return if reasonably close
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
