
import { generateImage } from "../src/lib/generators";

async function main() {
  try {
    console.log("Generating Favicon...");
    const faviconResult = await generateImage(
      "A minimalist, premium, polished 3D glassmorphism logo for a sustainability brand called Vuneli. Emerald green leaf motif, high-end tech aesthetic, white background, centered, high resolution.",
      "1:1"
    );
    console.log("Favicon URL:", faviconResult.url);

    console.log("Generating Social Banner...");
    const bannerResult = await generateImage(
      "A cinematic, wide-angle 16:9 social preview banner for Vuneli. A futuristic sustainability dashboard overlaying a lush, green, photorealistic forest environment. High-end UI elements, glowing green accents, premium 4K aesthetic.",
      "16:9"
    );
    console.log("Banner URL:", bannerResult.url);

    // Output for the agent to parse
    console.log("FAVICON_URL=" + faviconResult.url);
    console.log("BANNER_URL=" + bannerResult.url);
  } catch (error) {
    console.error("Error generating images:", error);
    process.exit(1);
  }
}

main();
