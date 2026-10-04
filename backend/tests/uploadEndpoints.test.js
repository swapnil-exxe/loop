const { test, describe } = require('node:test');
const assert = require('node:assert');
const R2StorageService = require('../services/r2StorageService');

describe('Upload Endpoints & Permission Rules', () => {
  describe('Input & Boundary Validation', () => {
    test('enforces 200 MB maximum limit (209,715,200 bytes)', () => {
      assert.doesNotThrow(() => {
        R2StorageService.validateFileSize(200 * 1024 * 1024);
      });

      assert.throws(() => {
        R2StorageService.validateFileSize((200 * 1024 * 1024) + 1);
      }, /File exceeds the maximum allowed size of 200 MB/);
    });

    test('validates format against educational whitelist', () => {
      // Valid educational formats
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'Lecture1.pdf', mimeType: 'application/pdf' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'Code.py', mimeType: 'text/x-python' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'Dataset.zip', mimeType: 'application/zip' }), true);

      // Disallowed format
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'virus.exe', mimeType: 'application/octet-stream' }), false);
    });
  });

  describe('Part URL & Slicing Specifications', () => {
    test('requires uploadId, objectKey, and partNumber for presigned part generation', async () => {
      await assert.rejects(
        () => R2StorageService.getPresignedPartUrl({ objectKey: '', uploadId: 'up-1', partNumber: 1 }),
        /objectKey, uploadId, and partNumber are required/
      );
      await assert.rejects(
        () => R2StorageService.getPresignedPartUrl({ objectKey: 'key', uploadId: '', partNumber: 1 }),
        /objectKey, uploadId, and partNumber are required/
      );
    });

    test('requires valid parts array for completion', async () => {
      await assert.rejects(
        () => R2StorageService.completeMultipartUpload({ objectKey: 'key', uploadId: 'up-1', parts: [] }),
        /objectKey, uploadId, and completed parts array are required/
      );
    });
  });
});
