import express, { Request, Response } from 'express';
import { Branch, Todo, User } from '../../interfaces';

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

const validateBranchCode = async (req: Request, branchCode: string) => {
  let success = false;
  const requestInfo = req.body.requestInfo;
  const selectedUser = await User.findOne({
    _id: requestInfo.userId,
  });
  const selectedBranch = await Branch.findOne({
    _id: selectedUser?.branchId,
  });

  if (selectedBranch && selectedBranch.code === branchCode) {
    success = true;
  }

  return success;
};

const add = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;

  const resultBranch = await validateBranchCode(req, '1');
  if (!resultBranch) {
    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.pemissionNotAllowed,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(400);
  }
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.todos);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.addTodo,
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

    const findTodo = {
      userId: request.userId,
      todo: request.todo,
      deleted: false,
    };

    const checkNewTodo = await Todo.findOne(findTodo);

    if (checkNewTodo) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.todoExisit,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }

    const doc = new Todo({
      userId: request.userId,
      todo: request.todo,
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
    console.log(`Todo => Add Todo ${error}`);
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

  const resultBranch = await validateBranchCode(req, '1');
  if (!resultBranch) {
    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.pemissionNotAllowed,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(400);
  }
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.todos);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.updateTodo,
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

    const findTodo = {
      userId: request.userId,
      todo: request.todo,
      deleted: false,
    };

    const selectedTodo = await Todo.findOne(findTodo);

    if (selectedTodo && String(selectedTodo['_id']) !== String(_id)) {
      const message = await responseLanguage(
        requestInfo.language,
        responseMessages.todoExisit,
      );

      return res
        .send({
          success: false,
          message,
        })
        .status(400);
    }
    if (
      !selectedTodo ||
      (selectedTodo && String(selectedTodo['_id']) === String(_id))
    ) {
      const updatedTodoData = {
        todo: request.todo,
        active: request.active,
        lastUpdateInfo: requestInfo,
      };

      const doc = await Todo.findOneAndUpdate({ _id }, updatedTodoData, {
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
            user: {
              _id: Object(doc?.userId)._id,
              name: Object(doc?.userId).name,
            },
            todo: doc?.todo,
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
    console.log(`Todo => Update Todo ${error}`);

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
  const resultBranch = await validateBranchCode(req, '1');
  if (!resultBranch) {
    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.pemissionNotAllowed,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(400);
  }
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.todos);
  const hasPermission = await checkUserPermission(
    req,
    res,
    PermissionsNames.deleteTodo,
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

    const selectedTodoToDelete = {
      _id,
      deleted: false,
    };
    const selectedTodo = await Todo.findOne(selectedTodoToDelete);

    if (selectedTodo) {
      const deletedTodoData = {
        active: false,
        deleted: true,
        deleteInfo: requestInfo,
      };

      const doc = await Todo.findOneAndUpdate({ _id }, deletedTodoData, {
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
    console.log(`Todo => Delete Todo ${error}`);

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
  const resultBranch = await validateBranchCode(req, '2');
  if (!resultBranch) {
    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.pemissionNotAllowed,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(400);
  }
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.todos);
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

    const result = await Todo.paginate(where, query);

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
        user: {
          _id: Object(doc.userId)._id,
          name: Object(doc.userId).name,
        },
        todo: doc.todo,
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
    console.log(`Todo => Get All Todo ${error}`);

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

const getTodoByUser = async (req: Request, res: Response) => {
  const request = req.body;
  const requestInfo = req.body.requestInfo;

  try {
    const where = {
      userId: request.userId,
      active: true,
      deleted: false,
    };

    const result = await Todo.find(where);

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
        user: {
          _id: Object(doc.userId)._id,
          name: Object(doc.userId).name,
        },
        todo: doc.todo,
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
    console.log(`Todo => Get Todo By User ${error}`);

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
  const resultBranch = await validateBranchCode(req, '1');
  if (!resultBranch) {
    const message = await responseLanguage(
      requestInfo.language,
      responseMessages.pemissionNotAllowed,
    );
    return res
      .send({
        success: false,
        message,
      })
      .status(400);
  }
  const hasRoute = await checkUserRoutes(req, res, RoutesNames.todos);
  if (!hasRoute) return;
  try {
    const query = {
      page: req.query?.page || request.page || pagination.page,
      limit: req.query?.limit || request.query?.limit || pagination.search,
    };

    const where = {
      deleted: false,
    };

    if (request.query.todo) {
      Object(where)['todo'] = new RegExp(request.query.todo, 'i');
    }

    const result = await Todo.paginate(where, query);

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
          user: {
            _id: Object(doc.userId)._id,
            name: Object(doc.userId).name,
          },
          todo: doc.todo,
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
    console.log(`Todo => Search All ${error}`);

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

    const result = await Todo.find(where);

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
          user: {
            _id: Object(doc.userId)._id,
            name: Object(doc.userId).name,
          },
          todo: doc.todo,
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
    console.log(`Todo => Get Active Todo ${error}`);

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
  const todoUser = request.userId;
  const todoName = request.todo;
  const requestLanguage = request.requestInfo.language;
  let valid = false;
  let message;
  const checkUserIfExisit = await User.findById({ _id: todoUser });
  if (!todoUser || !checkUserIfExisit) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.userNotFound,
    );
  } else if (!todoName || todoName.length < inputsLength.todoName) {
    message = await responseLanguage(
      requestLanguage,
      responseMessages.todoName,
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

const todoRouters = async (app: express.Application) => {
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.add}`,
    verifyJwtToken,
    add,
  );
  app.put(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.update}`,
    verifyJwtToken,
    update,
  );
  app.put(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.delete}`,
    verifyJwtToken,
    deleted,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.getAll}`,
    verifyJwtToken,
    getAll,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.search}`,
    verifyJwtToken,
    search,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.getActive}`,
    verifyJwtToken,
    getActive,
  );
  app.post(
    `${site.api}${site.modules.systemManagement}${site.apps.todos}${site.appsRoutes.getTodoByUser}`,
    verifyJwtToken,
    getTodoByUser,
  );
};

export default todoRouters;
