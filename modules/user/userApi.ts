// Typically, user data is internal, but here’s a stub for external user info
import axios from "axios";

export async function fetchUserProfile(userId: string) {
  // Example: fetch from a user profile API
  const url = `https://api.example.com/user/${encodeURIComponent(userId)}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch {
    return null;
  }
}
