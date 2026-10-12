import { cloneDeep } from 'lodash-es';

export default function clone(obj: any) {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return cloneDeep(obj);
}
