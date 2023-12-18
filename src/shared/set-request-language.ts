import { Request } from 'express';
export const setRequestLanguage = async (req: Request) => {
  let requestLanguage = 'en';

  if (req.acceptsLanguages()[0] !== '*') {
    requestLanguage = req.acceptsLanguages()[0];
  } else {
    requestLanguage;
  }

  return requestLanguage.toLowerCase();
};
