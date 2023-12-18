import { User } from '../interfaces';
import { Request, Response } from 'express';
import { responseLanguage, responseMessages } from '.';
export const checkUserRoutes = async (
  req: Request,
  res: Response,
  route: string,
) => {
  const request = req.body.requestInfo;
  const selectedUser = await User.findOne({
    _id: request.userId,
    active: true,
    deleted: false,
  });
  if (selectedUser && selectedUser.routesList.includes(route)) {
    return true;
  } else {
    const message = await responseLanguage(
      request.language,
      responseMessages.routeNotAllowed,
    );
    res
      .send({
        success: false,
        message,
      })
      .status(401);
  }
};
