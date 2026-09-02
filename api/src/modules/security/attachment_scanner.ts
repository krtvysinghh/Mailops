/**
 * Feature 34: Attachment Virus & Danger Scanner
 * 
 * Magic Byte File Signature Inspector & Executable Gatekeeper:
 * - Binary header magic bytes inspection (MZ/PE, ELF, Mach-O, ZIP polyglots, PDF, Office OLE/VBA).
 * - Dangerous extension blocker with double-extension and Unicode RLO (Right-to-Left Override) detection.
 * - MIME-type spoofing detection (Declared MIME vs Binary Reality).
 * 
 * Zero new NPM dependencies. Pure TypeScript.
 */

export interface AttachmentScanResult {
  safe: boolean;
  filename: string;
  sizeBytes: number;
  declaredMime: string;
  detectedMime: string;
  riskLevel: 'clean' | 'suspicious' | 'dangerous';
  riskReasons: string[];
  quarantined: boolean;
}

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.scr', '.bat', '.cmd', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.msc', '.msi', '.msp', '.pif', '.hta', '.cpl',
  '.jar', '.dmg', '.pkg', '.iso', '.img', '.ps1', '.psm1', '.sh',
  '.apk', '.com', '.gadget', '.reg',
]);

const SUSPICIOUS_ARCHIVE_EXTS = new Set(['.zip', '.rar', '.7z', '.tar', '.gz']);

/**
 * Checks byte array against known file format magic signatures.
 */
export function identifyMagicBytes(bytes: Uint8Array): { mime: string; isExecutable: boolean; format: string } {
  if (bytes.length < 4) {
    return { mime: 'application/octet-stream', isExecutable: false, format: 'unknown' };
  }

  // 1. Windows PE / DOS Executable: 'MZ' (0x4D 0x5A)
  if (bytes[0] === 0x4D && bytes[1] === 0x5A) {
    return { mime: 'application/x-dosexec', isExecutable: true, format: 'Windows PE/DOS Executable' };
  }

  // 2. Linux / Unix ELF: 0x7F 'E' 'L' 'F' (0x7F 0x45 0x4C 0x46)
  if (bytes[0] === 0x7F && bytes[1] === 0x45 && bytes[2] === 0x4C && bytes[3] === 0x46) {
    return { mime: 'application/x-executable', isExecutable: true, format: 'Linux ELF Executable' };
  }

  // 3. Mach-O macOS Binaries (32-bit, 64-bit, reverse endian, and Universal FAT binary)
  if (
    (bytes[0] === 0xFE && bytes[1] === 0xED && bytes[2] === 0xFA && bytes[3] === 0xCE) ||
    (bytes[0] === 0xFE && bytes[1] === 0xED && bytes[2] === 0xFA && bytes[3] === 0xCF) ||
    (bytes[0] === 0xCE && bytes[1] === 0xFA && bytes[2] === 0xED && bytes[3] === 0xFE) ||
    (bytes[0] === 0xCF && bytes[1] === 0xFA && bytes[2] === 0xED && bytes[3] === 0xFE) ||
    (bytes[0] === 0xCA && bytes[1] === 0xFE && bytes[2] === 0xBA && bytes[3] === 0xBE) // Mach-O Fat Binary
  ) {
    return { mime: 'application/x-mach-binary', isExecutable: true, format: 'macOS Mach-O Binary' };
  }

  // 4. Shell script with shebang: '#!' (0x23 0x21)
  if (bytes[0] === 0x23 && bytes[1] === 0x21) {
    return { mime: 'text/x-shellscript', isExecutable: true, format: 'Shell Script with Shebang' };
  }

  // 5. ZIP Archive: 'PK\x03\x04' (0x50 0x4B 0x03 0x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)) {
    return { mime: 'application/zip', isExecutable: false, format: 'ZIP Archive' };
  }

  // 6. PDF Document: '%PDF' (0x25 0x50 0x44 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { mime: 'application/pdf', isExecutable: false, format: 'PDF Document' };
  }

  // 7. PNG Image: 0x89 'P' 'N' 'G'
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return { mime: 'image/png', isExecutable: false, format: 'PNG Image' };
  }

  // 8. JPEG Image: 0xFF 0xD8 0xFF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return { mime: 'image/jpeg', isExecutable: false, format: 'JPEG Image' };
  }

  // 9. GIF Image: 'GIF8' (0x47 0x49 0x46 0x38)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mime: 'image/gif', isExecutable: false, format: 'GIF Image' };
  }

  // 10. WebP Image: 'RIFF....WEBP'
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return { mime: 'image/webp', isExecutable: false, format: 'WebP Image' };
  }

  // 11. Microsoft Office OLE2 Compound Document: 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
  if (
    bytes.length >= 8 &&
    bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
    bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1
  ) {
    return { mime: 'application/x-ole-storage', isExecutable: false, format: 'Microsoft Office OLE Document' };
  }

  // Plain Text / UTF-8 Check
  let isAscii = true;
  const sampleLen = Math.min(bytes.length, 512);
  for (let i = 0; i < sampleLen; i++) {
    const b = bytes[i];
    if (b < 0x09 || (b > 0x0D && b < 0x20 && b !== 0x1B) || b === 0x00) {
      isAscii = false;
      break;
    }
  }

  if (isAscii) {
    return { mime: 'text/plain', isExecutable: false, format: 'Plain Text' };
  }

  return { mime: 'application/octet-stream', isExecutable: false, format: 'Generic Binary' };
}

/**
 * Scans inside a ZIP byte buffer for embedded filenames with dangerous extensions.
 */
export function scanZipArchiveEntries(bytes: Uint8Array): { dangerousFiles: string[]; hasMacros: boolean } {
  const dangerousFiles: string[] = [];
  let hasMacros = false;
  const decoder = new TextDecoder('utf-8');

  // Search for Local File Header 'PK\x03\x04' (0x50 0x4B 0x03 0x04)
  for (let i = 0; i < bytes.length - 30; i++) {
    if (bytes[i] === 0x50 && bytes[i + 1] === 0x4B && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
      const fileNameLen = bytes[i + 26] | (bytes[i + 27] << 8);
      const extraFieldLen = bytes[i + 28] | (bytes[i + 29] << 8);
      
      if (fileNameLen > 0 && i + 30 + fileNameLen <= bytes.length) {
        const nameBytes = bytes.slice(i + 30, i + 30 + fileNameLen);
        const fileName = decoder.decode(nameBytes);
        
        const lowerName = fileName.toLowerCase();
        for (const ext of DANGEROUS_EXTENSIONS) {
          if (lowerName.endsWith(ext)) {
            dangerousFiles.push(fileName);
            break;
          }
        }

        if (lowerName.includes('vbaproject.bin') || lowerName.includes('macro')) {
          hasMacros = true;
        }

        i += 30 + fileNameLen + extraFieldLen - 1;
      }
    }
  }

  return { dangerousFiles, hasMacros };
}

/**
 * Scans PDF content bytes for suspicious active code objects (/JavaScript, /Launch).
 */
export function scanPdfForExploits(bytes: Uint8Array): string[] {
  const text = new TextDecoder('latin1').decode(bytes.slice(0, Math.min(bytes.length, 100000)));
  const issues: string[] = [];

  if (/\/JavaScript|\/JS\b/i.test(text)) {
    issues.push('PDF contains embedded JavaScript (/JS /JavaScript)');
  }
  if (/\/Launch\b/i.test(text)) {
    issues.push('PDF contains external command execution action (/Launch)');
  }
  if (/\/EmbeddedFiles\b/i.test(text)) {
    issues.push('PDF contains embedded binary attachments (/EmbeddedFiles)');
  }

  return issues;
}

export function scanAttachment(
  fileOrBytes: string | Uint8Array,
  bytesOrFile?: Uint8Array | string,
  declaredMime = 'application/octet-stream'
): AttachmentScanResult {
  let filename: string;
  let contentBytes: Uint8Array;

  if (typeof fileOrBytes === 'string') {
    filename = fileOrBytes;
    contentBytes = (bytesOrFile as Uint8Array) || new Uint8Array(0);
  } else {
    contentBytes = fileOrBytes;
    filename = typeof bytesOrFile === 'string' ? bytesOrFile : 'attachment.dat';
  }

  const riskReasons: string[] = [];
  const sizeBytes = contentBytes.byteLength;

  // 1. Unicode Right-to-Left Override (RLO) check in filename
  if (filename.includes('\u202E')) {
    riskReasons.push('Filename contains Unicode Right-to-Left Override (RLO) disguise character (\\u202E)');
  }

  // 2. Extension check & Double Extension check
  const cleanFilename = filename.replace(/[\u200B-\u200D\uFEFF\u202E]/g, '').trim();
  const lowerName = cleanFilename.toLowerCase();
  
  // Find all dot extensions
  const parts = lowerName.split('.');
  const primaryExt = parts.length > 1 ? '.' + parts[parts.length - 1] : '';
  
  if (DANGEROUS_EXTENSIONS.has(primaryExt)) {
    riskReasons.push(`File has dangerous executable extension: ${primaryExt}`);
  }

  // Check double extension (e.g. document.pdf.exe or invoice.xlsx.vbs)
  if (parts.length > 2) {
    const secondToLast = '.' + parts[parts.length - 2];
    if (['.pdf', '.docx', '.xlsx', '.pptx', '.doc', '.xls', '.jpg', '.png', '.txt'].includes(secondToLast)) {
      if (DANGEROUS_EXTENSIONS.has(primaryExt) || SUSPICIOUS_ARCHIVE_EXTS.has(primaryExt)) {
        riskReasons.push(`Deceptive double extension detected: ${secondToLast}${primaryExt}`);
      }
    }
  }

  // 3. Binary Magic Byte Signature Analysis
  const magic = identifyMagicBytes(contentBytes);

  if (magic.isExecutable) {
    riskReasons.push(`Binary magic bytes indicate executable file format (${magic.format})`);
  }

  // 4. Mime Type vs Binary Header Mismatch
  if (declaredMime.startsWith('image/') && magic.isExecutable) {
    riskReasons.push(`Spoofing detected: declared as image (${declaredMime}) but contains executable binary!`);
  }
  if (declaredMime === 'application/pdf' && magic.format === 'Windows PE/DOS Executable') {
    riskReasons.push('Spoofing detected: declared as PDF document but contains Windows PE executable binary!');
  }

  // 5. ZIP Archive Deep Inspection
  if (magic.mime === 'application/zip') {
    const zipScan = scanZipArchiveEntries(contentBytes);
    if (zipScan.dangerousFiles.length > 0) {
      riskReasons.push(`ZIP archive contains dangerous executable files: ${zipScan.dangerousFiles.join(', ')}`);
    }
    if (zipScan.hasMacros) {
      riskReasons.push('Archive contains embedded VBA Macros / vbaProject.bin');
    }
  }

  // 6. PDF Exploit Inspection
  if (magic.mime === 'application/pdf') {
    const pdfIssues = scanPdfForExploits(contentBytes);
    riskReasons.push(...pdfIssues);
  }

  // Risk Level Determination
  let riskLevel: 'clean' | 'suspicious' | 'dangerous' = 'clean';
  if (
    magic.isExecutable ||
    DANGEROUS_EXTENSIONS.has(primaryExt) ||
    riskReasons.some(r => r.includes('Spoofing') || r.includes('executable files') || r.includes('RLO'))
  ) {
    riskLevel = 'dangerous';
  } else if (riskReasons.length > 0) {
    riskLevel = 'suspicious';
  }

  return {
    safe: riskLevel === 'clean',
    filename,
    sizeBytes,
    declaredMime,
    detectedMime: magic.mime,
    riskLevel,
    riskReasons,
    quarantined: riskLevel === 'dangerous',
  };
}
