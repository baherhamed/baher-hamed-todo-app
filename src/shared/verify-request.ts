import { Request, Response } from 'express';
import { User } from '../interfaces';

import jwt, { JwtPayload } from 'jsonwebtoken';

import browser from 'browser-detect';
import { responseLanguage, responseMessages, setRequestLanguage } from '.';
import isJwtTokenExpired from 'jwt-check-expiry';
import { Types } from 'mongoose';

interface RequestInfo {
  browser: {
    name: string | undefined;
    version: string | undefined;
    mobile: boolean | undefined;
  };
  os: {
    name: string | undefined;
  };
  ip_address: string | undefined;
  userId: Types.ObjectId;
  branchId: Types.ObjectId;
  language: string;
  date: Date;
  isAdmin?: boolean;
  isDeveloper?: boolean;
}
export const verifyJwtToken = async function (
  req: Request,
  res: Response,
  next: () => void,
) {
  const language = await setRequestLanguage(req);

  try {
    const ip = req.ip.split('fff:');
    const ua = req.headers['user-agent'];
    const ip_address = ip[1];
    if (!req.headers.authorization) {
      const message = await responseLanguage(
        language,
        responseMessages.authorizationData,
      );
      return res.send({
        success: false,
        message,
      });
    }

    if (!ua) {
      const message = await responseLanguage(
        language,
        responseMessages.userAgentData,
      );
      return res.send({
        success: false,
        message,
      });
    }

    try {
      // console.log('req', req);

      const token = req.headers['authorization'];
      const jwtPayload = token.split('Bearer ')[1];
      const isExpired = isJwtTokenExpired(jwtPayload);

      const decoded = jwt.verify(
        jwtPayload,
        String(process.env.ACCESS_TOKEN_SECRET),
      ) as JwtPayload;
      //  what happed when token not expired

      if (isExpired) {
        const message = await responseLanguage(
          language,
          responseMessages.authorizationData,
        );
        return res
          .send({
            success: false,
            message,
          })
          .status(401);
      }

      if (!isExpired && decoded) {
        const request_browser = browser(req.headers['user-agent']);
        const selectedUser = await User.findOne({
          _id: decoded.userId,
          active: true,
          deleted: false,
        });

        let isAdmin = false;
        if (selectedUser?.isAdmin) {
          isAdmin = true;
        }
        if (selectedUser) {
          const requestInfo: RequestInfo = {
            browser: {
              name: request_browser.name,
              version: request_browser.version,
              mobile: request_browser.mobile,
            },
            os: {
              name: request_browser.os,
            },
            ip_address,
            userId: Object(selectedUser)?._id,
            branchId: Object(selectedUser)?.branchId,
            language,
            date: new Date(),
            isAdmin,
          };

          req.body['requestInfo'] = requestInfo;
          next();
        } else {
          const message = await responseLanguage(
            language,
            responseMessages.authorizationData,
          );
          return res
            .send({
              success: false,
              message,
            })
            .status(401);
        }
      }
    } catch (error) {
      console.log(`Verify Request => No Authorization ${error}`);
      const message = await responseLanguage(
        language,
        responseMessages.authorizationData,
      );
      return res
        .send({
          success: false,
          message,
        })
        .status(401);
    }
  } catch (error) {
    console.log(`Verify Request ${error}`);
  }
};
