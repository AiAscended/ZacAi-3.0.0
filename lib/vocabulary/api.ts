import axios from "axios";

export async function fetchDefinition(word: string) {
  // Example: fetch from a dictionary API
  const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;
  try {
    const { data } = await axios.get(url);
    return { definition: data[0]?.meanings[0]?.definitions[0]?.definition || "" };
  } catch {
    return null;
  }
}
