({
  baseUrl: '.',
  out: 'app.js',
  optimize: 'none',
  wrap: true,
  include: [
    'babylonjs/babylon.2.5.js',
    'babylonjs/babylon.2.5.canvas2d.js',
    'babylonjs/materialsLibrary/babylon.skyMaterial.js',
    'babylonjs/materialsLibrary/babylon.waterMaterial.js',
    'bin/code/replay-viewer.js'
  ],
  paths: {
    hand: 'node-modules/handjs'
  }
})
