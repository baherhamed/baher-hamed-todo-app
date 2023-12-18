import express, { Request, Response } from 'express';
import { Branch, Permission, Route, User } from '../../interfaces';
import {
  inputsLength,
  responseMessages,
  hashPassword,
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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.users);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.addUser,
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

    const findUser = {
      $or: [
        {
          mobile: request.mobile,
        },
        {
          email: {
            $eq: request.email,
          },
        },
      ],
      deleted: false,
    };

    const checkNewUser = await User.findOne(findUser);

    if (checkNewUser) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.userExisit,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    const hashedPassword = await hashPassword(request);
    if (!hashedPassword.success) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.password,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }

    const doc = new User({
      name: request.name,
      mobile: request.mobile,
      email: request.email || request.mobile,
      languageId: request.languageId,
      branchId: request.branchId,
      routesList: request.routesList,
      permissionsList: request.permissionsList,
      password: hashedPassword.newHashedPassword,
      active: true,
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
    console.log(`User => Add User ${error}`);
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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.users);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.updateUser,
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

    const findUser = {
      $or: [
        {
          mobile: request.mobile,
        },
        {
          email: {
            $eq: request.email,
          },
        },
      ],
      deleted: false,
    };

    const checkIfUserExisit = await User.findOne(findUser);
    const selectedUser = await User.findOne({ _id });

    if (checkIfUserExisit && String(checkIfUserExisit['_id']) !== String(_id)) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.userExisit,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    if (
      !checkIfUserExisit ||
      (checkIfUserExisit && String(checkIfUserExisit['_id']) === String(_id))
    ) {
      if (selectedUser) {
        let password = selectedUser.password;
        if (
          request.password &&
          request.password.length >= inputsLength.password
        ) {
          const hashedPassword = await hashPassword(request);
          password = String(hashedPassword.newHashedPassword);
        }
        const updatedUserData = {
          name: request.name || selectedUser.name,
          password,
          mobile: request.mobile || selectedUser.mobile,
          email: request.email || selectedUser.email,
          languageId: request.languageId || selectedUser.languageId,
          branchId: request.branchId || selectedUser.branchId,
          routesList: request.routesList || selectedUser.routesList,
          permissionsList:
            request.permissionsList || selectedUser.permissionsList,
          active: request.active || selectedUser.active,
          lastUpdateInfo: requestInfo,
        };

        const doc = await User.findOneAndUpdate({ _id }, updatedUserData, {
          new: true,
        });
        const routesList = [];

        const allRoutesList = await Route.find({ deleted: false });
        const allPermissionsList = await Permission.find({
          deleted: false,
        });

        for await (const activeRoute of allRoutesList) {
          const permissionsList = [];
          for await (const perm of allPermissionsList) {
            if (String(perm.routeId._id) === String(activeRoute?._id)) {
              if (doc?.permissionsList.includes(perm.name)) {
                permissionsList.push({
                  _id: perm._id,
                  routeId: perm.routeId._id,
                  name: perm.name,
                  ar: perm.ar,
                  en: perm.en,
                  active: true,
                });
              } else {
                permissionsList.push({
                  _id: perm._id,
                  routeId: perm.routeId._id,
                  name: perm.name,
                  ar: perm.ar,
                  en: perm.en,
                  active: false,
                });
              }
            }
          }

          const selectedRoute = {
            _id: activeRoute._id,
            name: activeRoute.name,
            ar: activeRoute.ar,
            en: activeRoute.en,
            active: activeRoute.active,
            permissionsList,
          };
          if (doc?.routesList.includes(activeRoute.name)) {
            routesList.push(selectedRoute);
          } else {
            selectedRoute.active = false;
            routesList.push(selectedRoute);
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
              mobile: doc?.mobile,
              email: doc?.email,
              language: {
                _id: Object(doc?.languageId)._id,
                name: Object(doc?.languageId).name,
              },
              branch: {
                _id: Object(doc?.branchId)._id,
                name: Object(doc?.branchId).name,
              },
              routesList,
              active: doc?.active,
              addInfo: requestInfo.isAdmin ? doc?.addInfo : undefined,
              lastUpdateInfo: requestInfo.isAdmin
                ? doc?.lastUpdateInfo
                : undefined,
            },
          })
          .status(200);
      }
    }
  } catch (error) {
    console.log(`User => Update User ${error}`);

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
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.users);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.deleteUser,
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

    const selectedUserToDelete = {
      _id,
      deleted: false,
    };
    const selectedUser = await User.findOne(selectedUserToDelete);

    if (selectedUser) {
      const deletedUserData = {
        active: false,
        deleted: true,
        deleteInfo: requestInfo,
      };

      const doc = await User.findOneAndUpdate({ _id }, deletedUserData, {
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
    console.log(`User => Delete User ${error}`);

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

const search = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.users);
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
    if (request.query.mobile) {
      Object(where)['mobile'] = new RegExp(request.query.mobile, 'i');
    }

    if (request.query.email) {
      Object(where)['email'] = new RegExp(request.query.email, 'i');
    }

    const result = await User.paginate(where, query);

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
        const routesList = [];

        const allRoutesList = await Route.find({ deleted: false });
        const allPermissionsList = await Permission.find({
          deleted: false,
        });

        for await (const activeRoute of allRoutesList) {
          const permissionsList = [];
          for await (const perm of allPermissionsList) {
            if (String(perm.routeId._id) === String(activeRoute?._id)) {
              if (doc.permissionsList.includes(perm.name)) {
                permissionsList.push({
                  _id: perm._id,
                  routeId: perm.routeId._id,
                  name: perm.name,
                  ar: perm.ar,
                  en: perm.en,
                  active: true,
                });
              } else {
                permissionsList.push({
                  _id: perm._id,
                  routeId: perm.routeId._id,
                  name: perm.name,
                  ar: perm.ar,
                  en: perm.en,
                  active: false,
                });
              }
            }
          }

          const selectedRoute = {
            _id: activeRoute._id,
            name: activeRoute.name,
            ar: activeRoute.ar,
            en: activeRoute.en,
            active: activeRoute.active,
            permissionsList,
          };
          if (doc.routesList.includes(activeRoute.name)) {
            routesList.push(selectedRoute);
          } else {
            selectedRoute.active = false;
            routesList.push(selectedRoute);
          }
        }

        data.push({
          _id: doc._id,
          name: doc.name,
          mobile: doc.mobile,
          email: doc.email,
          language: {
            _id: Object(doc.languageId)._id,
            name: Object(doc.languageId).name,
          },
          branch: {
            _id: Object(doc.branchId)._id,
            name: Object(doc.branchId).name,
          },
          routesList,
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
    console.log(`User => Search User ${error}`);

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

const getAll = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.users);
  if (!hasRoute) return;
  try {
    const query = {
      page: req.query?.page || request.page || pagination.page,
      limit: req.query?.limit || request.limit || pagination.getAll,
    };

    const where = {
      isDeveloper: false,
      deleted: false,
    };

    const result = await User.paginate(where, query);

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
        const routesList = [];

        const allRoutesList = await Route.find({ deleted: false });
        const allPermissionsList = await Permission.find({
          deleted: false,
        });

        for await (const activeRoute of allRoutesList) {
          const permissionsList = [];
          for await (const perm of allPermissionsList) {
            if (String(perm.routeId._id) === String(activeRoute?._id)) {
              if (doc.permissionsList.includes(perm.name)) {
                permissionsList.push({
                  _id: perm._id,
                  routeId: perm.routeId._id,
                  name: perm.name,
                  ar: perm.ar,
                  en: perm.en,
                  active: true,
                });
              } else {
                permissionsList.push({
                  _id: perm._id,
                  routeId: perm.routeId._id,
                  name: perm.name,
                  ar: perm.ar,
                  en: perm.en,
                  active: false,
                });
              }
            }
          }

          const selectedRoute = {
            _id: activeRoute._id,
            name: activeRoute.name,
            ar: activeRoute.ar,
            en: activeRoute.en,
            active: activeRoute.active,
            permissionsList,
          };
          if (doc.routesList.includes(activeRoute.name)) {
            routesList.push(selectedRoute);
          } else {
            selectedRoute.active = false;
            routesList.push(selectedRoute);
          }
        }

        data.push({
          _id: doc._id,
          name: doc.name,
          mobile: doc.mobile,
          email: doc.email,
          language: {
            _id: Object(doc.languageId)._id,
            name: Object(doc.languageId).name,
          },
          branch: {
            _id: Object(doc.branchId)._id,
            name: Object(doc.branchId).name,
          },
          routesList,
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
    console.log(`User => Get All User ${error}`);

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
  const userName = request.name;
  const userMobile = request.mobile;
  const userPassword = request.password;
  const userBranch = request.branchId;
  const requestLanguage = request.requestInfo.language;
  let valid = false;
  let message;

  const checkBranch = await Branch.findOne({ _id: userBranch });

  if (!userName || userName.length < inputsLength.name) {
    message = await responseLanguage(requestLanguage, responseMessages.name);
  } else if (!userMobile || userMobile.length < inputsLength.mobile) {
    message = await responseLanguage(requestLanguage, responseMessages.mobile);
  } else if (!userPassword || userPassword.length < inputsLength.password) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.password,
    );
  }  else if (!userBranch || !checkBranch) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.branchName,
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

const usersRouters = async (app: express.Application) => {
  app.post(
    `${site.api}${site.modules.security}${site.apps.users}${site.appsRoutes.add}`,
    verifyJwtToken,
    add,
  );
  app.put(
    `${site.api}${site.modules.security}${site.apps.users}${site.appsRoutes.update}`,
    verifyJwtToken,
    update,
  );
  app.put(
    `${site.api}${site.modules.security}${site.apps.users}${site.appsRoutes.delete}`,
    verifyJwtToken,
    deleted,
  );
  app.post(
    `${site.api}${site.modules.security}${site.apps.users}${site.appsRoutes.getAll}`,
    verifyJwtToken,
    getAll,
  );
  app.post(
    `${site.api}${site.modules.security}${site.apps.users}${site.appsRoutes.search}`,
    verifyJwtToken,
    search,
  );
};

export default usersRouters;
