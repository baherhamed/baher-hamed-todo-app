import express, { Request, Response } from 'express';
import { Route, Permission } from '../../interfaces';
import {
  inputsLength,
  responseMessages,
  responseLanguage,
  verifyJwtToken,
  checkUserPermission,
  pagination,
  site,
  PermissionsNames,
} from '../../shared';

const add = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;

  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.addRoute,
  );

  if (!hasPermission) return;
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

    const findRoute = {
      $or: [
        {
          name: request.name,
        },
        {
          ar: request.ar,
        },
        {
          en: request.en,
        },
      ],
      deleted: false,
    };

    const checkNewRoute = await Route.findOne(findRoute);

    if (checkNewRoute) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.routeExisit,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    // console.log('requestInfo', requestInfo);

    const doc = new Route({
      name: request.name,
      ar: request.ar,
      en: request.en,
      active: request.active,
      deleted: false,
      addInfo: requestInfo,
    });

    await doc.save();

    const permissionsList = [];
    if (request.permissionsList) {
      for await (const permission of request.permissionsList) {
        const newPermission = new Permission({
          routeId: doc._id,
          name: permission.name,
          ar: permission.ar,
          en: permission.en,
          active: permission.active,
          addInfo: { ...requestInfo },
        });
        await newPermission.save();
        permissionsList.push({
          _id: newPermission._id,
          name: permission.name,
          ar: permission.ar,
          en: permission.en,
          active: permission.active,
        });
      }
    }

    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.saved,
    );
    await doc.save();

    return res
      .send({
        success: true,
        message,
        data: {
          _id: doc._id,
          permissionsList,
        },
      })
      .status(200);
  } catch (error) {
    console.log(`Route => Add Route ${error}`);
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

  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.updateRoute,
  );

  if (!hasPermission) return;
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

    const findRoute = {
      $or: [
        {
          name: request.name,
        },
        {
          ar: request.ar,
        },
        {
          en: request.en,
        },
      ],
      deleted: false,
    };

    const selectedRoute = await Route.findOne(findRoute);

    if (selectedRoute && String(selectedRoute['_id']) !== String(_id)) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.routeExisit,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    if (
      !selectedRoute ||
      (selectedRoute && String(selectedRoute['_id']) === String(_id))
    ) {
      const updatedRouteData = {
        name: request.name,
        ar: request.ar,
        en: request.en,
        active: request.active,
        lastUpdateInfo: requestInfo,
      };

      const doc = await Route.findOneAndUpdate({ _id }, updatedRouteData, {
        new: true,
      });

      const permissionsList = [];

      if (request.permissionsList) {
        for await (const permission of request.permissionsList) {
          const exisitPermission = await Permission.findOne({
            _id: permission?._id,
            name: permission.name,
          });

          if (exisitPermission) {
            await Permission.findOneAndUpdate(
              {
                _id: permission?._id,
              },
              {
                name: permission.name,
                ar: permission.ar,
                en: permission.en,
                active: permission.active,
                lastUpdateInfo: requestInfo,
              },
            );
          } else {
            const newPermission = new Permission({
              routeId: doc?._id,
              name: permission.name,
              ar: permission.ar,
              en: permission.en,
              active: permission.active,
              addInfo: requestInfo,
            });
            await newPermission.save();
          }
        }
        const selectedPermissions = await Permission.find({
          routeId: doc?._id,
          deleted: false,
        });

        if (selectedPermissions) {
          for await (const permission of selectedPermissions) {
            permissionsList.push({
              _id: permission._id,
              name: permission.name,
              ar: permission.ar,
              en: permission.en,
              active: permission.active,
              addInfo: requestInfo.isAdmin ? permission.addInfo : undefined,
              lastUpdateInfo: requestInfo.isAdmin
                ? permission.lastUpdateInfo
                : undefined,
            });
          }
        }
      }

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
            name: doc?.name,
            ar: doc?.ar,
            en: doc?.en,
            active: doc?.active,
            permissionsList,
            addInfo: requestInfo.isAdmin ? doc?.addInfo : undefined,
            lastUpdateInfo: requestInfo.isAdmin
              ? doc?.lastUpdateInfo
              : undefined,
          },
        })
        .status(200);
    }
  } catch (error) {
    console.log(`Route => Update Route ${error}`);

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

  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.deleteRoute,
  );

  if (!hasPermission) return;
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

    const selectedRouteToDelete = {
      _id,
      deleted: false,
    };
    const selectedRoute = await Route.findOne(selectedRouteToDelete);

    if (selectedRoute) {
      const deletedRouteData = {
        active: false,
        deleted: true,
        deleteInfo: requestInfo,
      };

      const doc = await Route.findOneAndUpdate({ _id }, deletedRouteData, {
        new: true,
      });

      const deletedPermissionsList = await Permission.find({
        routeId: doc?._id,
        deleted: false,
      });

      for await (const permission of deletedPermissionsList) {
        await Permission.findOneAndUpdate(
          { _id: permission._id },
          { active: false, deleted: true, deleteInfo: requestInfo },
          { new: true },
        );
      }

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
    console.log(`Route => Delete Route ${error}`);

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

  try {
    const query = {
      page: req.query?.page || request.page || pagination.page,
      limit: req.query?.limit || request.limit || pagination.getAll,
    };

    const where = {
      deleted: false,
    };

    const result = await Route.paginate(where, query);

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
      const permissionsList = [];
      const selectedPermissionsList = await Permission.find({
        routeId: doc?._id,
        deleted: false,
      });

      if (selectedPermissionsList) {
        for await (const permission of selectedPermissionsList) {
          permissionsList.push({
            _id: permission._id,
            name: permission.name,
            ar: permission.ar,
            en: permission.en,
            active: permission.active,
          });
        }
      }

      data.push({
        _id: doc._id,
        name: doc.name,
        ar: doc.ar,
        en: doc.en,
        active: doc.active,
        permissionsList,
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
    console.log(`Route => Get All Route ${error}`);

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
    if (request.query.ar) {
      Object(where)['ar'] = new RegExp(request.query.ar, 'i');
    }

    if (request.query.en) {
      Object(where)['en'] = new RegExp(request.query.en, 'i');
    }

    const result = await Route.paginate(where, query);

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
      const permissionsList = [];
      const selectedPermissionsList = await Permission.find({
        routeId: doc?._id,
        deleted: false,
      });
      if (selectedPermissionsList) {
        for await (const permission of selectedPermissionsList) {
          permissionsList.push({
            _id: permission._id,
            name: permission.name,
            ar: permission.ar,
            en: permission.en,
            active: permission.active,
          });
        }
      }
      if (doc) {
        data.push({
          _id: doc._id,
          name: doc.name,
          ar: doc.ar,
          en: doc.en,
          active: doc.active,
          permissionsList,
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
    console.log(`Route => Search Route ${error}`);

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

    const result = await Route.find(where);

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
      const permissionsList = [];
      const selectedPermissionsList = await Permission.find({
        routeId: doc?._id,
        deleted: false,
      });

      if (selectedPermissionsList) {
        for await (const permission of selectedPermissionsList) {
          permissionsList.push({
            _id: permission._id,
            name: permission.name,
            ar: permission.ar,
            en: permission.en,
            // active: permission.active,
          });
        }
      }

      data.push({
        _id: doc._id,
        name: doc.name,
        ar: doc.ar,
        en: doc.en,
        active: doc.active,
        permissionsList,
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
    console.log(`Routes => Get Active routes ${error}`);

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
  const routeName = request.name;
  const routeNameAr = request.ar;
  const routeNameEn = request.en;
  const requestLanguage = request.requestInfo.language;
  let valid = false;
  let message;

  if (!routeName || routeName.length < inputsLength.routeName) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.routeName,
    );
  } else if (!routeNameAr || routeNameAr.length < inputsLength.routeName) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.routeName,
    );
  } else if (!routeNameEn || routeNameEn.length < inputsLength.routeName) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.routeName,
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

const routessRouters = async (app: express.Application) => {
  app.post(
    `${site.api}${site.modules.security}${site.apps.routes}${site.appsRoutes.add}`,
    verifyJwtToken,
    add,
  );
  app.put(
    `${site.api}${site.modules.security}${site.apps.routes}${site.appsRoutes.update}`,
    verifyJwtToken,
    update,
  );
  app.put(
    `${site.api}${site.modules.security}${site.apps.routes}${site.appsRoutes.delete}`,
    verifyJwtToken,
    deleted,
  );
  app.post(
    `${site.api}${site.modules.security}${site.apps.routes}${site.appsRoutes.getAll}`,
    verifyJwtToken,
    getAll,
  );
  app.post(
    `${site.api}${site.modules.security}${site.apps.routes}${site.appsRoutes.search}`,
    verifyJwtToken,
    search,
  );
  app.post(
    `${site.api}${site.modules.security}${site.apps.routes}${site.appsRoutes.getActive}`,
    verifyJwtToken,
    getActive,
  );
};

export default routessRouters;
