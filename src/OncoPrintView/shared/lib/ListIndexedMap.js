import _ from 'lodash';
function getFolderKey(key) {
  return key.join(',');
}
export default class ListIndexedMap {
  constructor() {
    this.map = {};
  }
  entries() {
    const ret = [];
    for (const folderKey of Object.keys(this.map)) {
      for (const entry of this.map[folderKey]) {
        ret.push(entry);
      }
    }
    return ret;
  }
  set(value, ...key) {
    // returns true if an entry was added, false if entry already present and modified
    const entry = this.getEntry(key);
    if (!entry) {
      this.getFolder(key).push({ key, value });
      return true;
    } else {
      entry.value = value;
      return false;
    }
  }
  get(...key) {
    const entry = this.getEntry(key);
    if (!entry) {
      return undefined;
    } else {
      return entry.value;
    }
  }
  has(...key) {
    return !!this.getEntry(key);
  }
  static from(objs, key) {
    const map = new ListIndexedMap();
    for (const o of objs) {
      map.set(o, ...key(o));
    }
    return map;
  }
  getEntry(key) {
    return this.getFolder(key).find((entry) => _.isEqual(entry.key, key));
  }
  getFolder(key) {
    const folderKey = getFolderKey(key);
    this.map[folderKey] = this.map[folderKey] || [];
    return this.map[folderKey];
  }
}
export class ListIndexedSet {
  constructor() {
    this.map = new ListIndexedMap();
  }
  static from(objs, key) {
    const set = new ListIndexedSet();
    for (const o of objs) {
      set.add(...key(o));
    }
    return set;
  }
  add(...key) {
    this.map.set(true, ...key);
  }
  delete(...key) {
    this.map.set(false, ...key);
  }
  has(...key) {
    return !!this.map.get(...key);
  }
  clear() {
    this.map = new ListIndexedMap();
  }
}
export class StringListIndexedMap extends ListIndexedMap {}
export class ListIndexedMapOfCounts extends ListIndexedMap {
  increment(...key) {
    if (this.has(...key)) {
      this.set(this.get(...key) + 1, ...key);
    } else {
      this.set(1, ...key);
    }
  }
}
