// src/utils/webLlmClient.ts
export type ProgressCallback = (statusText: string, progress: number) => void;

export async function generateClientSideText(
  prompt: string,
  modelName: string = "gemini-3.5-flash",
  onProgress?: ProgressCallback
): Promise<string> {
  if (typeof window === "undefined") return "";

  if (onProgress) {
    onProgress("Connecting to Google AI Studio...", 0.2);
  }

  const storedKey = typeof window !== "undefined" ? localStorage.getItem("clausely_gemini_api_key") : null;
  const apiKey = storedKey || "AIzaSyBxIH7djQBGfyseyXtRDxXOfnSg_Up5hOI";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  try {
    if (onProgress) {
      onProgress(`Sending request to Gemini (${modelName})...`, 0.6);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are Clausely In-Browser Drafting Core. Generate a court-ready document draft based on the user's intent. Do not include reasoning or prefaces. Prompt: ${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    if (onProgress) {
      onProgress("Processing response content...", 0.9);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (onProgress) {
      onProgress("Generation complete!", 1.0);
    }

    return generatedText;
  } catch (error: any) {
    console.error("Gemini API error: ", error);
    throw error;
  }
}
