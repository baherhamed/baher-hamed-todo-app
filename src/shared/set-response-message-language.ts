import { site } from '.';

interface Message {
  ar: string;
  en: string;
}
export const responseLanguage = async (
  requestLanguage: string,
  message: Message,
  err?: string,
) => {
  let responseMessage;
  let errorMessage = '';
  if (err) {
    errorMessage = err;
  }
  if (requestLanguage === site.language.ar) {
    responseMessage = `${message.ar}${errorMessage}`;
  } else if (requestLanguage === site.language.en) {
    responseMessage = `${message.en}${errorMessage}`;
  }
  return responseMessage;
};
