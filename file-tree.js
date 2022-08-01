import {SvgPlus, Vector} from "../SvgPlus/4.js"
import {Icons, Icon} from "./Icons.js";
import {Files, Path} from "./files.js"

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
      if (!ftree.moveable(dropTarget, dropNode)) {
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
    icon.classList.add("ff-icon");
    icon.toggleAttribute("drag-icon", true);
    document.body.append(icon);
    e.dataTransfer.setDragImage(icon, 30, 30);
    dragIcon = icon;
    dragSource.dragging = true;
  })

  dragSource.addEventListener("dragend", (e) => {
    if (lastDropTarget) {
      ftree.move(lastDropTarget, dragSource);
      lastDropTarget.dropTarget = false;
    }

    lastDropTarget = null;
    if (dragIcon != null) {
      dragIcon.remove();
      dragIcon = null;
    }
  })
}


class FFNode extends SvgPlus {
  constructor(path, ftree, el = "div") {
    super(el);
    this.type = ftree.files.getType(path);
    this.value = ftree.files.get(path);
    this.path = new Path(path);
    this.classList.add(this.type);
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
    super(path, ftree, ftree.files.getIcon(path));
    this.classList.add("ff-icon");

    //drag events
    addDragEvents(this, ftree);
    this.setAttribute("draggable", "true");
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
    this.classList.add("directory");
    this.innerHTML = "";

    path = new Path(path);

    let keys = ftree.files.getChildrenKeys(path);
    let rel = this.createChild("div");
    for (let key of keys) {
      let iconPath = path.add(key);
      let icon = new FFIcon(iconPath, ftree)
      rel.appendChild(icon);
      if (key == selected) {
        icon.selected = true;
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



class FileTree extends SvgPlus{
  constructor(el){
    super(el);
    this.files = new Files({})
    // this.files = new Files(TEST);
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
    this.openPath = path;
    this.update();

    const event = new Event("selection");
    event.filePath = new Path(path);
    this.dispatchEvent(event);
  }

  // re renders all directories
  update() {
    let offsetX = this.directories.scrollLeft;

    let directories = new SvgPlus("div");
    directories.class = "files";

    let sp = new Path(this.selectedPath);

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

  move(fdir, fnode){
    this.selectedPath = this.files.move(fdir.path, fnode.path);
    this.update();
  }
  moveable(fdir, fnode) {
    return this.files.moveable(fdir.path, fnode.path);
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
}

SvgPlus.defineHTMLElement(FileTree);
export {Files, Path, Icon, Icons}
