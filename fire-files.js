import {SvgPlus, Vector} from "./4.js"

const TEST = {
  "Tests": {
    "TEST": "0",
    "for real": "1",
<<<<<<< HEAD
=======
    "ffff": {}
>>>>>>> 072dc80f35d1b0790a440a8d590fdaab35308173
  },
  "AMME3500": {
    "Problem Set": {
      "pset 3": "-MyBrDQ1yDy5HSI7mZ35",
      "pset 4": "-MyjDAdNn95GnoSaCPkp",
      "pset 5": "-MzJh7KYaW81o_hT4dX2",
      "pset 6": "-MzrCrxcUJNsED5jgEqB",
      "pset 7": "-N-QxAk8N2a0umzlWexh",
    },
    "A1": "-MzDmufHrLL-EehFi5-l",
    "lab 2": "-Myo9etMTKSA_EVrlAF2",
    "lab 3": "-N-VbYf9wAttaLHUjJBd",
  },
  "COMP3027": {
    "A1": "-MyKGWeBzJbRx2h1mgQA",
    "A2": "-N-5Yxc6w9xF3vXAJB4J",
  },
  "Math Notes": {
    "quaternion rotations": "-N-ffQzR2ODEzUnMAA20",
    "matrix notes": "-Mzr7GVSxx4tB9yCCOqF",
  },
  "week5": "-MzMooVn7b6VDliNuyj-",

}

function clean(str){
  str = str.replace(/^\s+/, "")
  str = str.replace(/\s+$/, "")
  return str;
}

function is() {
  let n = arguments.length;
  let obj = arguments[0];
  for (let i = 1; i < n; i++) {
    if (SvgPlus.is(obj, arguments[i])) {
      return true;
    }
  }
  return false;
}

const tick = "./FileTree/icons/tick.svg";
const cross = "./FileTree/icons/cross.svg";
const folder = "./FileTree/icons/folder.svg";
const file = "./FileTree/icons/file.svg";

class Buttons extends SvgPlus {
  constructor() {
    super("div");
  }

  set show(list) {
    for (let key in this.list) {
      this[key].styles = {"display": "none"};
    }
    for (let key in list) {
      this[key].styles = {"display": (list[key] ? "" : "none")};
    }
  }

  set list(list){
    for (let name in this.list)  {
      delete this[name]
    }
    this.innerHTML = "";
    for (let name in list) {
      this[name] = this.createChild("div", {content: name});
      this[name].onclick = (e) => list[name](e);
      this[name].styles = {"display": "none"};
    }
    this._list = list;
  }
  get list() {
    return this._list;
  }
}


class ContextMenu extends SvgPlus {
  constructor(files) {
    super("div");
    this.class = "ctx-menu"
    this.files = files;
    this.offset = new Vector(15, 15);

    let lastE = null;
    window.addEventListener("mousemove", (e) => {
      let targets = getTargets(e, [ContextMenu, Files]);
      this.over = !!targets.ContextMenu;
      lastE = targets.Files ? e : null;
    })
    window.addEventListener("mousedown", (e) => {
      let targets = getTargets(e, [Files]);
      lastE = targets.Files ? e : null;
    })

    window.addEventListener("keydown", (e) => {
      let targets = getTargets(e, [ContextMenu]);
      if (!targets.ContextMenu && lastE && !this.over) {
        let isFile = this.files.isLeaf();
        let isRoot = this.files.path.root == this.files.path.key;
        let show = false;
        if (e.key == "a" && !isFile) {
          this.show();
          this.add();
          show = true;
        } else if (e.key == "r" && !isRoot) {
          this.show();
          this.rename();
          show = true;
        } else if (e.key == "d" && !isRoot) {
          this.show();
          this.delete();
          show = true;
        } else if (e.key == "o" && isFile) {
          this.open();
        }
        if (show) {
          e.preventDefault();
          this.pos = lastE;
        }
      }
    })

    files.addEventListener("contextmenu", (e) => {
      files.pointClick(e, false);
      this.over = true;
      this.pos = e;
      this.show();
      e.preventDefault();
    })

    this.hidden = true;

    this.buttons = this.createChild(Buttons)
    this.buttons.list = {
      add: (e) => this.add(e),
      open: (e) => this.open(e),
      rename: (e) => this.rename(e),
      delete: (e) => this.delete(e),
    }
    this.buttons.class = "menu";

    let input = this.createChild("div", {class: "input"});
    let rel = input.createChild("div");
    this.input = rel.createChild("input");
    this.tick = rel.createChild("img", {src: tick})
    this.cross = rel.createChild("img", {src: cross});


    this.modes = {
      "menu": this.buttons,
      "input": input,
    }
    this.mode = "menu"

  }

  set mode (m) {
    for (let mode in this.modes) {
      if (mode == m) {
        this.modes[m].styles = {"display": "block"};
      } else {
        this.modes[mode].styles = {"display": "none"};
      }
    }
    this.resize();
  }

  open(){
    this.files.open();
  }

  delete(e){
    this.stopInteractionWatcher();
    this.input.styles = {"display": "none"};

    this.tick.onclick = () => {
      this.files.delete(this.files.path);
      this.hide();
    }

    this.pos = e;
    this.mode = "input";
  }

  add(e){
    this.stopInteractionWatcher();
    this.input.styles = {display: ""};

    let tick = this.tick;
    let cross = this.cross;

    let add = (type) => {
      if (this.input.valid) {
        if (type == "file") {
          this.files.addFile(this.files.path, this.input.value);
        } else {
          this.files.add(this.files.path, this.input.value, {});
        }
        this.hide();
      }
    }

    tick.onclick = (e) => {
      if (this.input.valid) {
        tick.props = {src: folder}
        cross.props = {src: file}
        this.input.styles = {"display": "none"}

        this.pos = e;
        this.resize();

        tick.onclick = () => add("folder");
        cross.onclick = () => add("file");
      }
    }

    let shift = false;
    this.input.onkeydown = (e) => {
      if (this.input.lastKey == "Shift") shift = false;
      if (e.key == "Shift") shift = true;
      if (e.key == "Enter") {
        add(shift ? "folder" : "file");
      }
    }

    this.makeInputValidator(this.files.path);
    this.pos = e;
    this.mode = "input";
    this.input.focus();
  }

  makeInputValidator(path, oldKey) {
    let obj = this.files.get(path);
    let validate = () => {
      let value = this.input.value;
      let valid = !(value in obj);
      if (oldKey) valid |= value == oldKey;
      this.input.valid = valid;
      this.tick.toggleAttribute("invalid", !valid);
    }



    this.input.onkeyup = (e) => {
      validate();
      this.input.lastKey = e.key
    }
    this.input.onchange = validate;

    if (oldKey) {
      this.input.value = oldKey;
    } else {
      this.input.value = "";
    }
  }

  rename(e){
    this.stopInteractionWatcher();
    this.input.styles = {display: ""};

    this.tick.onclick = () => {
      if (this.input.valid) {
        this.files.rename(this.files.path, this.input.value);
        this.hide();
      }
    }

    this.input.onkeydown = (e) => {
      if (e.key === "Enter" && this.input.valid) {
        this.files.rename(this.files.path, this.input.value);
        this.hide();
      }
    }

    let path = this.files.path;
    let key = path.pop();
    this.makeInputValidator(path, key);

    this.mode = "input";
    this.pos = e;
    this.input.focus();
  }

  startInteractionWatcher(){
    this.intv_run = true;
    let intv = setInterval(() => {
      if (!this.over && this.intv_run) {
        this.hide();
      }
    }, 1000)
    this.intv = intv;
  }

  stopInteractionWatcher(){
    this.intv_run = false;
    clearInterval(this.intv);
  }

  menu(){
    let isFile = this.files.isLeaf();
    let isRoot = this.files.path.root == this.files.path.key;
    let show = {
      "add": !isFile,
      "open": isFile,
      "delete": !isRoot,
      "rename": !isRoot
    }

    this.buttons.show = show;
  }


  hide(){
    this.stopInteractionWatcher();
    this.hidden = true;
  }

  show(){
    this.tick.toggleAttribute("invalid", false);
    this.tick.props = {src: tick}
    this.cross.props = {src: cross}
    this.cross.onclick = () => this.hide();
    this.menu();
    this.mode = "menu"
    this.hidden = false;
    this.startInteractionWatcher();
  }

  set hidden(v) {
    this.styles = {
      display: v ? "none" : "block"
    }
  }

  resize(){
    window.requestAnimationFrame(() => {
      let pos = this.pos;
      if (pos) {
        let fbbox = this.files.getBoundingClientRect();
        let bbox = this.getBoundingClientRect();
        let min = new Vector(fbbox);
        let max = new Vector(fbbox.width, fbbox.height).add(min);
        let o = new Vector(bbox);
        let s = new Vector(bbox.width, bbox.height);
        let e = o.add(s);
        let offset = new Vector();
        if (s.x < min.x) offset.x = min.x - s.x;
        if (s.y < min.y) offset.y = min.y - s.y;
        if (e.x > max.x) offset.x = e.x - max.x;
        if (e.y > max.y) offset.y = e.y - max.y;
        this.pos = pos.sub(offset);
      }
    })
  }

  set pos(v) {
    v = new Vector(v);
    // v = v.sub(this.offset);
    let o = this.offset;
    this.styles = {
      position: "fixed",
      top: v.y + "px",
      left: v.x + "px",
      transform: `translate(${-o.x}%, ${-o.y}%)`
    }
    this._pos = v;
  }
  get pos(){
    if (this._pos) {
      return this._pos.clone();
    }
    return null;
  }
}

class Path extends Array{
  constructor(){
    super();
    for (let arg of arguments) {
      this.push(arg);
    }
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

  static sanitizeKey(key) {
    return key;
  }

  static desanitizeKey(key) {
    return key;
  }

  static fromString(str) {
    let keys = str.split("/");
    let path = new Path();
    for (let key of keys) {
      path.push(Path.desanitizeKey(key));
    }
  }

  toString(){
    let str = "";
    for (let key of this) {
      if (str.length > 0) str += "/"
      str += Path.sanitizeKey(key);
    }

    return str;
  }
}
// -------------------------------------------------- //

class FFNode extends SvgPlus {
  constructor(files) {
    super("div");
    this.files = files;
  }
  getPath() {}
  update() {}

  rename(name) {
    this.files.rename(this.path, name)
  }
  delete(){
    this.files.delete(this);
  }
  add(key, value) {
    this.files.add(this, key, value);
  }

  ondragover(e){
    if (this.getAttribute("drop-target") == "") {
      e.preventDefault();
    }
  }
  ondragleave(e){
    e.preventDefault();
  }

  get path() {return this.getPath();}
  set dropTarget(value) {
    this.toggleAttribute("drop-target", value);
  }
}

class FFIcon extends FFNode {
  constructor(files) {
    super(files);
    this.class = "ff-icon";

    files.addDragEvents(this);
    this.setAttribute("draggable", "true");
  }

  getPath(){
    let path = null;
    if (this.parentNode) {
      path = this.parentNode.path;
      path.push(this.key);
    }
    return path;
  }

  set key(value) {
    this._key = value;
    let type = this.files.getType(this);
    this.type = type;
    this.classList.add(type);
    this.innerHTML = this.files.TYPES[type].template(value);
  }
  get key(){
    return this._key;
  }

  set selected(value) {
    this.toggleAttribute("selected", value);
  }
  set dragging(value) {
    this.toggleAttribute("dragging", value)
  }
}

class Directory extends FFNode {
  constructor(key, files) {
    super(files);
    this.class = "directory";
    this.key = key;
  }

  update(selected){
    let lastSelected = null
    window.requestAnimationFrame(() => {
      let obj = this.files.get(this);
      this.innerHTML = "";
      for (let key in obj) {
        let icon = new FFIcon(this.files);
        this.appendChild(icon);
        icon.key = key;
        if (key == selected) {
          icon.selected = true;
          lastSelected = icon;
        }
      }
      this.sort_default();
    })

    this.select = (icon) => {
      if (lastSelected) {
        lastSelected.selected = false;
      }
      icon.selected = true;
      lastSelected = icon;
    }
  }

  sort(func = (a, b) => a.key > b.key ? 1 : -1){
    let c = [...this.children];
    c.sort(func);
    for (let el of c) {
      this.append(el);
    }
  }
  sort_default(){
    this.sort();
    this.sort((a, b) => {
      if (a.type == "file" && b.type == "folder"){
        return 1;
      } else if (a.type == "folder" && b.type == "file") {
        return -1;
      } else {
        return 0;
      }
    });
  }

  getPath() {
    let path = new Path();
    let node = this;
    while (node) {
      path.unshift(node.key);
      node = node.previousSibling;
    }
    return path;
  }
}

// -------------------------------------------------- //
function getTargets(e, classes = [FFIcon, Directory]){
  let node = e.target;
  let res = {}
  while (node) {
    let _classes = [];
    for (let cdef of classes) {
      if (SvgPlus.is(node, cdef)) {
        res[cdef.name] = node;
      } else {
        _classes.push(cdef);
      }
    }
    classes = _classes;
    node = node.parentNode;
  }

  return res;
}

function isID(v) {
  return typeof v === "string" || (typeof v === "number" && !Number.isNaN(v));
}
const TYPES = {
  folder: {
    is: (e) => {
    if (e === "empty") e = {};
    return (typeof e === "object" && e != null);
  },
    icon_src: folder,
    template: (name) => {
      return `${name} <img draggable = "false" src = "${folder}"/>`
    },
    dropTarget: true,
    leaf: false,
  },
  file: {
    is: (e) => {
    return isID(e);
  },
    icon_src: file,
    template: (name) => {
      return `${name} <img draggable = "false" src = "${file}"/>`
    },
    dropTarget: false,
    leaf: true,
  }
}

class Files extends SvgPlus{
  constructor(el){
    super(el);
    this.TYPES = TYPES;
    this._json = TEST;
  }

  onconnect(){
    let rel = this.createChild("div")
    this.files = rel.createChild("div", {class: "files"});
    let ctx = new ContextMenu(this);
    rel.appendChild(ctx);
    this.path = new Path("root");
    this.addEventListener("click", (e) => {
      let t = getTargets(e, [ContextMenu]);
      if (!t.ContextMenu) {
        ctx.hide();
        this.pointClick(e);
      }
    })

  }

  // click, drop and drag functionality
  getDropTarget(e, node) {
    let dropTarget = null;
    let oldPath = node.path;
    if (oldPath instanceof Path) {
      let el = document.elementFromPoint(e.x, e.y);
      let t = getTargets({target: el});

      // check for drop target is an icon
      if (t.FFIcon) {
        let type = this.getType(t.FFIcon);
        if (this.TYPES[type].dropTarget) {
          dropTarget = t.FFIcon;
        }
      }

      // if no valid drop target icon, use directory
      if (dropTarget == null) {
        if (t.Directory) {
          dropTarget = t.Directory;
        }
      }

      // check to see that the choosen dropTarget is valid
      if (dropTarget != null) {
        let newPath = dropTarget.path;
        if (!this.swappable(newPath, oldPath)) {
          dropTarget = null;
        }
      }
    }
    return dropTarget;
  }

  addDragEvents(dragSource){
    let lastDropTarget = null;

    dragSource.addEventListener("drag", (e) => {
      let dropTarget = this.getDropTarget(e, dragSource);

      if (lastDropTarget) {
        lastDropTarget.dropTarget = false;
        lastDropTarget = null;
      }

      if (dropTarget) {
        dropTarget.dropTarget = true;
        lastDropTarget = dropTarget;
      }
    })

    dragSource.addEventListener("dragstart", (e) => {
      let type = this.getType(dragSource);

      let img = new Image();
      img.src = this.TYPES[type].icon_src;
      e.dataTransfer.setDragImage(img, 30, 30);
      dragSource.dragging = true;
    })

    dragSource.addEventListener("dragend", (e) => {
      if (lastDropTarget) {
        this.swap(lastDropTarget.path, dragSource.path);
        lastDropTarget.dropTarget = false;
      }

      lastDropTarget = null;
      dragSource.dragging = false;
    })
  }

  pointClick(e, hide = true) {
    let targets = getTargets(e);
    let path = null;
    if (targets.FFIcon) {
      path = targets.FFIcon.path;

      if (hide && this.path.equal(path)) {
        if (path.length > 1) {
          path.pop();
        }
      }
    } else if (targets.Directory) {
      path = targets.Directory.path;
    }


    this.path = path;
  }

  // user functions
  delete(path = this.path) {
    if (is(path, FFNode)) path = path.path;
    this.set(path, null);
    path.pop();
    this.path = path;
  }

  rename(path, name) {
    let obj = this.get(path);
    this.set(path, null);
    path.pop();
    path.push(name);
    this.set(path, obj);
    this.path = path;
  }

  add(path, key, value) {
    if (is(path, FFIcon)) {
      path = path.path;
    }
    // cannot add to leaf
    if (!this.isLeaf(path)) {
      path.push(key);
      let obj = this.get(path);

      // no overwrites
      if (obj == null) {
        this.set(path, value);
        this.path = path;
        return true;
      }
    }

    return false;
  }

  swappable(path, oldpath) {
    let res = false;
    if (path instanceof Path && oldpath instanceof Path) {
      res = true;
      res &= !oldpath.contains(path) ;
      let obj = this.get(path);
      if (typeof obj === "object" && obj != null) {
        res &= !(oldpath.key in obj);
      }  else {
        res = false;
      }
    }
    return res;
  }

  swap(path, oldpath) {
    if (this.swappable(path, oldpath)) {
      let value = this.get(oldpath);
      this.set(oldpath, null);
      path.push(oldpath.key);
      this.set(path, value);

      if (oldpath.length > path.length) {
        path = oldpath;
      }
      path.pop();
      this.path = path;
      return true;
    }

    return false;
  }

  // data functions
  get(path = this.path) {
    if (is(path, FFIcon, Directory)) path = path.path;

    let json = this.json;
    if (path instanceof Path) {
      json = {};
      json[path.root] = this.json;
      for (let key of path){
        if (key in json) {
          json = json[key]
        } else {
          console.log(path);
          return null;
          throw 'invalid path'
        }
      }
    }

    return json;
  }

  set(path, value) {
    if (is(path, FFIcon, Directory)) path = path.path;

    if (path instanceof Path) {
      path = path.clone();
      let json = {};
      json[path.root] = this.json;
      let key;
      while (path.length > 1) {
        key = path.shift();
        if (!(key in json)) {
          json[key] = {};
        }
        json = json[key]
      }

      if (path.length == 1) {
        if (value == null) {
          delete json[path.key]
        } else {
          json[path.key] = value;
        }
      }
    }
  }

  getType(path = this.path) {
    let types = this.TYPES;
    let obj = this.get(path);
    for (let type in types) {
      if (types[type].is(obj)) {
        return type;
      }
    }
    return "";
  }

  isLeaf(path = this.path) {
    let types = this.TYPES;
    let type = this.getType(path);
    if (type in types) {
      return types[type].leaf;
    }
    return false;
  }

  validatePath(path) {
    let vPath = new Path();
    let json = {};
    if (path instanceof Path && path.length > 0) {
      json[path.root] = this.json;
      for (let key of path) {
        if (key in json) {
          json = json[key];
          vPath.push(key);
        } else {
          break;
        }
      }
    }

    return vPath;
  }

  open(){
    const event = new Event("open");
    event.key = this.get();
    this.dispatchEvent(event);
  }

  // re renders all directories
  update() {
    let path = this.path;

    let pn = path.length;
    if (this.isLeaf(path)) {
      pn -= 1;
    }

    let dirs = this.files.children;
    let dn = dirs.length;
    let json = this.json;
    let dir;
    let i = 0;
    while (i < pn && i < dn) {
      let dir = dirs[i];
      dir.key = path[i];
      dir.update(path[i + 1]);
      i++;
    }

    if (i < dn) {
      dir = dirs[i];
      while (dir) {
        let odir = dir;
        dir = dir.nextSibling;
        odir.remove();
      }
    }

    while (i < pn) {
      dir = new Directory(path[i], this);
      this.files.appendChild(dir);
      dir.update(path[i + 1]);
      i++;
    }

    this._path = path;
  }

  // selected path
  set path(path){
    if (typeof path === "string") {
      path = Path.fromString(path);
    } else if (is(path, FFIcon, Directory)){
      path = path.path;
    }

    if (path instanceof Path) {
      this._path = this.validatePath(path);
      this.update();
    }
  }
  get path(){
    if (this._path) {
      return this._path.clone();
    }
    return null;
  }

  // data
  get json(){
    return this._json;
  }
  set json(json){
    let recurse = (o) => {
      if (typeof o === "object" && o != null) {
        for (let key in o)  {
          if (o[key] == "empty") {
            o[key] = {};
          } else {
            recurse(o[key]);
          }
        }
      }
    }
    recurse(json);
    console.log(json);
    this._json = json;
    this.path = this.path;
  }
}

const DEFUALT_USER = {
  set: (path, value) => {
    console.log(`set ${path}: ${value}`);
  },
  onValue: (path, cb) => {

  },
  push: (path) => {
    return {key: ("h" + new Date().getTime())};
  }
}

class FireFiles extends Files {
  onconnect(){
    super.onconnect();
    this.sync();
  }

  getFileID(){
    return "";
  }

  getIDs(obj) {
    let ids = [];

    let recurse = (o) => {
      if (isID(o)) {
        ids.push(o)
      } else if (typeof o === "object" && o != null) {
        for (let key in o)  {
          recurse(o[key]);
        }
      }
    }

    recurse(obj);
    return ids;
  }

  removeFile(id){
    console.log(id);
  }

  addFile(path, key) {
    let value = this.getFileID();
    this.add(path, key, value);
  }

  set(path, value) {
    if (this.fireSet instanceof Function) {
      let fireValue = value;
      if (typeof value === "object" && value != null && Object.keys(value).length == 0){
        fireValue = "empty"
      }
      this.fireSet(path, fireValue);
    }
    super.set(path, value)
  }

  sync(){
    if (this.synced) this.synced();
    let user = this.user;
    this.synced = user.onValue(this.root + "", (e) => {
      this.json = e.val();
      console.log(e.val());
      user.loaded = true;
    });
    this.fireSet = (path, value) => {
      path[0] = this.root;
      user.set("/" + path, value);
    }
    this.getFileID = () => user.push("/" + this.fileRef).key;
  }

  get user(){
    let user = document.querySelector("fire-user");
    if (!user) user = DEFUALT_USER;
    return user;
  }

  get fileRef(){
    return new Path(this._ref);
  }
  set ["file-ref"](value){
    this._ref = value;
  }

  get root(){
    return new Path(this._root);
  }
  set root(value){
    this._root = value;
  }
}


SvgPlus.defineHTMLElement(FireFiles);
