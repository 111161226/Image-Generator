import { useEffect, useState } from "react";
import { supabase } from "./utils/supabase";
import { InferenceClient } from "@huggingface/inference";

const hf = new InferenceClient(import.meta.env.VITE_STABILITY_API_KEY);

function App() {
  const [imageList, setImageList] = useState<string[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const model = "stabilityai/stable-diffusion-xl-base-1.0";

  useEffect(() => {
    fetchImages();
  }, []);

  async function fetchImages() {
    const { data, error } = await supabase.storage
      .from("generate-image")
      .list();

    if (error) {
      console.error("Error fetching images: ", error);
      return;
    }

    if (data) {
      const imageUrls = await Promise.all(
        data.map(async (image) => {
          if (image.name === ".emptyFolderPlaceholder") {
            return "";
          }

          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("generate-image")
              .createSignedUrl(image.name, 60);

          if (signedUrlError) {
            console.error("Error creating signed URL: ", signedUrlError);
            return "";
          }

          return signedUrlData?.signedUrl ?? "";
        })
      );

      setImageList(imageUrls.filter((url) => url !== ""));
    }
  }

  const handleGenerateImage = async () => {
    setIsLoading(true);

    try {
      const blob: Blob = await hf.textToImage({
        model: model,
        inputs: prompt,
      }) as any;

      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error("生成に失敗しました:", error);
    } finally{
      setIsLoading(false);
    };
  };

  const handleSaveImage = async () => {
    if (!generatedImage) return;

    const fileName = `${prompt}_${Date.now()}.png`;
  
    // URLからBlobを再取得
    const response = await fetch(generatedImage);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from("generate-image")
      .upload(fileName, blob, {
        contentType: "image/png",
      });

    if (error) {
      console.error("Error uploading image: ", error);
    } else {
      console.log("Image uploaded successfully!");
      fetchImages();
    }
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white p-8">
        <h1 className="text-6xl text-fuchsia-500 text-center font-extrabold tracking-wide my-8 ">
          AI Image Generator
        </h1>
        <div className="flex justify-center mb-8">
          <div className="flex flex-col sm:flex-row gap-2 p-4 bg-gray-800 rounded-lg shadow-lg w-full max-w-xl">
            <input
              type="text"
              placeholder="Describe your imagination..."
              className="flex-grow p-3 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              onChange={(e) => setPrompt(e.target.value)}
              value={prompt}
            />
            <button
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={handleGenerateImage}
            >
              {isLoading ? (
              <div className="animate-spin h-5 w-5 border-4 border-white rounded-full border-t-transparent"></div>
              ) : (
                <>Generate</>
              )}
            </button>
          </div>
        </div>
        <div className="mb-12 transition-all duration-500 ease-in-out max-w-xl mx-auto">
          <div className="relative group aspect-square shadow-xl">
            {generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gray-700 rounded-lg flex items-center justify-center text-xl">
                Let's generate
              </div>
            )}
            {generatedImage && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={handleSaveImage}
                  className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm p-4 rounded-full shadow-md hover:bg-opacity-30 transition-all duration-300"
                >
                  ★
                </button>
              </div>
            )}
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-6 flex items-center max-w-xl mx-auto">
          Your Imagination Gallery
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-xl mx-auto">
          {imageList.map((img, index) => (
              <div
                key={index}
                className="relative group aspect-square overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                <img
                  src={img}
                  alt={`Gallery ${index}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
              </div>
            ))}
        </div>
      </div>
  );
}

export default App;
