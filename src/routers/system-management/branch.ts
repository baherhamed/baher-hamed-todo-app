import express, { Request, Response } from 'express';
import { Branch } from '../../interfaces';

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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.branches);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.addBranch,
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

    const findBranch = {
      $or: [
        {
          name: request.name,
        },
        {
          code: request.code,
        },
      ],
      deleted: false,
    };

    const checkNewBranch = await Branch.findOne(findBranch);

    if (checkNewBranch) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.branchExisit,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }

    const doc = new Branch({
      name: request.name,
      code: request.code,
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
    console.log(`Branch => Add Branch ${error}`);
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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.branches);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.updateBranch,
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

    const findBranch = {
      name: request.name,
      code: request.code,
      deleted: false,
    };

    const selectedBranch = await Branch.findOne(findBranch);

    if (selectedBranch && String(selectedBranch['_id']) !== String(_id)) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.branchExisit,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    if (
      !selectedBranch ||
      (selectedBranch && String(selectedBranch['_id']) === String(_id))
    ) {
      const updatedBranchData = {
        name: request.name,
        code: request.code,
        active: request.active,
        lastUpdateInfo: requestInfo,
      };

      const doc = await Branch.findOneAndUpdate({ _id }, updatedBranchData, {
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
            name: doc?.name,
            code: doc?.code,
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
    console.log(`Branch => Update Branch ${error}`);

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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.branches);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.deleteBranch,
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
    const selectedBranchToDelete = {
      _id,
      deleted: false,
    };
    const selectedBranch = await Branch.findOne(selectedBranchToDelete);

    if (selectedBranch) {
      const deletedBranchData = {
        active: false,
        deleted: true,
        deleteInfo: requestInfo,
      };

      const doc = await Branch.findOneAndUpdate({ _id }, deletedBranchData, {
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
    console.log(`Branch => Delete Branch ${error}`);

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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.branches);
  if (!hasRoute) return;

  try {
    const query = {
      page: req.query?.page || request.page || pagination.page,
      limit: req.query?.limit || request.limit || pagination.getAll,
    };

    const where = {
      deleted: false,
    };

    const result = await Branch.paginate(where, query);

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
        name: doc.name,
        code: doc.code,
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
    console.log(`Branch => Get All Branch ${error}`);

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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.branches);
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

    const result = await Branch.paginate(where, query);

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
          name: doc.name,
          code: doc.code,
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
    console.log(`Branch => Search All ${error}`);

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

    const result = await Branch.find(where);

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
          code: doc.code,
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
    console.log(`Branch => Get Active Branch ${error}`);

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
  const branchName = request.name;
  const brancCode = request.code;
  const requestLanguage = request.requestInfo.language;
  let valid = false;
  let message;

  if (!branchName || branchName.length < inputsLength.branchName) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.branchName,
    );
  } else if (!(brancCode && brancCode > 0)) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.branchCode,
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

const branchesRouters = async (app: express.Application) => {
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.branches}${site.appsRoutes.add}`,
    verifyJwtToken,
    add,
  );
  app.put(
    `${site.api}${site.modules.systemManagement}${site.apps.branches}${site.appsRoutes.update}`,
    verifyJwtToken,
    update,
  );
  app.put(
    `${site.api}${site.modules.systemManagement}${site.apps.branches}${site.appsRoutes.delete}`,
    verifyJwtToken,
    deleted,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.branches}${site.appsRoutes.getAll}`,
    verifyJwtToken,
    getAll,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.branches}${site.appsRoutes.search}`,
    verifyJwtToken,
    search,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.branches}${site.appsRoutes.getActive}`,
    verifyJwtToken,
    getActive,
  );
};

export default branchesRouters;
