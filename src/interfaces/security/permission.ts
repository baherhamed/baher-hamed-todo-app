import mongoose, {
  Types,
  Document,
  PaginateModel,
  PaginateOptions,
  Schema,
} from 'mongoose';

import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';

import { inputsLength } from '../../shared';

interface IPermission extends Document {
  routeId: Types.ObjectId;
  name: string;
  ar: string;
  en: string;
  active: boolean;
  deleted: boolean;
  addInfo: unknown;
  lastUpdateInfo: unknown;
  deletedInfo: unknown;
}

const PermissionSchema = new Schema(
  {
    routeId: {
      type: Types.ObjectId,
      ref: 'routes',
      autopopulate: {
        select: 'name ar en active deleted',
      },
    },
    name: {
      type: String,
      required: [true, 'Please Enter Permission Name'],
      minlength: inputsLength.permissionName,
      trim: true,
    },
    ar: {
      type: String,
      required: [true, 'Please Enter Permission Arabic Name'],
      minlength: inputsLength.permissionName,
      trim: true,
    },
    en: {
      type: String,
      required: [true, 'Please Enter Permission English Name'],
      minlength: inputsLength.permissionName,
      trim: true,
    },
    active: {
      type: Boolean,
      required: [true, 'Please Enter Permission Status'],
      default: true,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    addInfo: {},
    lastUpdateInfo: {},
    deleteInfo: {},
  },
  {
    versionKey: false,
  },
);
PermissionSchema.plugin(paginate);
PermissionSchema.plugin(autopopulate);

export const Permission = mongoose.model<
  IPermission,
  PaginateModel<IPermission>,
  PaginateOptions
>('permissions', PermissionSchema);
