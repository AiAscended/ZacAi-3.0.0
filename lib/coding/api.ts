import axios from "axios";

export async function fetchDocs(domain: string, concept: string) {
  // Example: fetch from official docs (customize per domain)
  const url = `https://api.docs.example.com/${domain}/${concept}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    return null;
  }
}
