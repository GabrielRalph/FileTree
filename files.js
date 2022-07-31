import {Icons, Icon} from "./Icons.js";
function sanitizeKey(key) {
  return key;
}

function desanitizeKey(key) {
  return key;
}

function fromString(str, path = new Path()) {
  if (str instanceof Path) {
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
    return "";
  }

  get root(){
    return this[0];
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

    return str;
  }
}

class Files {
  constructor(data){
    this.data = data
  }

  // data functions
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

    return data;
  }

  set(path, value) {
    console.log("SET " + path + ": "+ value);
    console.log(value);
    path = new Path(path);
    if (path.isRoot) {
      this.data = value;
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

  // // user functions
  delete(path) {
    this.set(path, null);
    path.pop();
    return path;
  }
  //
  rename(path, name) {
    let obj = this.get(path);
    path = new Path(path);

    this.set(path, null);
    path.pop();
    path.push(name);
    this.set(path, obj);

    return path;
  }

  swappable(path, oldpath) {
    path = new Path(path);
    oldpath = new Path(oldpath);

    return !oldpath.contains(path) && this.isDirectory(path);
  }

  swap(path, oldpath) {
    if (this.swappable(path, oldpath)) {
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


  getIcon(path) {
    return new Icon(this.getType(path));
  }

  getType(path) {
    let type = "file"
    if (this.isDirectory(path)) {
      type = "folder"
    }
    return type;
  }

  getChildrenKeys(path) {
    let obj = this.get(path);
    if (typeof obj === "object" && obj !== null)
      return Object.keys(obj);
    else return null;
  }

  isDirectory(path) {
    return this.getChildrenKeys(path) !== null;
  }
}

export {Files, Path}
