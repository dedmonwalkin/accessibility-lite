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

// Magic-byte prefixes. The client-declared Content-Type is attacker-controlled;
// we refuse the upload if the first bytes don't match a known media container.
// This is defense-in-depth ahead of ffprobe (which has had exploitable CVEs).
function magicBytesMatch(head, mimeType) {
  if (head.length < 12) return false;
  const isMp4Family = head.slice(4, 8).toString('ascii') === 'ftyp';
  switch (mimeType) {
    case 'video/mp4':
    case 'audio/mp4':
      return isMp4Family;
    case 'video/quicktime':
      return isMp4Family; // .mov uses ftyp qt  /moov atoms
    case 'video/webm':
      // Matroska/WebM: EBML header 1A 45 DF A3
      return head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3;
    case 'audio/wav':
    case 'audio/x-wav':
      return head.slice(0, 4).toString('ascii') === 'RIFF' && head.slice(8, 12).toString('ascii') === 'WAVE';
    case 'audio/ogg':
      return head.slice(0, 4).toString('ascii') === 'OggS';
    case 'audio/mpeg': {
      // ID3v2 tag
      if (head.slice(0, 3).toString('ascii') === 'ID3') return true;
      // MPEG frame sync 0xFFEx
      return head[0] === 0xff && (head[1] & 0xe0) === 0xe0;
    }
    default:
      return false;
  }
}

export function parseUpload(req, jobDir) {
  return new Promise((resolve, reject) => {
    const config = runtimeConfig();
    const maxBytes = config.maxUploadMb * 1024 * 1024;

    const busboy = Busboy({
      headers: req.headers,
      limits: { fileSize: maxBytes, files: 1 }
    });

    let fileInfo = null;
    let fileError = null;
    let finished = false;
    let pendingDrain = null; // resolves when the writeStream finishes
    const fields = {};

    function fail(err) {
      if (fileError) return;
      fileError = err;
      reject(err);
    }

    busboy.on('field', (name, value) => { fields[name] = value; });

    busboy.on('file', (fieldname, stream, info) => {
      const { filename, mimeType } = info;
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        stream.resume();
        fail(new Error(`Unsupported file type: ${mimeType}. Accepted: ${[...ALLOWED_MIME_TYPES].join(', ')}`));
        return;
      }

      const ext = EXT_MAP[mimeType] || '.bin';
      const destPath = path.join(jobDir, `original${ext}`);
      const writeStream = fs.createWriteStream(destPath);
      let bytes = 0;
      let headBuf = Buffer.alloc(0);
      let sniffed = false;

      stream.on('data', (chunk) => {
        bytes += chunk.length;
        if (!sniffed) {
          headBuf = Buffer.concat([headBuf, chunk], Math.min(headBuf.length + chunk.length, 64));
          if (headBuf.length >= 12) {
            sniffed = true;
            if (!magicBytesMatch(headBuf, mimeType)) {
              stream.unpipe(writeStream);
              writeStream.destroy();
              stream.resume();
              fail(new Error(`File contents do not match declared type ${mimeType}`));
              return;
            }
          }
        }
      });

      stream.pipe(writeStream);

      stream.on('limit', () => {
        writeStream.destroy();
        fail(new Error(`File exceeds maximum size of ${config.maxUploadMb}MB`));
      });

      pendingDrain = new Promise((res) => {
        writeStream.on('finish', () => {
          if (!sniffed) {
            fail(new Error('File too short to validate'));
          } else if (!fileError) {
            fileInfo = {
              original_filename: filename,
              mime_type: mimeType,
              file_path: destPath,
              file_size_bytes: bytes,
              ext
            };
          }
          res();
        });
        writeStream.on('error', (err) => { fail(err); res(); });
      });
    });

    busboy.on('finish', async () => {
      finished = true;
      if (pendingDrain) await pendingDrain;
      if (fileError) return;
      if (!fileInfo) {
        fail(new Error('No file uploaded'));
        return;
      }
      resolve({ fileInfo, fields });
    });

    busboy.on('error', (err) => fail(err));
    req.on('aborted', () => fail(new Error('Upload aborted by client')));
    req.pipe(busboy);
  });
}
