import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import util from 'util';
import fs from 'fs';

import { site } from '.';
import formidable from 'formidable';

const fileFilter = async (
  req: Request,
  file: { mimetype: string },
  cb: (arg0: null, arg1: boolean) => void,
) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../uploads');
  },

  filename: function (req, file, cb) {
    cb(
      null,

      new Date().getTime() + path.extname(file.originalname),
    );
  },
});

const uploadFile = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter,
});

const checkUploadsDir = async (
  req: Request,
  res: Response,
  cb: (arg0: null, arg1: boolean) => void,
) => {
  const dirExisit = fs.existsSync('../uploads');
  if (!dirExisit) {
    fs.mkdirSync('../uploads');
  }

  cb(null, true);
};

const uploadsRouters = async (app: express.Application) => {
  app.post(
    `${site.api}/uploadCustomerDoc`,
    checkUploadsDir,
    uploadFile.single('customerDoc'),
    async (req: Request, res: Response) => {
      const form = formidable({});

      form.parse(req, async (err, fields, files) => {
        res.writeHead(200, {
          'content-type': '*',
        });
        res.write('received upload:\n\n');

        res.end(
          util.inspect({
            fields: fields,
            files: files,
          }),
        );
      });
    },
  );
};

export default uploadsRouters;
