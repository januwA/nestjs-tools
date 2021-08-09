import * as _ from 'lodash';

export function createType(typeof_type: string): string {
  let type: string;
  if (_.isInteger(typeof_type)) {
    type = 'Number';
  } else if (_.isString(typeof_type)) {
    type = 'String';
  } else if (_.isBoolean(typeof_type)) {
    type = 'Boolean';
  } else {
    // 把其它转化为空的字符串
    type = '';
  }
  return type;
}
