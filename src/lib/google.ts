import "dotenv/config";

let googleInstance: any = null;

export async function getGoogle() {
  if (!googleInstance) {
    console.log("Dynamically importing googleapis...");
    const { google } = await import("googleapis");
    googleInstance = google;
    console.log("googleapis imported successfully.");
  }
  return googleInstance;
}
