export const site = {
  language: {
    ar: 'ar',
    en: 'en',
  },
  route: 'localhost',
  api: '/api/',
  modules: {
    security: 'security/',
    systemManagement: 'systemManagement/',
  },
  appsRoutes: {
    login: 'login',
    add: 'add',
    update: 'update',
    search: 'search',
    delete: 'delete',
    getAll: 'getAll',
    getActive: 'getActive',
    getCitiesByGov: 'getCitiesByGov',
    changePassword: 'changePassword',
    getTodoByUser: 'getTodoByUser',
  },
  apps: {
    home: 'home',
    login: 'login',
    languages: 'languages/',
    routes: 'routes/',
    users: 'users/',
    govs: 'govs/',
    cities: 'cities/',
    todos: 'todos/',
    branches: 'branches/',
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagination: (result: any) => {
    return {
      totalDocs: result.totalDocs,
      limit: result.limit,
      totalPages: result.totalPages,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
    };
  },
};
