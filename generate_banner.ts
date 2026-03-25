import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: "A high-resolution Facebook cover banner for 'BeatGangsta'. The central focus is the BeatGangsta mascot: a stylized, circular character with a cool expression, wearing a sleek black silk durag and a brilliant 'iced-out' diamond grill on its teeth. The background is a deep, dark emerald green and obsidian black, featuring a 'Palm Pre' inspired glassmorphism effect with a large, frosted glass pane that has soft, blurred edges. The text 'Coldest beats in the streets' is written in a bold, elegant Gothic Old English script font, matching the UnifrakturMaguntia style. The overall aesthetic is 'cold', premium, and atmospheric, with subtle icy glints and professional lighting. Landscape orientation, suitable for a Facebook banner.",
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const base64Data = part.inlineData.data;
      console.log("IMAGE_DATA_START");
      console.log(base64Data);
      console.log("IMAGE_DATA_END");
    }
  }
}

main();
