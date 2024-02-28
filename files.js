import {Icons, Icon} from "./Icons.js";
function sanitizeKey(key) {
  return key;
}

function desanitizeKey(key) {
  return key;
}

function getPathKeys(str) {
  let keys = [];
  if (typeof str === "string" && str !== "/") {
    str = str.split("/");
    for (let key of str) {
      if (typeof key === "string" && key.length > 0) {
        keys.push(sanitizeKey(key));
      }
    }
  } else if (Array.isArray(str)) {
    for (let key of str) {
      if (typeof key === "string" && key.length > 0) {
        if (!key.match("/")) {
          keys.push(key);
        }
      }
    }
  } else if (str instanceof Path) {
    for (let key of str) {
      keys.push(key);
    }
  }

  return keys;
}

const DEBUG = false;
function debug(){
  if (DEBUG) {
    console.log.apply(console, arguments);
  }
}

class Path {
  constructor(string){
    let Keys = getPathKeys(string);
    this.getLength = () => {
      return Keys.length;
    }
    this.getKey = () => {
      if (Keys.length > 0) {
        return Keys[Keys.length - 1];
      }
      return "/"
    }
    this.getRoot = () => {
      if (Keys.length > 0) {
        return Keys[0];
      }
      return "/"
    }

    this.push = (path) => {
      let keys = getPathKeys(path);
      for (let key of keys) {
        Keys.push(key);
      }
    }
    this.unshift = (path) => {
      let keys = getPathKeys(path);
      for (let i = keys.length - 1; i >= 0; i--) {
        Keys.unshift(keys[i]);
      }
    }
    this.pop = () => {
      return Keys.pop();
    }
    this.shift = () => {
      return Keys.shift();
    }

    this.get = (i) => {
      let key = null;
      try {key = Keys[i]} catch(e) {key = null};
      return key;
    }

    this[Symbol.iterator] = function * (){
      for (let key of Keys) {
        yield key;
      }
    }
  }

  get length(){ return this.getLength()}

  add(key) {
    let copy = this.clone();
    copy.push(key);
    return copy;
  }

  clone() {
    let path = new Path(this);
    return path;
  }

  contains(p2) {
    let res = false;
    if (p2 instanceof Path) {
      if (this.length <= p2.length) {
        res = true;
        for (let i of this.indecies) {
          if (this.get(i) != p2.get(i)) {
            res = false;
            break;
          }
        }
      } else if (this.length - 1 == p2.length) {
        res = true;
        for (let i of p2.indecies) {
          if (this.get(i) != p2.get(i)) {
            res = false;
          }
        }
      }
    }

    return res;
  }

  equal(p2) {
    if (!(p2 instanceof Path)) p2 = new Path(p2);

    if (p2.length == this.length) {
      for (let i of this.indecies) {
        if (this.get(i) != p2.get(i)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  get key(){
    return this.getKey();
  }

  get root(){
    return this.getRoot();;
  }

  get isRoot() {
    return this.length == 0;
  }

  get indecies(){
    let i = 0;
    let n = this.length;
    const itter = {
      *[Symbol.iterator]() {
        while (i < n) {
          yield i;
          i++;
        }
      }
    }
    return itter;
  }

  toString(){
    let str = "";
    for (let key of this) {
      if (str.length > 0) str += "/"
      str += desanitizeKey(key);
    }
    if (this.isRoot) str = "/"

    return str;
  }
}

class Files {
  constructor(data = {}){
    this.data = data
  }

  validatePath(path) {
    path = new Path(path)
    let validPath = new Path();
    let data = this.data;
    for (let key of path) {
      let valid = false;
      if (key in data) {
        let path = validPath.add(key);
        if (this.typeOf(data[key], path) != null) {
          data = data[key];
          validPath = path;
          valid = true;
        }
      }

      if (!valid) break;
    }
    return validPath;
  }

  set data(value) {
    if (typeof value !== "object" || value === null) {
      value = {};
    }
    this._data = value;
  }
  get data(){
    return this._data;
  }

  //  Required data retreive and set methods
  get(path) {
    path = new Path(path);
    let data = this.data;
    if (!path.isRoot) {
      for (let key of path) {
        if (key in data) data = data[key];
        else {
          data = null;
          break;
        }
      }
    }
    if (typeof data === "object" && data !== null) {
      data = { ...data }
    }
    return data;
  }
  set(path, value) {
    debug("SET " + path + ": "+ value);
    debug("before", path.isRoot, path);
    path = new Path(path);
    if (path.isRoot) {
      if (value != null) {
        this.data = value;
      } else {
        this.data = {}
      }
    } else {
      let data = this.data;
      let valueKey = path.pop();
      // console.log(path);
      for (let key of path) {
        if (!(key in data)) data[key] = {};
        data = data[key];
      }

      if (value == null) {
        delete data[valueKey];
      } else {
        data[valueKey] = value;
      }
    }
  }
  update(path, value) {
    if (typeof value === "object" && value !== null) {
      let node = this.get(path);

      let data = this.data;
      if (!path.isRoot) {
        for (let key of path) {
          if (!(key in data)) data[key] = {}
          data = data[key];
        }
      }

      //apply update
      for (let key in value) {
        node[key] = value[key];
      }
    }
  }

  //  Standard methods (extensions of set and get methods)
  delete(path) {
    this.set(path, null);
    path.pop();
    return path;
  }
  rename(path, name) {
    let obj = this.get(path);
    path = new Path(path);

    this.set(path, null);
    path.pop();
    if (name !== "" && name !== null) {
      path.push(name);
      this.set(path, obj);
    }

    return path;
  }

  move(path, oldpath) {
    if (this.moveable(path, oldpath)) {
      path = new Path(path);
      oldpath = new Path(oldpath);

      let value = this.get(oldpath);
      this.set(oldpath, null);
      path.push(oldpath.key);
      this.set(path, value);

      return path
    }

    return null;
  }

  //  OVERWRITTABLE can be overwritten for more functionality

  //  moveable returns a boolean representing whether one path
  //  and its contents can be moved to the location of another path
  //  default: no; recursive moves, moves to non directories
  //           and moves that cause double entries
  moveable(path, oldpath) {
    path = new Path(path);
    oldpath = new Path(oldpath);
    let is_directory = this.isDirectory(path);
    let is_recursive = oldpath.contains(path);
    let is_double_entry = this.getChildrenKeys(path).has(oldpath.key);


    return is_directory && !is_recursive && !is_double_entry;
  }

  //  get type returns the type of a given path as a string.
  //  default: "folder" if it is a directory otherwise "file"
  getType(path) {
    return this.typeOf(this.get(path), path);
  }
  typeOf(node, path) {
    let type = null;
    if (typeof node === "string") type = "file";
    else if (typeof node === "object") type = "folder";
    return type;
  }


  //  get Icon returns the icon of a given path as an object of the Element class.
  //  e.g. an SVGElement or an Image
  //  default: Uses imported icon dictionary and path type
  getIcon(path) {
    let icon = document.createElement("DIV");
    let text = document.createElement("DIV");
    text.innerHTML = path.key;
    icon.appendChild(text);
    icon.appendChild(new Icon(this.getType(path)));
    return icon
  }

  //  get Children Keys return the children keys of a given path.
  //  default: all keys at the path that are not in the childrenFilter set
  //           otherwise an empty array is returned.
  getChildrenKeys(path) {
    let data = this.get(path);
    return this.childrenKeysOf(data, path);
  }
  childrenKeysOf(object, path){
    let keys = new Set();
    let type = this.typeOf(object, path);
    if (type in this.directoryTypes) {
      let filter = this.childrenFilter;
      if (Array.isArray(filter)) {
        filter = new Set(filter);
      } else if (!(filter instanceof Set)){
        filter = new Set();
      }

      if (typeof object === "object" && object !== null) {
        for (let key in object) {
          if (!filter.has(key)) {
            keys.add(key);
          }
        }
      }
    }
    return keys;
  }

  //  is Directory returns a boolean representing whether the path is to
  //  a directory
  //  defulat: if the path value is a object
  isDirectory(path) {
    let type = this.getType(path);
    return type in this.directoryTypes;
  }


  get directoryTypes(){
    return {
      "folder": true
    }
  }


  getValuesByType(type, startPath = new Path()) {

    let values = [];
    let recurse = (node, path = new Path()) => {
      if (path.length > 50)throw "max recursion"
      let ntype = this.typeOf(node, path);
      if (ntype in this.directoryTypes) {
        let keys = this.childrenKeysOf(node, path);
        for (let key of keys) {
          recurse(node[key], path.add(key));
        }
      }

      if (ntype == type) {
        node.name = path.key;
        node.path = path + "";
        values.push(node)
      }
    }
    let startNode = this.get(startPath);
    startPath = new Path(startPath);
    // console.log(startNode);
    recurse(startNode, startPath);
    return values;
  }
}

export {Files, Path}
