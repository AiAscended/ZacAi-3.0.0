import axios from "axios";

export async function fetchMathFact(query: string) {
  // Example: fetch from a math API (customize as needed)
  const url = `https://api.mathjs.org/v4/?expr=${encodeURIComponent(query)}`;
  try {
    const { data } = await axios.get(url);
    return { result: data };
  } catch {
    return null;
  }
}
