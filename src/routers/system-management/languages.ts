import { Language } from '../../interfaces';
import {
  site,
  responseLanguage,
  responseMessages,
  verifyJwtToken,
} from '../../shared';
import express, { Request, Response } from 'express';

const getActiveLanguages = async (req: Request, res: Response) => {
  const requestInfo = req.body.requestInfo;

  try {
    const query = {
      active: true,
      deleted: false,
    };

    const result = await Language.find(query);

    if (!result.length) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.noData,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(200);
    }

    const data = [];
    for await (const doc of result) {
      data.push({
        _id: doc._id,
        name: doc.name,
        addInfo: requestInfo.isAdmin ? doc.addInfo : undefined,
        lastUpdateInfo: requestInfo.isAdmin ? doc.lastUpdateInfo : undefined,
      });
    }

    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.done,
    );

    return res
      .send({
        success: true,
        message,
        data,
      })
      .status(200);
  } catch (error) {
    console.log(`Language => Get All Languages ${error}`);

    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.invalidData,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(500);
  }
};

const languageRouters = (app: express.Application) => {
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.languages}${site.appsRoutes.getActive}`,
    verifyJwtToken,
    getActiveLanguages,
  );
};

export default languageRouters;
