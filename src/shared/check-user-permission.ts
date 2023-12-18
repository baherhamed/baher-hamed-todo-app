import { User } from '../interfaces';
import { Request, Response } from 'express';

export const checkUserPermission = async (
  req: Request,
  res: Response,
  permission: string,
) => {
  const request = req.body.requestInfo;
  const selectedUser = await User.findOne({
    _id: request.userId,
    active: true,
    deleted: false,
  });
  if (selectedUser && selectedUser.permissionsList.includes(permission)) {
    return true;
  } else {
    return false;
  }
};
