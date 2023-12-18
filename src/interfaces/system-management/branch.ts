import mongoose, {
  Schema,
  Document,
  PaginateModel,
  PaginateOptions,
} from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';

import { inputsLength } from '../../shared/inputs-length';

interface IBranch extends Document {
  name: string;
  code: string;
  active: boolean;
  deleted: boolean;
  addInfo: unknown;
  lastUpdateInfo: unknown;
  deletedInfo: unknown;
}

const BranchSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Enter Branch Name'],
      minlength: inputsLength.branchName,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Please Enter Branch Code'],
      minlength: 1,
      trim: true,
    },
    active: {
      type: Boolean,
      required: [true, 'Please Enter Branch State'],
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

BranchSchema.plugin(paginate);
BranchSchema.plugin(autopopulate);

export const Branch = mongoose.model<
  IBranch,
  PaginateModel<IBranch>,
  PaginateOptions
>('branches', BranchSchema);
