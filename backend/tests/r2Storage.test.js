const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const R2StorageService = require('../services/r2StorageService');

describe('Cloudflare R2 Storage Service', () => {
  describe('File Size Validation (200 MB Limit)', () => {
    test('accepts files up to exactly 200 MB (209,715,200 bytes)', () => {
      const exact200MB = 200 * 1024 * 1024; // 209715200 bytes
      assert.strictEqual(R2StorageService.validateFileSize(exact200MB), true);
    });

    test('accepts smaller files (500 KB, 5 MB, 50 MB, 100 MB)', () => {
      assert.strictEqual(R2StorageService.validateFileSize(500 * 1024), true); // 500 KB
      assert.strictEqual(R2StorageService.validateFileSize(5 * 1024 * 1024), true); // 5 MB
      assert.strictEqual(R2StorageService.validateFileSize(50 * 1024 * 1024), true); // 50 MB
      assert.strictEqual(R2StorageService.validateFileSize(100 * 1024 * 1024), true); // 100 MB
      assert.strictEqual(R2StorageService.validateFileSize(150 * 1024 * 1024), true); // 150 MB
    });

    test('strictly rejects files exceeding 200 MB (e.g. 201 MB)', () => {
      const over200MB = (200 * 1024 * 1024) + 1; // 209715201 bytes
      const file201MB = 201 * 1024 * 1024;
      assert.throws(
        () => R2StorageService.validateFileSize(over200MB),
        /File exceeds the maximum allowed size of 200 MB/
      );
      assert.throws(
        () => R2StorageService.validateFileSize(file201MB),
        /File exceeds the maximum allowed size of 200 MB/
      );
    });

    test('rejects negative or zero file size', () => {
      assert.throws(() => R2StorageService.validateFileSize(0), /Invalid file size/);
      assert.throws(() => R2StorageService.validateFileSize(-100), /Invalid file size/);
      assert.throws(() => R2StorageService.validateFileSize('not-a-number'), /Invalid file size/);
    });
  });

  describe('Multi-Format File Support', () => {
    test('accepts educational documents: PDF, DOC, DOCX, TXT, RTF, ODT', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'notes.pdf', mimeType: 'application/pdf' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'syllabus.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'notes.txt', mimeType: 'text/plain' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'doc.rtf', mimeType: 'application/rtf' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'paper.odt', mimeType: 'application/vnd.oasis.opendocument.text' }), true);
    });

    test('accepts spreadsheets: XLS, XLSX, CSV, ODS', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'grades.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'data.csv', mimeType: 'text/csv' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'sheet.ods', mimeType: 'application/vnd.oasis.opendocument.spreadsheet' }), true);
    });

    test('accepts presentations: PPT, PPTX, ODP', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'seminar.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'slides.odp', mimeType: 'application/vnd.oasis.opendocument.presentation' }), true);
    });

    test('accepts images: JPG, JPEG, PNG, WEBP, GIF, SVG', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'diagram.png', mimeType: 'image/png' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'photo.jpg', mimeType: 'image/jpeg' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'figure.webp', mimeType: 'image/webp' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'chart.svg', mimeType: 'image/svg+xml' }), true);
    });

    test('accepts archives: ZIP, RAR, 7Z', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'lab_code.zip', mimeType: 'application/zip' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'dataset.rar', mimeType: 'application/x-rar-compressed' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'backup.7z', mimeType: 'application/x-7z-compressed' }), true);
    });

    test('accepts programming code and text: JAVA, PY, JS, JSX, TS, TSX, C, CPP, H, CSS, HTML, JSON, XML, SQL, MD', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'Main.java', mimeType: 'text/x-java-source' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'script.py', mimeType: 'text/x-python' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'solution.cpp', mimeType: 'text/x-c' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'app.tsx', mimeType: 'text/plain' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'query.sql', mimeType: 'application/sql' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'README.md', mimeType: 'text/markdown' }), true);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'config.json', mimeType: 'application/json' }), true);
    });

    test('rejects dangerous or disallowed file extensions', () => {
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'malware.exe', mimeType: 'application/x-msdownload' }), false);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'script.sh', mimeType: 'application/x-sh' }), false);
      assert.strictEqual(R2StorageService.isAllowedFile({ filename: 'payload.bat', mimeType: 'application/x-bat' }), false);
    });
  });

  describe('File Category Classifier', () => {
    test('correctly categorizes educational files', () => {
      assert.strictEqual(R2StorageService.getFileTypeCategory('application/pdf', 'os.pdf'), 'PDF');
      assert.strictEqual(R2StorageService.getFileTypeCategory('image/png', 'graph.png'), 'Image');
      assert.strictEqual(R2StorageService.getFileTypeCategory('text/csv', 'marks.csv'), 'Sheet');
      assert.strictEqual(R2StorageService.getFileTypeCategory('application/vnd.ms-excel', 'data.xlsx'), 'Sheet');
      assert.strictEqual(R2StorageService.getFileTypeCategory('', 'slides.pptx'), 'Presentation');
      assert.strictEqual(R2StorageService.getFileTypeCategory('application/zip', 'project.zip'), 'Archive');
      assert.strictEqual(R2StorageService.getFileTypeCategory('text/plain', 'Main.java'), 'Code');
      assert.strictEqual(R2StorageService.getFileTypeCategory('text/plain', 'algo.py'), 'Code');
    });
  });

  describe('Multipart Upload Lifecycle with Mock Client', () => {
    let originalClient;
    const sentCommands = [];

    const mockClient = {
      send: async (command) => {
        sentCommands.push(command);
        const name = command.constructor.name;
        if (name === 'CreateMultipartUploadCommand') {
          return { UploadId: 'test-upload-id-123', Key: command.input.Key };
        }
        if (name === 'CompleteMultipartUploadCommand') {
          return { Location: 'https://r2.test/object', ETag: '"complete-etag-123"', Key: command.input.Key };
        }
        if (name === 'AbortMultipartUploadCommand') {
          return {};
        }
        if (name === 'DeleteObjectCommand') {
          return {};
        }
        return {};
      }
    };

    before(() => {
      originalClient = R2StorageService.getClient();
      R2StorageService.setClient(mockClient);
    });

    after(() => {
      R2StorageService.setClient(originalClient);
    });

    test('initiates multipart upload and returns upload metadata', async () => {
      const res = await R2StorageService.initiateMultipartUpload({
        filename: 'DBMS_Unit1.pdf',
        mimeType: 'application/pdf',
        size: 50 * 1024 * 1024,
        folderId: 'cse-3rd-sem-1',
        userId: 'student-123'
      });

      assert.strictEqual(res.uploadId, 'test-upload-id-123');
      assert.ok(res.objectKey.startsWith('resources/cse-3rd-sem-1/'));
      assert.ok(res.objectKey.includes('DBMS_Unit1'));
      assert.strictEqual(res.maxFileSize, 200 * 1024 * 1024);
      assert.strictEqual(res.partSize, 10 * 1024 * 1024);
    });

    test('completes multipart upload with sorted parts', async () => {
      const res = await R2StorageService.completeMultipartUpload({
        objectKey: 'resources/cse/test-key.pdf',
        uploadId: 'test-upload-id-123',
        parts: [
          { PartNumber: 2, ETag: '"etag-part-2"' },
          { PartNumber: 1, ETag: '"etag-part-1"' }
        ]
      });

      assert.strictEqual(res.etag, '"complete-etag-123"');
      assert.strictEqual(res.objectKey, 'resources/cse/test-key.pdf');

      // Verify that the command was sent with sorted parts (1 then 2)
      const completeCommand = sentCommands.find(c => c.constructor.name === 'CompleteMultipartUploadCommand');
      assert.ok(completeCommand);
      assert.strictEqual(completeCommand.input.MultipartUpload.Parts[0].PartNumber, 1);
      assert.strictEqual(completeCommand.input.MultipartUpload.Parts[1].PartNumber, 2);
    });

    test('aborts multipart upload cleanly', async () => {
      const success = await R2StorageService.abortMultipartUpload({
        objectKey: 'resources/cse/test-key.pdf',
        uploadId: 'test-upload-id-123'
      });
      assert.strictEqual(success, true);
    });

    test('deletes object from R2', async () => {
      const success = await R2StorageService.deleteObject('resources/cse/test-key.pdf');
      assert.strictEqual(success, true);
    });
  });
});
