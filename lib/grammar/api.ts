import axios from "axios";

export async function fetchGrammarRule(rule: string) {
  // Example: fetch from a grammar API (customize as needed)
  const url = `https://api.grammarbot.io/v2/rule/${encodeURIComponent(rule)}`;
  try {
    const { data } = await axios.get(url);
    return { rule: data.description || "" };
  } catch {
    return null;
  }
}
