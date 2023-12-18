import * as bcrypt from 'bcrypt';
interface SelectedUser {
  password: string;
}
export const hashPassword = async (user: SelectedUser) => {
  let success = false;
  if (user && !user.password) {
    return {
      success,
    };
  }

  const password = user.password;
  const saltRounds = 10;

  const hashedPassword = await new Promise((resolve, reject) => {
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) reject(err);
      resolve(hash);
    });
  });
  success = true;
  return {
    success,
    newHashedPassword: hashedPassword,
  };
};
