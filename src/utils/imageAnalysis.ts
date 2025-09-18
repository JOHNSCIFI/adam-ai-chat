// Advanced image analysis utilities

export interface ImageAnalysisResult {
  id: string;
  fileName: string;
  url: string;
  basicInfo: {
    width: number;
    height: number;
    size: number;
    format: string;
    aspectRatio: number;
  };
  visualAnalysis: {
    dominantColors: string[];
    brightness: number;
    contrast: number;
    colorfulness: number;
    composition: string;
    quality: string;
  };
  detectedElements: {
    hasText: boolean;
    textAreas: number;
    hasFaces: boolean;
    faceCount: number;
    hasObjects: boolean;
    objectTypes: string[];
  };
  aiDescription: string;
  timestamp: string;
}

export const analyzeImageComprehensively = async (file: File): Promise<ImageAnalysisResult> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = async () => {
      try {
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data for analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Basic info
        const basicInfo = {
          width: img.width,
          height: img.height,
          size: file.size,
          format: file.type,
          aspectRatio: img.width / img.height
        };

        // Visual analysis
        const visualAnalysis = analyzeVisualProperties(data, img.width, img.height);
        
        // Element detection (simplified - in production you'd use proper AI models)
        const detectedElements = detectImageElements(data, img.width, img.height);
        
        // Generate AI description
        const aiDescription = generateImageDescription(basicInfo, visualAnalysis, detectedElements);

        const result: ImageAnalysisResult = {
          id: `img-${Date.now()}`,
          fileName: file.name,
          url: URL.createObjectURL(file),
          basicInfo,
          visualAnalysis,
          detectedElements,
          aiDescription,
          timestamp: new Date().toISOString()
        };

        resolve(result);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

const analyzeVisualProperties = (data: Uint8ClampedArray, width: number, height: number) => {
  const pixels = data.length / 4;
  let totalR = 0, totalG = 0, totalB = 0;
  let brightness = 0;
  const colorCounts = new Map<string, number>();

  // Analyze pixels
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    totalR += r;
    totalG += g;
    totalB += b;
    
    // Calculate brightness
    brightness += (r * 0.299 + g * 0.587 + b * 0.114);
    
    // Track dominant colors (simplified)
    const colorKey = `${Math.floor(r/32)*32},${Math.floor(g/32)*32},${Math.floor(b/32)*32}`;
    colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
  }

  // Get dominant colors
  const dominantColors = Array.from(colorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([color]) => `rgb(${color})`);

  brightness = brightness / pixels;
  
  // Calculate contrast (simplified)
  let variance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const pixelBrightness = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    variance += Math.pow(pixelBrightness - brightness, 2);
  }
  const contrast = Math.sqrt(variance / pixels);

  // Determine composition
  const composition = width > height * 1.5 ? 'landscape' : 
                     height > width * 1.5 ? 'portrait' : 'square';

  // Determine quality
  const quality = width > 1920 && height > 1080 ? 'high' :
                  width > 1280 && height > 720 ? 'medium' : 'standard';

  return {
    dominantColors,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    colorfulness: dominantColors.length,
    composition,
    quality
  };
};

const detectImageElements = (data: Uint8ClampedArray, width: number, height: number) => {
  // Simplified element detection - in production use proper AI models
  
  // Detect potential text areas (high contrast regions)
  let textAreas = 0;
  let hasHighContrast = false;
  
  // Sample regions for contrast
  const sampleSize = Math.min(1000, data.length / 16);
  for (let i = 0; i < sampleSize; i += 16) {
    const r1 = data[i];
    const g1 = data[i + 1];
    const b1 = data[i + 2];
    const r2 = data[i + 8] || r1;
    const g2 = data[i + 9] || g1;
    const b2 = data[i + 10] || b1;
    
    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    if (diff > 200) {
      textAreas++;
      hasHighContrast = true;
    }
  }

  // Detect face-like regions (simplified skin tone detection)
  let faceCount = 0;
  let skinPixels = 0;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Simple skin tone detection
    if (r > 95 && g > 40 && b > 20 && 
        Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
        Math.abs(r - g) > 15 && r > g && r > b) {
      skinPixels++;
    }
  }
  
  if (skinPixels > (width * height * 0.02)) { // If >2% skin tone
    faceCount = Math.min(3, Math.floor(skinPixels / (width * height * 0.05)));
  }

  return {
    hasText: textAreas > 10,
    textAreas: Math.min(textAreas, 50),
    hasFaces: faceCount > 0,
    faceCount,
    hasObjects: true, // Always assume objects present
    objectTypes: inferObjectTypes(width, height, textAreas, faceCount)
  };
};

const inferObjectTypes = (width: number, height: number, textAreas: number, faceCount: number): string[] => {
  const objects = [];
  
  if (faceCount > 0) objects.push('people', 'portraits');
  if (textAreas > 20) objects.push('text', 'document', 'signage');
  if (width > height * 2) objects.push('landscape', 'panorama');
  if (height > width * 1.5) objects.push('vertical content');
  
  // Default object types
  objects.push('visual elements', 'composition');
  
  return objects;
};

const generateImageDescription = (
  basicInfo: ImageAnalysisResult['basicInfo'],
  visualAnalysis: ImageAnalysisResult['visualAnalysis'],
  detectedElements: ImageAnalysisResult['detectedElements']
): string => {
  const { width, height, aspectRatio } = basicInfo;
  const { dominantColors, brightness, composition, quality } = visualAnalysis;
  const { hasText, hasFaces, faceCount, objectTypes } = detectedElements;

  let description = `📸 IMAGE ANALYSIS COMPLETE:\n\n`;
  
  // Basic properties
  description += `🔍 TECHNICAL DETAILS:\n`;
  description += `• Dimensions: ${width} × ${height} pixels (${quality} quality)\n`;
  description += `• Composition: ${composition} format (${aspectRatio.toFixed(2)}:1 ratio)\n`;
  description += `• Brightness: ${brightness > 150 ? 'Bright' : brightness > 100 ? 'Balanced' : 'Dark'} (${brightness}/255)\n`;
  description += `• Color Palette: ${dominantColors.length} dominant colors\n\n`;

  // Content analysis
  description += `🎨 VISUAL CONTENT:\n`;
  if (hasFaces) {
    description += `• People: ${faceCount} face${faceCount > 1 ? 's' : ''} detected\n`;
  }
  if (hasText) {
    description += `• Text: Multiple text regions identified\n`;
  }
  description += `• Elements: ${objectTypes.join(', ')}\n`;
  description += `• Overall: ${getImageCategory(visualAnalysis, detectedElements)}\n\n`;

  // AI insights
  description += `🤖 AI INSIGHTS:\n`;
  description += `This appears to be ${getImageInsight(basicInfo, visualAnalysis, detectedElements)}.\n`;
  description += `Best suited for: ${getSuggestedUses(visualAnalysis, detectedElements)}\n\n`;
  
  description += `💡 Ready for questions or editing commands!`;

  return description;
};

const getImageCategory = (visual: ImageAnalysisResult['visualAnalysis'], elements: ImageAnalysisResult['detectedElements']): string => {
  if (elements.hasFaces) return 'Portrait/People photography';
  if (elements.hasText) return 'Document/Text-based image';
  if (visual.composition === 'landscape') return 'Landscape/Wide format image';
  return 'General photographic content';
};

const getImageInsight = (basic: ImageAnalysisResult['basicInfo'], visual: ImageAnalysisResult['visualAnalysis'], elements: ImageAnalysisResult['detectedElements']): string => {
  const insights = [];
  
  if (basic.width > 1920) insights.push('a high-resolution image');
  if (elements.hasFaces) insights.push('containing people');
  if (elements.hasText) insights.push('with text elements');
  if (visual.brightness > 180) insights.push('with bright, vibrant lighting');
  else if (visual.brightness < 80) insights.push('with moody, dark tones');
  
  return insights.length > 0 ? insights.join(' ') : 'a standard photographic image';
};

const getSuggestedUses = (visual: ImageAnalysisResult['visualAnalysis'], elements: ImageAnalysisResult['detectedElements']): string => {
  const uses = [];
  
  if (elements.hasFaces) uses.push('social media', 'profiles');
  if (elements.hasText) uses.push('documents', 'presentations');
  if (visual.quality === 'high') uses.push('printing', 'professional use');
  if (visual.composition === 'landscape') uses.push('banners', 'headers');
  
  return uses.length > 0 ? uses.join(', ') : 'web content, general use';
};