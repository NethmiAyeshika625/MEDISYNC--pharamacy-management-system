import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

const router = express.Router();

// Use memory storage so we can write straight into GridFS
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const readStream = Readable.from(req.file.buffer);
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
      metadata: { originalName: req.file.originalname }
    });

    readStream.pipe(uploadStream)
      .on('error', (err) => next(err))
      .on('finish', () => {
        const id = uploadStream.id.toString();
        res.status(201).json({ fileId: id, downloadUrl: `/api/uploads/${id}` });
      });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = new mongoose.Types.ObjectId(req.params.id);
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.on('error', () => res.status(404).json({ message: 'File not found' }));
    downloadStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
