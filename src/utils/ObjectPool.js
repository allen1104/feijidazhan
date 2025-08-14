class ObjectPool {
  constructor(scene, key, maxSize = 30) {
    this.scene = scene;
    this.key = key;
    this.maxSize = maxSize;
    this.group = scene.physics.add.group({
      defaultKey: key,
      maxSize: maxSize
    });
  }

  spawn(x, y) {
    let obj = this.group.get(x, y);
    if (obj) {
      obj.setActive(true).setVisible(true);
      obj.body.enable = true;
      obj.x = x;
      obj.y = y;
      return obj;
    }
    return null;
  }
}

export default ObjectPool;
