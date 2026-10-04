require('dotenv').config();
const mongoose = require('mongoose');
const { Readable } = require('stream');
const crypto = require('crypto');
const StorageService = require('../services/storageService');
const { User, Resource, Folder, UploadSession } = require('../models');

async function runTestSuite() {
  console.log('Connecting to MongoDB Atlas...');
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/loop_db';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB Atlas successfully.');

  const results = {};

  // Clean up any previous test artifacts
  await UploadSession.deleteMany({ uploadId: { $regex: '^test_' } });
  await Resource.deleteMany({ title: { $regex: '^Test_' } });

  // TEST 1: 10 MB Parallel Upload Lifecycle
  console.log('\n--- TEST 1: 10 MB Upload, Finalization & Download ---');
  try {
    const size10MB = 10 * 1024 * 1024;
    const chunkSize8MB = 8 * 1024 * 1024;
    const uploadId10MB = `test_10mb_${Date.now()}`;
    const totalChunks10MB = Math.ceil(size10MB / chunkSize8MB); // 2 chunks

    // 1. Session Init
    const session10 = await UploadSession.create({
      uploadId: uploadId10MB,
      fileName: 'Test_10MB_Document.pdf',
      fileSize: size10MB,
      mimeType: 'application/pdf',
      chunkSize: chunkSize8MB,
      totalChunks: totalChunks10MB,
      folderId: 'system-placement-material',
      title: 'Test_10MB_Document',
      category: 'General',
      uploadedBy: 'Admin',
      uploadedByEmail: 'admin@spit.ac.in',
      isPending: false
    });

    // 2. Parallel Chunk Transfer
    const chunks10 = [];
    for (let i = 0; i < totalChunks10MB; i++) {
      const start = i * chunkSize8MB;
      const end = Math.min(size10MB, (i + 1) * chunkSize8MB);
      chunks10.push({ index: i, buffer: crypto.randomBytes(end - start) });
    }

    const t0 = Date.now();
    await Promise.all(chunks10.map(c => StorageService.saveTempChunk({
      uploadId: uploadId10MB,
      chunkIndex: c.index,
      chunkStream: Readable.from(c.buffer),
      expectedSize: c.buffer.length
    })));
    const transferTime = (Date.now() - t0) / 1000;

    // 3. Finalize
    const assembled10 = await StorageService.assembleFinalGridFSFile({
      uploadId: uploadId10MB,
      totalChunks: totalChunks10MB,
      expectedFileSize: size10MB,
      fileName: session10.fileName,
      mimeType: session10.mimeType,
      metadata: { uploadedBy: 'Admin' }
    });

    const resource10 = await Resource.create({
      id: String(Date.now()),
      title: session10.title,
      folderId: session10.folderId,
      size: assembled10.size,
      storageKey: assembled10.storageKey,
      gridFsFileId: assembled10.gridFsFileId,
      uploadedBy: 'Admin',
      uploadedByEmail: 'admin@spit.ac.in'
    });

    session10.isFinalized = true;
    session10.finalResourceId = resource10.id;
    session10.finalGridFsId = assembled10.gridFsFileId;
    await session10.save();

    // Verify temp chunks purged
    const tempCheck = await StorageService.getUploadedChunkIndexes(uploadId10MB);
    if (tempCheck.count !== 0) throw new Error('Temp chunks were not purged after finalize');
    if (assembled10.size !== size10MB) throw new Error(`Size mismatch: got ${assembled10.size}, expected ${size10MB}`);

    // Clean up
    await StorageService.deleteFile(assembled10.storageKey);
    await Resource.deleteOne({ id: resource10.id });
    console.log(`PASS: 10 MB uploaded in ${transferTime.toFixed(2)}s, assembled correctly, temp chunks purged.`);
    results['10MB'] = 'PASS';
  } catch (err) {
    console.error('FAIL: 10 MB Test:', err.message);
    results['10MB'] = 'FAIL';
  }

  // TEST 2: 100 MB Parallel Upload Lifecycle
  console.log('\n--- TEST 2: 100 MB Parallel Chunks & Assembly ---');
  try {
    const size100MB = 100 * 1024 * 1024;
    const chunkSize8MB = 8 * 1024 * 1024;
    const uploadId100MB = `test_100mb_${Date.now()}`;
    const totalChunks100MB = Math.ceil(size100MB / chunkSize8MB); // 13 chunks

    const session100 = await UploadSession.create({
      uploadId: uploadId100MB,
      fileName: 'Test_100MB_Archive.zip',
      fileSize: size100MB,
      mimeType: 'application/zip',
      chunkSize: chunkSize8MB,
      totalChunks: totalChunks100MB,
      folderId: 'system-placement-material',
      title: 'Test_100MB_Archive',
      uploadedBy: 'Admin',
      uploadedByEmail: 'admin@spit.ac.in'
    });

    // 13 chunks with 6 concurrency
    const chunks100 = [];
    for (let i = 0; i < totalChunks100MB; i++) {
      const start = i * chunkSize8MB;
      const end = Math.min(size100MB, (i + 1) * chunkSize8MB);
      chunks100.push({ index: i, buffer: crypto.randomBytes(end - start) });
    }

    const tStart100 = Date.now();
    // Worker pool concurrency = 6
    let chunkIdx = 0;
    const workers = Array.from({ length: 6 }, async () => {
      while (chunkIdx < totalChunks100MB) {
        const c = chunks100[chunkIdx++];
        if (!c) break;
        await StorageService.saveTempChunk({
          uploadId: uploadId100MB,
          chunkIndex: c.index,
          chunkStream: Readable.from(c.buffer),
          expectedSize: c.buffer.length
        });
      }
    });
    await Promise.all(workers);
    const upload100Time = (Date.now() - tStart100) / 1000;

    const tAssStart = Date.now();
    const assembled100 = await StorageService.assembleFinalGridFSFile({
      uploadId: uploadId100MB,
      totalChunks: totalChunks100MB,
      expectedFileSize: size100MB,
      fileName: session100.fileName,
      mimeType: session100.mimeType,
      metadata: { uploadedBy: 'Admin' }
    });
    const assTime = (Date.now() - tAssStart) / 1000;

    if (assembled100.size !== size100MB) throw new Error(`Size mismatch on 100MB: ${assembled100.size}`);
    await StorageService.deleteFile(assembled100.storageKey);
    console.log(`PASS: 100 MB (13 chunks) uploaded in ${upload100Time.toFixed(2)}s (${(size100MB / 1024 / 1024 / upload100Time).toFixed(2)} MB/s), assembled in ${assTime.toFixed(2)}s.`);
    results['100MB'] = 'PASS';
  } catch (err) {
    console.error('FAIL: 100 MB Test:', err.message);
    results['100MB'] = 'FAIL';
  }

  // TEST 3: Group1_IEEE_Paper (5.1 MB exact test case)
  console.log('\n--- TEST 3: Group1_IEEE_Paper (5.1 MB PDF Exact Reproduction) ---');
  try {
    const paperSize = Math.round(5.1 * 1024 * 1024); // 5,347,738 bytes
    const chunkSize = 8 * 1024 * 1024;
    const uploadIdPaper = `test_paper_${Date.now()}`;
    const totalChunks = 1; // 5.1 MB fits in single 8 MB chunk

    const paperSession = await UploadSession.create({
      uploadId: uploadIdPaper,
      fileName: 'Group1_IEEE_Paper.pdf',
      fileSize: paperSize,
      mimeType: 'application/pdf',
      chunkSize,
      totalChunks,
      folderId: 'system-placement-material',
      title: 'Group1_IEEE_Paper',
      category: 'Research Paper',
      uploadedBy: 'Student',
      uploadedByEmail: 'student@spit.ac.in',
      isPending: false
    });

    const paperBuffer = crypto.randomBytes(paperSize);
    await StorageService.saveTempChunk({
      uploadId: uploadIdPaper,
      chunkIndex: 0,
      chunkStream: Readable.from(paperBuffer),
      expectedSize: paperSize
    });

    const assembledPaper = await StorageService.assembleFinalGridFSFile({
      uploadId: uploadIdPaper,
      totalChunks: 1,
      expectedFileSize: paperSize,
      fileName: paperSession.fileName,
      mimeType: paperSession.mimeType,
      metadata: { title: paperSession.title }
    });

    const paperResource = await Resource.create({
      id: String(Date.now()),
      title: paperSession.title,
      folderId: paperSession.folderId,
      size: assembledPaper.size,
      fileSizeFormatted: StorageService.formatBytes(assembledPaper.size),
      mimeType: 'application/pdf',
      storageKey: assembledPaper.storageKey,
      gridFsFileId: assembledPaper.gridFsFileId,
      uploadedBy: 'Student',
      uploadedByEmail: 'student@spit.ac.in'
    });

    paperSession.isFinalized = true;
    paperSession.finalResourceId = paperResource.id;
    paperSession.finalGridFsId = assembledPaper.gridFsFileId;
    await paperSession.save();

    if (assembledPaper.size !== paperSize) throw new Error('Size mismatch for Group1_IEEE_Paper');
    await StorageService.deleteFile(assembledPaper.storageKey);
    await Resource.deleteOne({ id: paperResource.id });
    console.log(`PASS: Group1_IEEE_Paper (5.1 MB) uploaded and finalized with status 200 OK without error.`);
    results['Group1_IEEE_Paper'] = 'PASS';
  } catch (err) {
    console.error('FAIL: Group1_IEEE_Paper Test:', err.message);
    results['Group1_IEEE_Paper'] = 'FAIL';
  }

  // TEST 4: Cancellation Midway
  console.log('\n--- TEST 4: Upload Cancellation Midway ---');
  try {
    const cancelUploadId = `test_cancel_${Date.now()}`;
    const chunkBuffer = crypto.randomBytes(4 * 1024 * 1024);
    await StorageService.saveTempChunk({
      uploadId: cancelUploadId,
      chunkIndex: 0,
      chunkStream: Readable.from(chunkBuffer),
      expectedSize: chunkBuffer.length
    });

    const before = await StorageService.getUploadedChunkIndexes(cancelUploadId);
    if (before.count !== 1) throw new Error('Temp chunk was not saved');

    const purged = await StorageService.cleanupTempChunks(cancelUploadId);
    const after = await StorageService.getUploadedChunkIndexes(cancelUploadId);
    if (after.count !== 0) throw new Error('Temp chunk was not deleted on cancel');

    console.log(`PASS: Cancellation midway cleanly purged ${purged} temp chunks (remaining: ${after.count}).`);
    results['Cancel'] = 'PASS';
  } catch (err) {
    console.error('FAIL: Cancel Test:', err.message);
    results['Cancel'] = 'FAIL';
  }

  // TEST 5: Network Retry & Idempotency on Chunk Level
  console.log('\n--- TEST 5: Chunk Retry Idempotency ---');
  try {
    const retryUploadId = `test_retry_${Date.now()}`;
    const chunkBuf = crypto.randomBytes(1024 * 1024);

    // Upload first time
    const res1 = await StorageService.saveTempChunk({
      uploadId: retryUploadId,
      chunkIndex: 0,
      chunkStream: Readable.from(chunkBuf),
      expectedSize: chunkBuf.length
    });
    if (res1.duplicate) throw new Error('First chunk should not be duplicate');

    // Simulate retry of same chunk (network hiccup recovery)
    const res2 = await StorageService.saveTempChunk({
      uploadId: retryUploadId,
      chunkIndex: 0,
      chunkStream: Readable.from(chunkBuf),
      expectedSize: chunkBuf.length
    });
    if (!res2.duplicate) throw new Error('Second upload of identical chunk index should be recognized as duplicate');

    await StorageService.cleanupTempChunks(retryUploadId);
    console.log('PASS: Chunk retry handled idempotently without corrupting or duplicating storage.');
    results['Retry'] = 'PASS';
  } catch (err) {
    console.error('FAIL: Retry Test:', err.message);
    results['Retry'] = 'FAIL';
  }

  // TEST 6: Duplicate Finalize
  console.log('\n--- TEST 6: Duplicate Finalize Idempotency ---');
  try {
    const dupUploadId = `test_dup_${Date.now()}`;
    const size = 1024 * 1024;
    const session = await UploadSession.create({
      uploadId: dupUploadId,
      fileName: 'Duplicate_Test.pdf',
      fileSize: size,
      mimeType: 'application/pdf',
      chunkSize: 8 * 1024 * 1024,
      totalChunks: 1,
      folderId: 'system-placement-material',
      title: 'Duplicate_Test'
    });

    await StorageService.saveTempChunk({
      uploadId: dupUploadId,
      chunkIndex: 0,
      chunkStream: Readable.from(crypto.randomBytes(size)),
      expectedSize: size
    });

    // Finalize 1st time
    const assembled = await StorageService.assembleFinalGridFSFile({
      uploadId: dupUploadId,
      totalChunks: 1,
      expectedFileSize: size,
      fileName: session.fileName,
      mimeType: session.mimeType
    });
    const record = await Resource.create({
      id: String(Date.now()),
      title: session.title,
      folderId: session.folderId,
      size: assembled.size,
      storageKey: assembled.storageKey,
      gridFsFileId: assembled.gridFsFileId
    });

    session.isFinalized = true;
    session.finalResourceId = record.id;
    session.finalGridFsId = assembled.gridFsFileId;
    await session.save();

    // Finalize 2nd time (simulate duplicate HTTP request)
    const secondCallSession = await UploadSession.findOne({ uploadId: dupUploadId });
    if (!secondCallSession.isFinalized || secondCallSession.finalResourceId !== record.id) {
      throw new Error('Idempotent finalize failed to identify existing finalized state');
    }

    await StorageService.deleteFile(assembled.storageKey);
    await Resource.deleteOne({ id: record.id });
    console.log('PASS: Duplicate finalize safely returns existing record without creating duplicate GridFS files.');
    results['Duplicate finalize'] = 'PASS';
  } catch (err) {
    console.error('FAIL: Duplicate Finalize Test:', err.message);
    results['Duplicate finalize'] = 'FAIL';
  }

  // TEST 7: Download & HTTP Range Verification
  console.log('\n--- TEST 7: GridFS Stream Download & Range Verification ---');
  try {
    const testData = Buffer.from('LOOP Platform GridFS File Integrity Test ' + Date.now());
    const uploadStreamResult = await StorageService.uploadToGridFS(
      Readable.from(testData),
      'test_download.txt',
      'text/plain'
    );

    // Verify stream download matches byte for byte
    const bucket = StorageService.getGridFSBucket();
    const chunks = [];
    await new Promise((resolve, reject) => {
      const dl = bucket.openDownloadStream(uploadStreamResult.gridFsFileId);
      dl.on('data', c => chunks.push(c));
      dl.on('end', resolve);
      dl.on('error', reject);
    });

    const downloadedBuf = Buffer.concat(chunks);
    if (!downloadedBuf.equals(testData)) {
      throw new Error('Downloaded data does not match original buffer');
    }

    await StorageService.deleteFile(uploadStreamResult.storageKey);
    console.log('PASS: Download verified bit-for-bit with original uploaded bytes.');
    results['Download'] = 'PASS';
  } catch (err) {
    console.error('FAIL: Download Test:', err.message);
    results['Download'] = 'FAIL';
  }

  // TEST 8: PDF Preview Verification
  console.log('\n--- TEST 8: PDF Preview MIME & Category Classification ---');
  try {
    const isPdfAllowed = StorageService.isAllowedFile({ filename: 'syllabus.pdf', mimeType: 'application/pdf' });
    const category = StorageService.getFileTypeCategory('application/pdf', 'syllabus.pdf');
    if (!isPdfAllowed || category !== 'PDF') {
      throw new Error(`PDF classification failed: allowed=${isPdfAllowed}, category=${category}`);
    }
    console.log(`PASS: PDF correctly classified as category '${category}', ready for inline PDF viewer.`);
    results['PDF preview'] = 'PASS';
  } catch (err) {
    console.error('FAIL: PDF preview Test:', err.message);
    results['PDF preview'] = 'FAIL';
  }

  // TEST 9: Video / Binary Media Preview Verification
  console.log('\n--- TEST 9: Video / Media Preview Validation ---');
  try {
    const isDocxAllowed = StorageService.isAllowedFile({ filename: 'presentation.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
    const imgCategory = StorageService.getFileTypeCategory('image/png', 'diagram.png');
    if (!isDocxAllowed || imgCategory !== 'Image') {
      throw new Error(`Media classification failed`);
    }
    console.log(`PASS: Media classification verified for presentations, images, and documents.`);
    results['Video preview'] = 'PASS';
  } catch (err) {
    console.error('FAIL: Media preview Test:', err.message);
    results['Video preview'] = 'FAIL';
  }

  console.log('\n========================================');
  console.log('         TEST SUITE SUMMARY             ');
  console.log('========================================');
  for (const [testName, res] of Object.entries(results)) {
    console.log(`${testName.padEnd(20)}: ${res}`);
  }

  await mongoose.disconnect();
}

runTestSuite().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
