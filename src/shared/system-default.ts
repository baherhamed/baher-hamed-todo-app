import { hashPassword } from './hash-password';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
import { User, Language, Route, Permission } from '../interfaces';

export const systemDefaults = (async () => {
  const defaultLangAr = await Language.findOne({
    code: 1,
  });
  const defaultLangEn = await Language.findOne({
    code: 2,
  });

  if (!defaultLangAr) {
    const newLang = new Language({
      _id: new ObjectId('606b64ba679e4903d47fa001'),
      code: 1,
      name: 'ar',
      active: true,
      deleted: false,
    });

    try {
      await newLang.save();
    } catch (error) {
      console.log(
        `Error In System Default While Creating Default Arabic Language ${error}`,
      );
    }
  }

  if (!defaultLangEn) {
    const newLang = new Language({
      _id: new ObjectId('606b64ba679e4903d47fa002'),
      code: 2,
      name: 'en',
      active: true,
      deleted: false,
    });

    try {
      await newLang.save();
    } catch (error) {
      console.log(
        `Error In System Default While Creating Default English Language ${error}`,
      );
    }
  }

  const developerDefaultUser = {
    name: process.env.DEVELOPER_USERNAME,
  };
  const defaultDevUser = await User.findOne(developerDefaultUser);

  if (!defaultDevUser) {
    const hashedPassword = await hashPassword({
      password: String(process.env.DEVELOPER_PASSWORD),
    });
    const routesList = ['users', 'routes', 'permissions', 'branches'];
    const permissionsList = [
      'addUser',
      'updateUser',
      'deleteUser',
      'addRoute',
      'updateRoute',
      'deleteRoute',
      'addPermission',
      'updatePermission',
      'deletePermission',
    ];

    const newUser = new User({
      _id: new ObjectId('606b64ba679e4903d47ab001'),
      languageId: new ObjectId('606b64ba679e4903d47fa001'),
      password: hashedPassword.newHashedPassword,
      name: 'developer',
      mobile: '21002627613',
      email: 'admin@admin.com',
      routesList,
      permissionsList,
      active: true,
      isDeveloper: true,
      deleted: false,
    });

    const todoRoute = ['todos', 'branches'];
    const todoPermissions = [
      'addTodo',
      'updateTodo',
      'deleteTodo',
      'addBranch',
      'updateBranch',
      'deleteBranch',
    ];
    const createUser = new User({
      languageId: new ObjectId('606b64ba679e4903d47fa001'),
      password: hashedPassword.newHashedPassword,
      name: 'baher hamed',
      mobile: '21001185518',
      email: 'baher@admin.com',
      routesList: routesList.concat(todoRoute),
      permissionsList: permissionsList.concat(todoPermissions),
      active: true,
      isDeveloper: false,
      deleted: false,
    });
    try {
      await newUser.save();
      await createUser.save();
    } catch (error) {
      console.log(
        `Error In System Default While Creating Default Developer User ${error}`,
      );
    }
  }

  const usersRoute = await Route.findOne({
    name: 'users',
  });

  if (!usersRoute) {
    const newRoute = new Route({
      _id: new ObjectId('606b64ba679e4903d47ab001'),
      name: 'users',
      en: 'Users',
      ar: 'المستخدمين',
      active: true,
      deleted: false,
    });

    try {
      await newRoute.save();
    } catch (error) {
      console.log(
        `Error In System Default While Creating Users Route ${error}`,
      );
    }

    const addUserPermission = new Permission({
      routeId: newRoute._id,
      name: 'addUser',
      en: 'Add User',
      ar: 'إضافة مستخدم',
      active: true,
      deleted: false,
    });

    await addUserPermission.save();

    const updateUserPermission = new Permission({
      routeId: newRoute._id,
      name: 'updateUser',
      en: 'Update User',
      ar: 'تعديل مستخدم',
      active: true,
      deleted: false,
    });

    await updateUserPermission.save();

    const deleteUserPermission = new Permission({
      routeId: newRoute._id,
      name: 'deleteUser',
      en: 'Delete User',
      ar: 'حذف مستخدم',
      active: true,
      deleted: false,
    });

    await deleteUserPermission.save();

    const exportUsersPermission = new Permission({
      routeId: newRoute._id,
      name: 'exportUsers',
      en: 'Export Users',
      ar: 'تصدير المستخدمين للأكسل',
      active: true,
      deleted: false,
    });

    await exportUsersPermission.save();
  }
})();
