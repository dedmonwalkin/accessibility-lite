import Busboy from 'busboy';
import fs from 'node:fs';
import path from 'node:path';
import { runtimeConfig } from '../config/runtime.js';

const ALLOWED_MIME_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-wav'
]);

const EXT_MAP = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/ogg': '.ogg',
  'audio/mp4': '.m4a',
  'audio/x-wav': '.wav'
};

export function parseUpload(req, jobDir) {
  return new Promise((resolve, reject) => {
    const config = runtimeConfig();
    const maxBytes = config.maxUploadMb * 1024 * 1024;

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: maxBytes, files: 1 }
    });

    let fileInfo = null;
    const fields = {};

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, stream, info) => {
      const { filename, mimeType } = info;
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        stream.resume();
        reject(new Error(`Unsupported file type: ${mimeType}. Accepted: ${[...ALLOWED_MIME_TYPES].join(', ')}`));
        return;
      }

      const ext = EXT_MAP[mimeType] || '.bin';
      const destPath = path.join(jobDir, `original${ext}`);
      const writeStream = fs.createWriteStream(destPath);
      let bytes = 0;

      stream.on('data', (chunk) => {
        bytes += chunk.length;
      });

      stream.pipe(writeStream);

      stream.on('limit', () => {
        writeStream.destroy();
        reject(new Error(`File exceeds maximum size of ${config.maxUploadMb}MB`));
      });

      writeStream.on('finish', () => {
        fileInfo = {
          original_filename: filename,
          mime_type: mimeType,
          file_path: destPath,
          file_size_bytes: bytes,
          ext
        };
      });

      writeStream.on('error', (err) => reject(err));
    });

    busboy.on('finish', () => {
      if (!fileInfo) {
        reject(new Error('No file uploaded'));
        return;
      }
      resolve({ fileInfo, fields });
    });

    busboy.on('error', (err) => reject(err));
    req.pipe(busboy);
  });
}
