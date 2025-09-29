import { Canvas as FabricCanvas, Circle, Rect, Path, PencilBrush } from 'fabric';

export interface ImageEditingOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  blur?: number;
  removeBackground?: boolean;
  addText?: {
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
  };
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  rotate?: number;
  flip?: 'horizontal' | 'vertical';
}

export class ImageEditor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private fabricCanvas: FabricCanvas | null = null;
  private originalImageData: ImageData | null = null;

  constructor(imageElement: HTMLImageElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = imageElement.naturalWidth;
    this.canvas.height = imageElement.naturalHeight;
    
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    this.ctx = ctx;
    this.ctx.drawImage(imageElement, 0, 0);
    this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }

  // Initialize Fabric.js canvas for advanced editing
  initFabricCanvas(containerElement: HTMLElement): FabricCanvas {
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
    }

    this.fabricCanvas = new FabricCanvas(containerElement.querySelector('canvas') || this.canvas, {
      width: this.canvas.width,
      height: this.canvas.height,
      backgroundColor: 'transparent',
    });

    // Set background image (Fabric.js v6 API)
    const img = new Image();
    img.onload = () => {
      this.fabricCanvas?.set('backgroundImage', img);
      this.fabricCanvas?.renderAll();
    };
    img.src = this.canvas.toDataURL('image/png');

    return this.fabricCanvas;
  }

  // Apply basic filters
  applyFilters(options: ImageEditingOptions): void {
    if (!this.originalImageData) return;

    // Reset to original
    this.ctx.putImageData(this.originalImageData, 0, 0);
    let imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imageData.data;

    // Apply brightness
    if (options.brightness !== undefined) {
      const brightness = options.brightness - 50; // -50 to +50 range
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, data[i] + brightness));     // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness)); // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness)); // B
      }
    }

    // Apply contrast
    if (options.contrast !== undefined) {
      const contrast = (options.contrast / 50) * 2; // 0 to 4 range
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
      }
    }

    // Apply saturation
    if (options.saturation !== undefined) {
      const saturation = options.saturation / 50; // 0 to 2 range
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        
        data[i] = Math.max(0, Math.min(255, gray + saturation * (r - gray)));
        data[i + 1] = Math.max(0, Math.min(255, gray + saturation * (g - gray)));
        data[i + 2] = Math.max(0, Math.min(255, gray + saturation * (b - gray)));
      }
    }

    this.ctx.putImageData(imageData, 0, 0);

    // Apply rotation
    if (options.rotate) {
      this.rotate(options.rotate);
    }

    // Apply flip
    if (options.flip) {
      this.flip(options.flip);
    }
  }

  // Rotate image
  private rotate(degrees: number): void {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const newWidth = Math.abs(this.canvas.width * cos) + Math.abs(this.canvas.height * sin);
    const newHeight = Math.abs(this.canvas.width * sin) + Math.abs(this.canvas.height * cos);
    
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCtx.translate(newWidth / 2, newHeight / 2);
    tempCtx.rotate(radians);
    tempCtx.drawImage(this.canvas, -this.canvas.width / 2, -this.canvas.height / 2);
    
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.ctx.clearRect(0, 0, newWidth, newHeight);
    this.ctx.drawImage(tempCanvas, 0, 0);
  }

  // Flip image
  private flip(direction: 'horizontal' | 'vertical'): void {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(this.canvas, 0, 0);
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    if (direction === 'horizontal') {
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(tempCanvas, -this.canvas.width, 0);
    } else {
      this.ctx.scale(1, -1);
      this.ctx.drawImage(tempCanvas, 0, -this.canvas.height);
    }
    
    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  }

  // Crop image
  crop(x: number, y: number, width: number, height: number): void {
    const imageData = this.ctx.getImageData(x, y, width, height);
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.putImageData(imageData, 0, 0);
  }

  // Add text
  addText(text: string, x: number, y: number, fontSize: number = 24, color: string = '#000000'): void {
    this.ctx.font = `${fontSize}px Arial`;
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  // Get edited image as blob
  getBlob(quality: number = 0.9): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        'image/png',
        quality
      );
    });
  }

  // Get edited image as data URL
  getDataURL(quality: number = 0.9): string {
    return this.canvas.toDataURL('image/png', quality);
  }

  // Dispose resources
  dispose(): void {
    if (this.fabricCanvas) {
      this.fabricCanvas.dispose();
      this.fabricCanvas = null;
    }
  }
}

// Helper function to create image editor from file
export const createImageEditor = (file: File): Promise<ImageEditor> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const editor = new ImageEditor(img);
        resolve(editor);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};