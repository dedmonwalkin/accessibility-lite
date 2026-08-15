import test from 'node:test';
import assert from 'node:assert/strict';
import { audioOutputPath } from '../src/services/mediaService.js';

test('audioOutputPath never returns the input path for .wav uploads', () => {
  const input = '/app/uploads/job_abc/sample.wav';
  const output = audioOutputPath(input);
  assert.notEqual(output, input, 'output must differ from input — ffmpeg refuses in-place edits');
  assert.equal(output, '/app/uploads/job_abc/sample.audio.wav');
});

test('audioOutputPath produces .audio.wav for non-wav uploads', () => {
  assert.equal(audioOutputPath('/u/file.mp3'), '/u/file.audio.wav');
  assert.equal(audioOutputPath('/u/file.mp4'), '/u/file.audio.wav');
  assert.equal(audioOutputPath('/u/file.mov'), '/u/file.audio.wav');
});

test('audioOutputPath handles files without an extension', () => {
  const input = '/app/uploads/job_xyz/sample';
  assert.equal(audioOutputPath(input), '/app/uploads/job_xyz/sample.audio.wav');
});
