import sharp from "sharp";
import { storagePut } from "./storage";

/**
 * Screenshot processor to extract and highlight pricing information
 * from hotel booking site screenshots
 */

interface ExtractedPriceInfo {
  hotelName?: string;
  pricePerNight?: number;
  totalPrice?: number;
  rating?: number;
  currency?: string;
  highlights: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
}

/**
 * Process screenshot to highlight pricing information
 * Adds colored boxes around key pricing elements
 */
export async function processScreenshot(
  screenshotBuffer: Buffer,
  extractedData: ExtractedPriceInfo
): Promise<{ processedUrl: string; extractedData: ExtractedPriceInfo }> {
  try {
    // Load the screenshot
    let image = sharp(screenshotBuffer);

    // Get image metadata to determine dimensions
    const metadata = await image.metadata();
    const width = metadata.width || 1920;
    const height = metadata.height || 1080;

    // Create SVG overlays for highlighting price elements
    const svgOverlays = createPriceHighlights(
      extractedData,
      width,
      height
    );

    // Composite the SVG overlay onto the screenshot
    for (const overlay of svgOverlays) {
      image = image.composite([
        {
          input: Buffer.from(overlay),
          blend: "overlay",
        },
      ]);
    }

    // Convert to PNG
    const processedBuffer = await image.png().toBuffer();

    // Upload processed screenshot to storage
    const processedKey = `comparisons/processed-${Date.now()}.png`;
    const { url: processedUrl } = await storagePut(
      processedKey,
      processedBuffer,
      "image/png"
    );

    return {
      processedUrl,
      extractedData,
    };
  } catch (error) {
    console.error("Error processing screenshot:", error);
    throw error;
  }
}

/**
 * Create SVG overlays to highlight pricing elements
 */
function createPriceHighlights(
  data: ExtractedPriceInfo,
  imageWidth: number,
  imageHeight: number
): string[] {
  const overlays: string[] = [];

  // Define colors for different highlight types
  const colors = {
    price: "#10b981", // Green
    total: "#3b82f6", // Blue
    rating: "#f59e0b", // Amber
  };

  // Create SVG for each highlight
  data.highlights.forEach((highlight, index) => {
    const color = Object.values(colors)[index % Object.values(colors).length];

    const svg = `
      <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
        <rect
          x="${highlight.x}"
          y="${highlight.y}"
          width="${highlight.width}"
          height="${highlight.height}"
          fill="none"
          stroke="${color}"
          stroke-width="3"
          rx="4"
        />
        <circle
          cx="${highlight.x + highlight.width + 15}"
          cy="${highlight.y + 15}"
          r="12"
          fill="${color}"
        />
        <text
          x="${highlight.x + highlight.width + 15}"
          y="${highlight.y + 20}"
          text-anchor="middle"
          fill="white"
          font-size="10"
          font-weight="bold"
        >${index + 1}</text>
      </svg>
    `;

    overlays.push(svg);
  });

  return overlays;
}

/**
 * Extract pricing information from page using OCR-like detection
 * In production, this would use a real OCR service or AI vision API
 */
export async function extractPricingFromScreenshot(
  screenshotBuffer: Buffer,
  platform: string
): Promise<ExtractedPriceInfo> {
  // This is a placeholder for actual OCR/vision processing
  // In production, you would use:
  // - Google Cloud Vision API
  // - AWS Textract
  // - Azure Computer Vision
  // - Or a specialized hotel price extraction service

  const extractedData: ExtractedPriceInfo = {
    currency: "USD",
    highlights: [],
  };

  // For now, return placeholder data
  // The actual extraction would happen via API call to vision service
  return extractedData;
}

/**
 * Compare two screenshots side-by-side and create a comparison view
 */
export async function createComparisonView(
  screenshot1Buffer: Buffer,
  screenshot2Buffer: Buffer,
  label1: string,
  label2: string
): Promise<Buffer> {
  try {
    // Resize both images to same height for comparison
    const image1 = sharp(screenshot1Buffer).resize(400, 600, {
      fit: "cover",
    });
    const image2 = sharp(screenshot2Buffer).resize(400, 600, {
      fit: "cover",
    });

    // Get buffers
    const img1Buffer = await image1.toBuffer();
    const img2Buffer = await image2.toBuffer();

    // Create composite image with labels
    const comparisonImage = sharp({
      create: {
        width: 850,
        height: 700,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite([
        {
          input: img1Buffer,
          left: 25,
          top: 50,
        },
        {
          input: img2Buffer,
          left: 425,
          top: 50,
        },
      ])
      .png();

    return await comparisonImage.toBuffer();
  } catch (error) {
    console.error("Error creating comparison view:", error);
    throw error;
  }
}
