import mongoose, {
  Schema,
  Document,
  PaginateModel,
  PaginateOptions,
} from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';

import { inputsLength } from '../../shared/inputs-length';
interface ILanguage extends Document {
  name: string;
  active: boolean;
  deleted: boolean;
  addInfo: unknown;
  lastUpdateInfo: unknown;
  deletedInfo: unknown;
}

const LanguageSchema = new Schema(
  {
    code: {
      type: Number,
      required: [true, 'Please Enter Language Code'],
    },
    name: {
      type: String,
      required: [true, 'Please Enter Language Name'],
      minlength: inputsLength.language,
      trim: true,
      lowercase: true,
    },
    active: {
      type: Boolean,
      required: [true, 'Please Enter Language State'],
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

LanguageSchema.plugin(paginate);
LanguageSchema.plugin(autopopulate);

export const Language = mongoose.model<
  ILanguage,
  PaginateModel<ILanguage>,
  PaginateOptions
>('languages', LanguageSchema);
