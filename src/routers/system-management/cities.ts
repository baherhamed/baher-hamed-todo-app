import express, { Request, Response } from 'express';
import { City } from '../../interfaces';

import {
  inputsLength,
  responseMessages,
  responseLanguage,
  verifyJwtToken,
  checkUserPermission,
  pagination,
  site,
  PermissionsNames,
  checkUserRoutes,
  RoutesNames,
} from '../../shared';

const add = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.cities);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.addCity,
  );

  if (!hasRoute || !hasPermission) return;
  try {
    const checkData = await validateData(req);

    if (!checkData.valid) {
      return res
        .send({
          success: false,
          message: checkData.message,
        })
        .status(400);
    }

    const findCity = {
      govId: request.govId,
      name: request.name,
      deleted: false,
    };

    const checkNewCity = await City.findOne(findCity);

    if (checkNewCity) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.cityExisit,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }

    const doc = new City({
      govId: request.govId,
      name: request.name,
      active: request.active,
      deleted: false,
      addInfo: requestInfo,
    });
    await doc.save();

    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.saved,
    );
    return res
      .send({
        success: true,
        message,
        data: {
          _id: doc._id,
        },
      })
      .status(200);

  } catch (error) {
    console.log(`City => Add City ${error}`);
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

const update = async (req: Request, res: Response) => {
  const request = req.body;
  const _id = req.body._id;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.cities);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.updateCity,
  );

  if (!hasRoute || !hasPermission) return;
  try {
    if (!_id) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.missingId,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }

    const checkData = await validateData(req);

    if (!checkData.valid) {
      return res
        .send({
          success: false,
          message: checkData.message,
        })
        .status(400);
    }

    const findCity = {
      govId: request.govId,
      name: request.name,
      deleted: false,
    };

    const selectedCity = await City.findOne(findCity);

    if (selectedCity && String(selectedCity['_id']) !== String(_id)) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.cityExisit,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    if (
      !selectedCity ||
      (selectedCity && String(selectedCity['_id']) === String(_id))
    ) {
      const updatedCityData = {
        name: request.name,

        active: request.active,
        lastUpdateInfo: requestInfo,
      };

      const doc = await City.findOneAndUpdate({ _id }, updatedCityData, {
        new: true,
      });

      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.updated,
      );
      return res
        .send({
          success: true,
          message,
          data: {
            _id: doc?._id,
            gov: {
              _id: Object(doc?.govId)._id,
              name: Object(doc?.govId).name,
            },
            name: doc?.name,
            active: doc?.active,
            addInfo: requestInfo.isAdmin ? doc?.addInfo : undefined,
            lastUpdateInfo: requestInfo.isAdmin
              ? doc?.lastUpdateInfo
              : undefined,
          },
        })
        .status(200);
    }
  } catch (error) {
    console.log(`City => Update City ${error}`);

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

const deleted = async (req: Request, res: Response) => {
  const _id = req.body._id;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.cities);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.deleteCity,
  );

  if (!hasRoute || !hasPermission) return;
  try {
    if (!_id) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.missingId,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }

    const selectedCityToDelete = {
      _id,
      deleted: false,
    };
    const selectedCity = await City.findOne(selectedCityToDelete);

    if (selectedCity) {
      const deletedCityData = {
        active: false,
        deleted: true,
        deleteInfo: requestInfo,
      };

      const doc = await City.findOneAndUpdate({ _id }, deletedCityData, {
        new: true,
      });

      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.deleted,
      );

      return res
        .send({
          success: true,
          message,
          data: {
            _id: doc?._id,
          },
        })
        .status(200);
    } else {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.noData,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(500);
    }
  } catch (error) {
    console.log(`City => Delete City ${error}`);

    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.noData,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(500);
  }
};

const getAll = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.cities);
  if (!hasRoute) return;
  try {
    const query = {
      page: req.query?.page || request.page || pagination.page,
      limit: req.query?.limit || request.limit || pagination.getAll,
    };

    const where = {
      deleted: false,
    };

    const result = await City.paginate(where, query);

    if (!result.docs.length) {
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

    for await (const doc of result.docs) {
      data.push({
        _id: doc._id,
        gov: {
          _id: Object(doc.govId)._id,
          name: Object(doc.govId).name,
        },
        name: doc.name,
        active: doc.active,
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
        paginationInfo: site.pagination(result),
      })
      .status(200);
  } catch (error) {
    console.log(`City => Get All City ${error}`);

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

const getCitiesByGov = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;

  try {
    const where = {
      govId: request.govId,
      active: true,
      deleted: false,
    };

    const result = await City.find(where);

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
    console.log(`City => Get Cities By Gov ${error}`);

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

const search = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.cities);
  if (!hasRoute) return;
  try {
    const query = {
      page: req.query?.page || request.page || pagination.page,
      limit: req.query?.limit || request.query?.limit || pagination.search,
    };

    const where = {
      deleted: false,
    };

    if (request.query.name) {
      Object(where)['name'] = new RegExp(request.query.name, 'i');
    }

    const result = await City.paginate(where, query);

    if (!result.docs.length) {
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
    for await (const doc of result.docs) {
      if (doc) {
        data.push({
          _id: doc._id,
          gov: {
            _id: Object(doc.govId)._id,
            name: Object(doc.govId).name,
          },
          name: doc.name,
          active: doc.active,
          addInfo: requestInfo.isAdmin ? doc.addInfo : undefined,
          lastUpdateInfo: requestInfo.isAdmin ? doc.lastUpdateInfo : undefined,
        });
      }
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
        paginationInfo: site.pagination(result),
      })
      .status(200);
  } catch (error) {
    console.log(`City => Search All ${error}`);

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

const getActive = async (req: Request, res: Response) => {
  const requestInfo = req.body.requestInfo;

  try {
    const where = {
      active: true,
      deleted: false,
    };

    const result = await City.find(where);

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
      if (doc) {
        data.push({
          _id: doc._id,
          name: doc.name,
          active: doc.active,
        });
      }
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
    console.log(`City => Get Active City ${error}`);

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

async function validateData(req: Request) {
  const request = req.body;
  const cityName = request.name;
  const requestLanguage = request.requestInfo.language;
  let valid = false;
  let message;

  if (!cityName || cityName.length < inputsLength.cityName) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.cityName,
    );
  } else {
    valid = true;
    message = await responseLanguage(requestLanguage, responseMessages.valid);
  }
  return {
    valid,
    message,
  };
}

const citiesRouters = async (app: express.Application) => {
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.add}`,
    verifyJwtToken,
    add,
  );
  app.put(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.update}`,
    verifyJwtToken,
    update,
  );
  app.put(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.delete}`,
    verifyJwtToken,
    deleted,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.getAll}`,
    verifyJwtToken,
    getAll,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.search}`,
    verifyJwtToken,
    search,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.getActive}`,
    verifyJwtToken,
    getActive,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.cities}${site.appsRoutes.getCitiesByGov}`,
    verifyJwtToken,
    getCitiesByGov,
  );
};

export default citiesRouters;
