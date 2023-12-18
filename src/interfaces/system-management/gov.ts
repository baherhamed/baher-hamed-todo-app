import mongoose, {
  Schema,
  Document,
  PaginateModel,
  PaginateOptions,
} from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';

import { inputsLength } from '../../shared/inputs-length';

interface IGov extends Document {
  name: string;
  code: string;
  active: boolean;
  deleted: boolean;
  addInfo: unknown;
  lastUpdateInfo: unknown;
  deletedInfo: unknown;
}

const GovSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Enter Gov Name'],
      minlength: inputsLength.govName,
      trim: true,
      lowercase: true,
    },
    code: {
      type: String,
      required: [true, 'Please Enter Gov Code'],
      minlength: inputsLength.govCode,
      trim: true,
    },
    active: {
      type: Boolean,
      required: [true, 'Please Enter Gov State'],
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

GovSchema.plugin(paginate);
GovSchema.plugin(autopopulate);

export const Gov = mongoose.model<IGov, PaginateModel<IGov>, PaginateOptions>(
  'govs',
  GovSchema,
);
