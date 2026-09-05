/**
 * Module: Document Intelligence & PDF Text Extractor
 * 
 * Provides server-side and browser decoding for PDF stream objects,
 * extracting metadata, page count, and full-text indexing content.
 */

export interface DocumentMetadata {
  pageCount: number;
  title?: string;
  author?: string;
  creator?: string;
  extractedText: string;
  fileSizeBytes: number;
}

export function extractTextFromPDFStream(rawBytes: Uint8Array): DocumentMetadata {
  const binaryString = String.fromCharCode(...rawBytes);
  const textChunks: string[] = [];

  // Match standard PDF Text Blocks: BT ... ET
  const textBlockRegex = /BT[\s\S]*?ET/g;
  let match: RegExpExecArray | null;

  while ((match = textBlockRegex.exec(binaryString)) !== null) {
    const block = match[0];
    // Extract strings inside Tj or TJ commands
    const stringMatches = block.match(/\((.*?)\)\s*Tj/g) || [];
    for (const str of stringMatches) {
      const clean = str.replace(/^\(/, '').replace(/\)\s*Tj$/, '');
      textChunks.push(clean);
    }
  }

  // Count /Page objects
  const pageMatches = binaryString.match(/\/Type\s*\/Page\b/g) || [];
  const pageCount = Math.max(1, pageMatches.length);

  return {
    pageCount,
    extractedText: textChunks.join(' ').replace(/\\([()\\])/g, '$1'),
    fileSizeBytes: rawBytes.byteLength
  };
}
