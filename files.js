import {Icons, Icon} from "./Icons.js";
function sanitizeKey(key) {
  return key;
}

function desanitizeKey(key) {
  return key;
}

function fromString(str, path = new Path()) {
  if (str instanceof Path || Array.isArray(str)) {
    for (let key of str) {
      path.push(key);
    }
  } else if (typeof str === "string" && str != "/") {
    let keys = str.split("/");
    for (let key of keys) {
      if (key != "") {
        path.push(sanitizeKey(key));
      }
    }
  }
}
const DEBUG = false;
function debug(){
  if (DEBUG) {
    console.log.apply(console, arguments);
  }
}

class Path extends Array{
  constructor(string){
    super();
    fromString(string, this);
  }

  add(key) {
    let copy = this.clone();
    copy.push(key);
    return copy;
  }

  clone() {
    let path = new Path();
    for (let i of this.indecies) {
      path.push(this[i]);
    }

    return path;
  }

  contains(p2) {
    let res = false;
    if (this.length <= p2.length) {
      res = true;
      for (let i of this.indecies) {
        if (this[i] != p2[i]) {
          res = false;
          break;
        }
      }
    } else if (this.length - 1 == p2.length) {
      res = true;
      for (let i of p2.indecies) {
        if (this[i] != p2[i]) {
          res = false;
        }
      }
    }

    return res;
  }

  equal(p2) {
    if (p2.length == this.length) {
      for (let i of this.indecies) {
        if (this[i] != p2[i]) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  get key(){
    if (this.length > 0) {
      return this[this.length - 1];
    }
    return "/";
  }

  get root(){
    if (this.length > 0) {
      return this[0];
    }
    return "/"
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

  //  Standard methods (use set and get methods)
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
    path.push(name);
    this.set(path, obj);

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

      return path;
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
    let type = "file"
    if (this.isDirectory(path)) {
      type = "folder"
    }
    return type;
  }

  //  get Icon returns the icon of a given path as an object of the Element class.
  //  e.g. an SVGElement or an Image
  //  default: Uses imported icon dictionary and path type
  getIcon(path) {
    let icon = document.createElement("DIV");
    let text = document.createElement("DIV");
    text.innerHTML = this.getTitle(path);
    icon.appendChild(text);
    icon.appendChild(new Icon(this.getType(path)));
    return icon
  }

  //  get Title returns the title of a given path
  //  default: the final key of the path
  getTitle(path) {
    return new Path(path).key;
  }

  //  get Children Keys return the children keys of a given path.
  //  default: all keys at the path that are not in the childrenFilter set
  //           otherwise an empty array is returned.
  getChildrenKeys(path) {
    let keys = new Set();
    if (this.isDirectory(path)) {
      let filter = this.childrenFilter;
      if (Array.isArray(filter)) {
        filter = new Set(filter);
      } else if (!(filter instanceof Set)){
        filter = new Set();
      }

      let obj = this.get(path);
      if (typeof obj === "object" && obj !== null) {
        for (let key in obj) {
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
  //  defulat: if the path value is a string
  isDirectory(path) {
    return typeof this.get(path) === "string";
  }

  getValuesByType(type, startPath = new Path()) {
    startPath = new Path(startPath);
    let values = [];
    let recurse = (path, md = 20) => {
      if (md < 0) {
        throw "max recursion"
      }
      md--;

      let keys = this.getChildrenKeys(path);
      for (let key of keys) {
        recurse(path.add(key), md);
      }

      let ntype = this.getType(path);
      if (ntype == type) {
        let data = this.get(path);
        data.name = path.key;
        data.path = path + "";
        values.push(data)
      }
    }
    recurse(startPath);
    return values;
  }
}

export {Files, Path}
