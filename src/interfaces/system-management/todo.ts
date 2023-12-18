import mongoose, {
  Schema,
  Document,
  PaginateModel,
  PaginateOptions,
  Types,
} from 'mongoose';
import paginate from 'mongoose-paginate-v2';
import autopopulate from 'mongoose-autopopulate';

import { inputsLength } from '../../shared/inputs-length';

interface ITodo extends Document {
  userId: Types.ObjectId;
  todo: string;
  active: boolean;
  deleted: boolean;
  addInfo: unknown;
  lastUpdateInfo: unknown;
  deletedInfo: unknown;
}

const TodoSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'users',
      autopopulate: {
        select: '  name active deleted isDeveloper ',
      },
      required: [true, 'Please Select User'],
    },
    todo: {
      type: String,
      required: [true, 'Please Enter Todo'],
      minlength: inputsLength.todoName,
      trim: true,
    },
    active: {
      type: Boolean,
      required: [true, 'Please Enter Todo State'],
      default:true
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

TodoSchema.plugin(paginate);
TodoSchema.plugin(autopopulate);

export const Todo = mongoose.model<
  ITodo,
  PaginateModel<ITodo>,
  PaginateOptions
>('todos', TodoSchema);
