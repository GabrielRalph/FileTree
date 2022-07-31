import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {Icons, Icon} from "./Icons.js";
import {Files, Path} from "./files.js"

const TEST = {
  "Tests": {
    "TEST": "0",
    "for real": "1",
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
      let targets = getTargets(e, [ContextMenu, FileTree]);
      this.over = !!targets.ContextMenu;
      lastE = targets.FileTree ? e : null;
    })
    window.addEventListener("mousedown", (e) => {
      let targets = getTargets(e, [FileTree]);
      lastE = targets.FileTree ? e : null;
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
    this.tick = new Icon("tick")
    this.cross = new Icon("cross");
    rel.appendChild(this.tick);
    rel.appendChild(this.cross);


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

// -------------------------------------------------- //

class FFNode extends SvgPlus {
  constructor(path, files) {
    super("div");
    this.files = files;
    this.path = new Path(path);
  }

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

  set dropTarget(value) {
    this.toggleAttribute("drop-target", value);
  }
}

class FFIcon extends FFNode {
  constructor(path, ftree) {
    super(path, ftree);
    this.class = "ff-icon";
    addDragEvents(this, ftree);
    this.setAttribute("draggable", "true");
    let type = ftree.files.getType(path);
    this.classList.add(type);
    this.createChild("div", {content: path.key})
    this.appendChild(ftree.files.getIcon(path));
  }

  set selected(value) {
    this.toggleAttribute("selected", value);
  }
  set dragging(value) {
    this.toggleAttribute("dragging", value)
  }
}

class Directory extends FFNode {
  constructor(path, selected, ftree) {
    super(path, ftree);
    this.class = "directory";
    this.path = new Path(path);
    this.fileTree = ftree;
    this.update(selected);
  }

  update(selected){
    let lastSelected = null
    let path = this.path;
    this.innerHTML = "";
    let keys = this.fileTree.files.getChildrenKeys(path);
    for (let key of keys) {
      let icon = new FFIcon(this.path.add(key), this.fileTree);
      this.appendChild(icon);

      if (key == selected) {
        icon.selected = true;
        lastSelected = icon;
      }
    }
    this.sort_default();
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

function getDropTarget(e, dropNode, ftree) {
  let dropTarget = null;

  try {

    let el = document.elementFromPoint(e.x, e.y);
    let t = getTargets({target: el});

    // check for drop target is an icon
    if (t.FFIcon) {
      dropTarget = t.FFIcon;
    } else if (t.Directory) {
      dropTarget = t.Directory;
    }

    // check to see that the choosen dropTarget is valid
    if (dropTarget != null) {
      if (!ftree.swappable(dropTarget, dropNode)) {
        dropTarget = null;
      }
    }
  } catch(e) {
    dropTarget = null;
  }

  return dropTarget;
}

function addDragEvents(dragSource, ftree){
  let lastDropTarget = null;

  dragSource.addEventListener("drag", (e) => {
    let dropTarget = getDropTarget(e, dragSource, ftree);

    if (lastDropTarget) {
      lastDropTarget.dropTarget = false;
      lastDropTarget = null;
    }

    if (dropTarget) {
      dropTarget.dropTarget = true;
      lastDropTarget = dropTarget;
    }
  });

  let dragIcon = null;

  dragSource.addEventListener("dragstart", (e) => {
    let icon = ftree.files.getIcon(dragSource.path);
    icon.toggleAttribute("drag-icon", true);
    document.body.append(icon);
    e.dataTransfer.setDragImage(icon, 30, 30);
    dragSource.dragging = true;
  })

  dragSource.addEventListener("dragend", (e) => {
    if (lastDropTarget) {
      ftree.swap(lastDropTarget, dragSource);
      lastDropTarget.dropTarget = false;
    }

    lastDropTarget = null;
    if (dragIcon != null) {
      dragIcon.remove();
      dragIcon = null;
    }
  })
}

class FileTree extends SvgPlus{
  constructor(el){
    super(el);
    this.files = new Files(TEST);
  }

  onconnect(){
    let rel = this.createChild("div")
    this.directories = rel.createChild("div", {class: "files"});
    this.update();
    this.onclick = (e) => {this.pointClick(e)}
  }


  pointClick(e) {
    let targets = getTargets(e);
    let path = null;
    if (targets.FFIcon) {
      path = targets.FFIcon.path;

      let spath = this.selectedPath;
      if (spath && spath.equal(path)) {
        if (path.length > 1) {
          path.pop();
        }
      }
    } else if (targets.Directory) {
      path = targets.Directory.path;
    }

    this.selectedPath = path;
    // if (this.openPath.contains(path)) {
      this.openPath = path;
    // }
    this.update();
  }


  // re renders all directories
  update() {
    let offsetX = this.directories.scrollLeft;

    let directories = new SvgPlus("div");
    directories.class = "files";

    let sp = this.selectedPath;

    let dirPath = "";
    directories.appendChild(new Directory("/", sp.length > 0 ? sp.shift() : null, this));

    let openPath = this.openPath;
    for (let path of openPath) {
      if (dirPath != "") dirPath += "/"
      dirPath += path;
      if (this.files.isDirectory(dirPath)) {
        directories.appendChild(new Directory(dirPath, sp.length > 0 ? sp.shift() : null, this));
      } else {
        this.openPath = dirPath;
        break;
      }
    }

    if (this.directories) {
      this.directories.parentNode.replaceChild(directories, this.directories)
      this.directories = directories;
      directories.scrollLeft = offsetX;
    }
  }

  swap(fdir, fnode){
    this.selectedPath = this.files.swap(fdir.path, fnode.path);
    this.update();
  }
  swappable(fdir, fnode) {
    return this.files.swappable(fdir.path, fnode.path);
  }

  // selected path
  set selectedPath(path){
    this._path = path;
  }
  get selectedPath(){
    let path = this._path;
    if (path instanceof Path) {
      path = path.clone();
    } else if (typeof path === "string") {
      path = new Path(path);
    } else {
      path = new Path();
    }
    return path;
  }

  set openPath(path){
    this._opath = path;
  }
  get openPath(){
    let path = this._opath;
    if (path instanceof Path) {
      path = path.clone();
    } else if (typeof path === "string") {
      if (path != "/") {
        path = new Path(path);
      }
    } else {
      path = new Path();
    }
    return path;
  }
  // data
  // get json(){
  //   return this._json;
  // }
  // set json(json){
  //   let recurse = (o) => {
  //     if (typeof o === "object" && o != null) {
  //       for (let key in o)  {
  //         if (o[key] == "empty") {
  //           o[key] = {};
  //         } else {
  //           recurse(o[key]);
  //         }
  //       }
  //     }
  //   }
  //   recurse(json);
  //   console.log(json);
  //   this._json = json;
  //   this.path = this.path;
  // }
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
//
// class FireFiles extends Files {
//   onconnect(){
//     super.onconnect();
//     this.sync();
//   }
//
//   getFileID(){
//     return "";
//   }
//
//   getIDs(obj) {
//     let ids = [];
//
//     let recurse = (o) => {
//       if (isID(o)) {
//         ids.push(o)
//       } else if (typeof o === "object" && o != null) {
//         for (let key in o)  {
//           recurse(o[key]);
//         }
//       }
//     }
//
//     recurse(obj);
//     return ids;
//   }
//
//   removeFile(id){
//     console.log(id);
//   }
//
//   addFile(path, key) {
//     let value = this.getFileID();
//     this.add(path, key, value);
//   }
//
//   set(path, value) {
//     if (this.fireSet instanceof Function) {
//       let fireValue = value;
//       if (typeof value === "object" && value != null && Object.keys(value).length == 0){
//         fireValue = "empty"
//       }
//       this.fireSet(path, fireValue);
//     }
//     super.set(path, value)
//   }
//
//   sync(){
//     if (this.synced) this.synced();
//     let user = this.user;
//     this.synced = user.onValue(this.root, (e) => {
//       this.json = e.val();
//       console.log(e.val());
//       user.loaded = true;
//     });
//     this.fireSet = (path, value) => {
//       path[0] = this.root;
//       user.set("/" + path, value);
//     }
//     this.getFileID = () => user.push("/" + this.fileRef).key;
//   }
//
//   get user(){
//     let user = document.querySelector("fire-user");
//     if (!user) user = DEFUALT_USER;
//     return user;
//   }
//
//   get fileRef(){
//     return new Path(this._ref);
//   }
//   set ["file-ref"](value){
//     this._ref = value;
//   }
//
//   get root(){
//     return new Path(this._root);
//   }
//   set root(value){
//     this._root = value;
//   }
// }


SvgPlus.defineHTMLElement(FileTree);
