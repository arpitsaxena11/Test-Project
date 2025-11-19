import axios from "axios";

export async function websiteExists(url) {
  try {
    const res = await axios.head(url, { timeout: 3000 });
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}
