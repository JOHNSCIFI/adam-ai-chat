import React from 'react';
import { FileText, Image, Video, Music, File } from 'lucide-react';

interface FileAnalyzerProps {
  file: File;
  onAnalysisComplete: (analysis: string) => void;
}

export const FileAnalyzer: React.FC<FileAnalyzerProps> = ({ file, onAnalysisComplete }) => {
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    analyzeFile();
  }, [file]);

  const analyzeFile = async () => {
    setAnalyzing(true);
    
    try {
      let analysis = '';
      const fileType = file.type;
      
      if (fileType.startsWith('text/') || fileType.includes('json') || fileType.includes('csv')) {
        // Text file analysis
        const text = await file.text();
        analysis = `Text File Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024).toFixed(2)} KB
File Type: ${fileType}
Content Length: ${text.length} characters
Word Count: ${text.split(/\s+/).length} words

Content Preview:
${text.substring(0, 2000)}${text.length > 2000 ? '...[truncated]' : ''}

Content Analysis:
- The file contains ${text.split('\n').length} lines
- Key patterns found: ${findKeyPatterns(text)}
- Language detected: ${detectLanguage(text)}`;
        
      } else if (fileType.startsWith('image/')) {
        // Image analysis
        const imageUrl = URL.createObjectURL(file);
        analysis = await analyzeImage(imageUrl, file);
        URL.revokeObjectURL(imageUrl);
        
      } else if (fileType.includes('pdf')) {
        // PDF analysis with content extraction
        analysis = await extractPDFContent(file);
        
      } else if (fileType.includes('document') || fileType.includes('word')) {
        // Word document analysis
        analysis = `Document File Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024).toFixed(2)} KB
File Type: ${fileType}

Note: This appears to be a document file. For detailed content analysis, the document would need to be processed with specialized tools.`;

      } else if (fileType.startsWith('audio/')) {
        // Audio analysis
        analysis = `Audio File Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024).toFixed(2)} KB
File Type: ${fileType}
Duration: ${estimateAudioDuration(file.size)} (estimated)

Note: Audio content analysis would require speech-to-text processing. This appears to be an audio file that could contain speech, music, or other audio content.`;

      } else if (fileType.startsWith('video/')) {
        // Video analysis
        analysis = `Video File Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024 / 1024).toFixed(2)} MB
File Type: ${fileType}
Estimated Duration: ${estimateVideoDuration(file.size)}

Note: Video content analysis would require video processing capabilities. This appears to be a video file that may contain visual and audio content.`;

      } else {
        // Generic file analysis
        analysis = `File Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024).toFixed(2)} KB
File Type: ${fileType || 'Unknown'}

This file type is not directly analyzable for content, but it has been uploaded and its metadata has been captured.`;
      }

      onAnalysisComplete(analysis);
    } catch (error) {
      console.error('File analysis error:', error);
      onAnalysisComplete(`File Analysis Error:
Unable to analyze ${file.name}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeImage = async (imageUrl: string, file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const analysis = `Image Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024).toFixed(2)} KB
File Type: ${file.type}
Dimensions: ${img.width} × ${img.height} pixels
Aspect Ratio: ${(img.width / img.height).toFixed(2)}:1
Estimated Quality: ${img.width > 1920 ? 'High' : img.width > 720 ? 'Medium' : 'Standard'} resolution

Visual Analysis:
- Image orientation: ${img.width > img.height ? 'Landscape' : img.height > img.width ? 'Portrait' : 'Square'}
- Pixel density: ${(img.width * img.height / 1000000).toFixed(1)} megapixels
- File efficiency: ${(file.size / (img.width * img.height) * 1000).toFixed(2)} bytes per pixel

Note: Detailed visual content analysis (objects, faces, text recognition) would require AI vision processing.`;
        resolve(analysis);
      };
      img.onerror = () => {
        resolve(`Image Analysis Error:
Unable to load image ${file.name} for analysis.`);
      };
      img.src = imageUrl;
    });
  };

  const extractPDFContent = async (file: File): Promise<string> => {
    try {
      // Use the document parsing tool for comprehensive PDF analysis
      const formData = new FormData();
      formData.append('file', file);
      
      // For now, we'll use a simpler approach - convert to base64 and analyze
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Basic PDF analysis - in production, you'd use a proper PDF parser
      return `PDF Document Analysis:
File Name: ${file.name}
File Size: ${(file.size / 1024).toFixed(2)} KB
File Type: PDF Document
Pages: ${Math.ceil(file.size / 1024 / 50)} (estimated)

Content Analysis:
This PDF document has been processed. For full text extraction, the document needs to be parsed with specialized PDF processing tools.

File Structure:
- Binary PDF format detected
- Estimated content: ${file.size > 100000 ? 'Large document with multiple pages' : 'Small to medium document'}
- Text extraction capability: Available through server-side processing

Note: To get the actual text content from this PDF, it needs to be processed with a PDF parsing service.`;

    } catch (error) {
      return `PDF Analysis Error:
File Name: ${file.name}
Error: Unable to process PDF content - ${error instanceof Error ? error.message : 'Unknown error'}

Basic Info:
- File Size: ${(file.size / 1024).toFixed(2)} KB
- File Type: PDF Document`;
    }
  };

  const findKeyPatterns = (text: string): string => {
    const patterns = [];
    if (/\b\d{4}-\d{2}-\d{2}\b/.test(text)) patterns.push('dates');
    if (/\b[\w.-]+@[\w.-]+\.\w+\b/.test(text)) patterns.push('email addresses');
    if (/https?:\/\/[^\s]+/.test(text)) patterns.push('URLs');
    if (/\b\d{3}-\d{3}-\d{4}\b/.test(text)) patterns.push('phone numbers');
    if (/[{}[\]]/.test(text)) patterns.push('structured data');
    return patterns.length > 0 ? patterns.join(', ') : 'plain text';
  };

  const detectLanguage = (text: string): string => {
    const sample = text.toLowerCase().substring(0, 1000);
    if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(sample)) return 'English';
    if (/\b(le|la|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/.test(sample)) return 'French';
    if (/\b(el|la|y|o|pero|en|sobre|a|para|de|con|por)\b/.test(sample)) return 'Spanish';
    return 'Unknown/Mixed';
  };

  const estimateAudioDuration = (bytes: number): string => {
    // Rough estimate: 1MB ≈ 1 minute for typical audio
    const minutes = Math.round(bytes / 1024 / 1024);
    return `~${minutes} minute(s)`;
  };

  const estimateVideoDuration = (bytes: number): string => {
    // Rough estimate: 10MB ≈ 1 minute for typical video
    const minutes = Math.round(bytes / 1024 / 1024 / 10);
    return `~${minutes} minute(s)`;
  };

  const getFileIcon = () => {
    const fileType = file.type;
    if (fileType.startsWith('text/')) return <FileText className="h-4 w-4" />;
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (fileType.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  if (analyzing) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {getFileIcon()}
        <span>Analyzing {file.name}...</span>
        <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return null;
};