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

SvgPlus.defineHTMLElement(FileTree);
