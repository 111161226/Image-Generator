import { useState } from "react";
import { supabase } from "./utils/supabase";

interface GenerationResponse {
  artifacts: Array<{
    base64: string;
    seed: number;
    finishReason: string;
  }>;
}

function App() {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const engineId = "stable-diffusion-v1-6";
  const apiKey = import.meta.env.VITE_STABILITY_API_KEY;
  const apiHost = "https://api.stability.ai";

  const handleGenerateImage = async () => {
    const response = await fetch(
      `${apiHost}/v1/generation/${engineId}/text-to-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt,
            },
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          steps: 30,
          samples: 1,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Non-200 response: ${await response.text()}`);
    }

    const responseJSON = (await response.json()) as GenerationResponse;
    const base64Image = responseJSON.artifacts[0].base64;
    setGeneratedImage(`data:image/png;base64,${base64Image}`);
  };

  const handleSaveImage = async () => {
    if (!generatedImage) {
      return;
    }

    const fileName = `${prompt}.png`;

    // Base64文字列からプレフィックスを削除
    const base64Data = generatedImage.replace(/^data:image\/png;base64,/, "");

    // Base64をバイナリデータに変換
    const binaryData = Uint8Array.from(atob(base64Data), (char) =>
      char.charCodeAt(0)
    );

    // 画像をストレージにアップロード
    const { error } = await supabase.storage
      .from("generate-image")
      .upload(fileName, binaryData.buffer, {
        contentType: "image/png",
      });

    if (error) {
      console.error("Error uploading image: ", error);
    } else {
      console.log("Image uploaded successfully!");
    }
  };

  return (
    <>
      <div>
        <input
          type="text"
          className="border"
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleGenerateImage}
        >
          生成
        </button>
      </div>
      {generatedImage && (
        <div>
          <h2>Generated Image:</h2>
          <img src={generatedImage} alt="Generated" />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={handleSaveImage}
          >
            保存
          </button>
        </div>
      )}
    </>
  );
}

export default App;
