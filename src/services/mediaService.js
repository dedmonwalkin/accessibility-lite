import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const exec = promisify(execFile);

export const mediaService = {
  async probe(filePath) {
    const { stdout } = await exec('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ]);

    const info = JSON.parse(stdout);
    const streams = info.streams || [];
    const hasVideo = streams.some((s) => s.codec_type === 'video');
    const hasAudio = streams.some((s) => s.codec_type === 'audio');
    const durationMs = Math.round((parseFloat(info.format?.duration) || 0) * 1000);

    return {
      duration_ms: durationMs,
      has_video: hasVideo,
      has_audio: hasAudio,
      format: info.format?.format_name || 'unknown',
      codec: streams[0]?.codec_name || 'unknown'
    };
  },

  async extractAudio(filePath, outputPath) {
    await exec('ffmpeg', [
      '-i', filePath,
      '-vn',
      '-acodec', 'pcm_s16le',
      '-ar', '16000',
      '-ac', '1',
      '-y',
      outputPath
    ]);
    return outputPath;
  },

  async chunkAudio(audioPath, chunkDurationMs = 5000) {
    const probe = await this.probe(audioPath);
    const totalMs = probe.duration_ms;
    if (totalMs <= 0) return [];

    const chunks = [];
    const dir = path.dirname(audioPath);
    const numChunks = Math.ceil(totalMs / chunkDurationMs);

    for (let i = 0; i < numChunks; i++) {
      const offsetMs = i * chunkDurationMs;
      const durationMs = Math.min(chunkDurationMs, totalMs - offsetMs);
      const chunkPath = path.join(dir, `chunk_${i}.wav`);

      await exec('ffmpeg', [
        '-i', audioPath,
        '-ss', String(offsetMs / 1000),
        '-t', String(durationMs / 1000),
        '-acodec', 'pcm_s16le',
        '-ar', '16000',
        '-ac', '1',
        '-y',
        chunkPath
      ]);

      chunks.push({
        path: chunkPath,
        offset_ms: offsetMs,
        duration_ms: durationMs,
        index: i
      });
    }

    return chunks;
  },

  async readAsBase64(filePath) {
    const buffer = await fs.promises.readFile(filePath);
    return buffer.toString('base64');
  }
};
