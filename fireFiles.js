import {Files, Path} from "./files.js"

function checkFirebaseDatabaseKeyValidity(path)  {
  for (let key of path) {
    if (key.length > 768)
    throw key + " extends maximum length of 768 bytes.";
    if (key.match(/[.$#/[]]|[\x00-\x1F]|\x7F/))
    throw key + " contains either .#$/[], ASCII characers 0-31 or 127";
  }
}

class FireFiles extends Files {
  constructor(fireUser, root, ftree){
    super({});
    this.fireUser = fireUser;
    this.root = root;
    this.ftree = ftree;
  }

  updateHandler(){
    let {ftree} = this;
    try {
      ftree.selectPath(this.validatePath(ftree.selectedPath));
      ftree.openPath = this.validatePath(ftree.openPath);
      ftree.update();
    } catch(e) {}
    try {
      this.onFireUpdate();
    } catch(e) {}
    try {
      this.onfireUpdate();
    } catch(e) {}
  }

  set fireUser(fireUser) {
    this._fireUser = null;
    if (fireUser === null || typeof fireUser !== "object") {
    } else if (fireUser.set instanceof Function &&
      fireUser.set instanceof Function &&
      fireUser.update instanceof Function) {
        this._fireUser = fireUser;
    }
  }
  get fireUser() {return this._fireUser;}

  set root(root){
    this._root = null;
    if (root) {
      root = new Path(root);
      checkFirebaseDatabaseKeyValidity(root);
      this._root = root;
    }
  }
  get root(){
    let root = this._root;
    if (this._root instanceof Path) {
      root = root.clone();
    }
    return root;
  }

  async watchFirebaseRoot() {
    return new Promise((resolve, reject) => {
      let {fireUser, root} = this;
      if (fireUser != null || root != null) {
        if (this.unsubscribe != null) this.unsubscribe();

        this.unsubscribe = fireUser.onValue(root + "", (e) => {
          this.data = e.val();
          this.updateHandler();
          resolve();
        })
      }
    });
  }

  async forceFirebaseUpdate(){
    let {root, fireUser} = this;
    if (root != null && fireUser != null) {
      this.data = (await this.fireUser.get(this.root + "")).val();
      this.updateHandler();
    }
  }

  async set(path, value) {
    checkFirebaseDatabaseKeyValidity(path);
    super.set(path, value);

    let {root, fireUser} = this;
    if (root !== null && fireUser !== null) {
      try {
        path = root.add(path);
        console.log(`set [${path}] : ${value}`);
        await fireUser.set(path + "", value);
      } catch(e) {
        await this.forceFirebaseUpdate();
        throw e;
      }
    }
  }

  async update(path, value) {
    if (typeof value === "object" && value != null) {
      checkFirebaseDatabaseKeyValidity(path);
      super.update(path, value);

      let {root, fireUser} = this;
      try {
        path = root.add(path);
        await fireUser.update(path + "", value);
      } catch(e) {
        await this.forceFirebaseUpdate();
        throw e;
      }
    }
  }

  rename(path, name) {
    let obj = this.get(path);
    checkFirebaseDatabaseKeyValidity([name]);
    if (obj === null) throw "old path does not exist";

    return super.rename(path, name);
  }
}

export {Files, FireFiles, Path}
