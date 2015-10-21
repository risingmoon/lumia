var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render});

var bmd;
var map;
var layer;
var player;
var light;
var cursors;
var pathfinder;
var shadowTexture;
var lightSprite;
var fogTexture;
var fogSprite;
var gradient;
var points;
var radius;


function preload() {
  game.load.tilemap('map', 'level1.csv', null, Phaser.Tilemap.CSV);
}

var enemies;

function create() {

  game.stage.backgroundColor = '#2d2d2d';

  //FPS
  //game.time.advancedTiming = true;
  //game.fpsProblemNotifier.add(function() {
  //   game.time.desiredFps = 40;
  //});

  // 24 x 19
  map = game.add.tilemap('map', 32, 32);
  tileset = game.make.bitmapData(32, 64);
  tileset.rect(0, 0, 32, 32, '#a52a2a');

  tileset.rect(0, 32, 32, 32,'#000000');
  map.addTilesetImage('tiles', tileset);
  layer = map.createLayer(0);
  map.setCollision(1);

  var walkables = [0];
  pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
  pathfinder.setGrid(map.layers[0].data, walkables);

  player = game.add.sprite(32 * 3, 32 * 2.5,
      game.add.bitmapData(16,16).circle(8, 8, 8, "#ff0000")); 
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.setSize(16,16);
  player.speed = 100;
  player.torch = 100;
  player.health = 100;
  game.camera.follow(player);

  light = game.add.sprite(32 *3, 32* 2.5,
    game.add.bitmapData(32,32).circle(16, 16, 16));
  light.anchor.setTo(0.5, 0.5);
  game.physics.enable(light, Phaser.Physics.ARCADE);
  light.body.setSize(32, 32);
  light.visible = false;


  //var enemy_bmd = game.add.bitmapData(16, 16);
  //enemy_bmd.circle(8, 8, 8, "#008000");
  //enemy = game.add.sprite(32* 14, 32* 9, enemy_bmd);
  //game.physics.enable(enemy, Phaser.Physics.ARCADE);
  //enemy.body.setSize(16, 16);

  //Group creation
  enemies = game.add.group();
  enemies.enableBody = true;
  enemies.physicsBodyType = Phaser.Physics.ARCADE;
  var enemy_bmd = game.add.bitmapData(16, 16);
  enemy_bmd.circle(8, 8, 8, "#008000");
  enemies.create(32 * 14, 32 * 9, enemy_bmd);
  enemies.create(32 * 4, 32 * 14, enemy_bmd);
  enemies.create(32 * 4.5, 32 * 2, enemy_bmd);

  cursors = game.input.keyboard.createCursorKeys();

  shadowTexture = game.make.bitmapData(game.width, game.height);
  lightSprite = game.add.image(0,0, shadowTexture);
  lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
  shadowTexture.context.fillStyle = 'rgb(0, 0, 0)';
  shadowTexture.context.fillRect(0, 0, game.width, game.height);

  fogTexture = game.make.bitmapData(game.width, game.height);
  fogSprite = game.add.image(0,0, fogTexture);
  fogSprite.blendMode = Phaser.blendModes.MULTIPLY;

  timer = game.time.create(false);
  timer.loop(1000, updateTorch, this);
  timer.start();
}

function update() {
  game.physics.arcade.collide(player,layer);

  player.body.velocity.set(0);

  if (cursors.left.isDown) {
      player.body.velocity.x = -player.speed;
  }
  else if (cursors.right.isDown) {
      player.body.velocity.x = player.speed;
  }
  else if (cursors.up.isDown) {
      player.body.velocity.y = -player.speed;
  }
  else if (cursors.down.isDown) {
      player.body.velocity.y = player.speed;
  }
  findPathToPlayer();
  getRayCastPoints();
  updateShadowTexture();
  updateFogTexture();
  game.physics.arcade.collide(light, enemies, enemyHit);
}
function render() {
  game.debug.text('Light: ' + player.torch, 32, 32);
  //game.debug.text('render FPS: ' + (game.time.fps || '--') , 2, 14, "#00ff00");
  //pathpoints.forEach(function(point){
  //  game.debug.geom( point, 'rgba(255, 255, 0, 1)');
  //});

}
function enemyHit(light, enemy){
  console.log("ENEMY KILL!");
  enemy.kill();
  //enemy.destroy();
  if (radius > 10){
    player.torch -= 10;
  } else {
    player.torch = 0;
  }
  radius = player.torch;
}

function updateTorch() {
  if (player.torch >  0) {
    player.torch -= 10;
  }
}
function findPathToPlayer() {
  enemies.forEach(function(enemy){
    var ray = new Phaser.Line(enemy.x, enemy.y, player.x, player.y);
    var distance  = game.math.distance(enemy.x, enemy.y, player.x, player.y);
    var tileHits = layer.getRayCastTiles(ray, 4, true, false);
    if (distance > 100 || tileHits.length > 0 ) {
        enemy.tint = 0xffffff;
        enemy.visible=false;
    } else {
        enemy.tint = 0xffaaaa;
        enemy.visible=true;
    } 
    pathfinder.setCallbackFunction(function(path) {
      path = path || [];
      if(path.length > 1) {
        var pathx = path[1].x* 32 + 8,
            pathy = path[1].y* 32 + 8;
        game.physics.arcade.moveToXY(enemy, pathx, pathy , 50);
      }
    });

    pathfinder.preparePathCalculation(
        [layer.getTileX(enemy.x), layer.getTileY(enemy.y) ],
        [layer.getTileX(player.x), layer.getTileY(player.y) ]);
    pathfinder.calculatePath();
  });
}

function updateShadowTexture() {

  // Draw circle of light
  shadowTexture.context.beginPath();
  shadowTexture.context.fillStyle = 'rgb(255, 255, 255)';
  //shadowTexture.context.arc(player.x, player.y,
  //    100, 0, Math.PI*2);
  shadowTexture.context.moveTo(points[0].x, points[0].y);
  for(var i = 0; i < points.length; i++) {
      shadowTexture.context.lineTo(points[i].x, points[i].y);
  }
  shadowTexture.context.closePath();
  shadowTexture.context.fill();

  // This just tells the engine it should update the texture cache
  shadowTexture.dirty = true;
};

function updateFogTexture() {

  fogTexture.copy(shadowTexture);
  fogTexture.context.fillStyle = 'rgb(100, 100, 100)';
  fogTexture.context.fillRect(0, 0, game.width, game.height);

  // Draw circle of light
  fogTexture.context.beginPath();

  //Gradient
  var gradient = fogTexture.context.createRadialGradient(
      player.x, player.y, radius * 0.25,
      player.x, player.y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  fogTexture.context.fillStyle = gradient;
  //fogTexture.context.fillStyle = 'rgb(255, 255, 255)';
  fogTexture.context.moveTo(points[0].x, points[0].y);
  for(var i = 0; i < points.length; i++) {
      fogTexture.context.lineTo(points[i].x, points[i].y);
  }
  fogTexture.context.closePath();
  fogTexture.context.fill();

  // This just tells the engine it should update the texture cache
  fogTexture.dirty = true;
};
function getWallIntersection(ray) {
  var distanceToWall = Number.POSITIVE_INFINITY;
  var closestIntersection = null;

  // For each of the walls...
  var tiles = layer.getRayCastTiles(ray, 4, true);
  tiles.forEach(function(tile) {
      // Create an array of lines that represent the four edges of each wall
      var lines = [
          new Phaser.Line(tile.worldX, tile.worldY, tile.worldX + tile.width, tile.worldY),
          new Phaser.Line(tile.worldX, tile.worldY, tile.worldX, tile.worldY + tile.height),
          new Phaser.Line(tile.worldX + tile.width, tile.worldY,
              tile.worldX + tile.width, tile.worldY + tile.height),
          new Phaser.Line(tile.worldX, tile.worldY + tile.height,
              tile.worldX + tile.width, tile.worldY + tile.height)
      ];

      // Test each of the edges in this wall against the ray.
      // If the ray intersects any of the edges then the wall must be in the way.
      for(var i = 0; i < lines.length; i++) {
          var intersect = Phaser.Line.intersects(ray, lines[i]);
          if (intersect) {
              // Find the closest intersection
              distance =
                  game.math.distance(ray.start.x, ray.start.y, intersect.x, intersect.y);
              if (distance < distanceToWall) {
                  distanceToWall = distance;
                  closestIntersection = intersect;
              }
          }
      }
  }, this);

  return closestIntersection;
};


function getRayCastPoints() {
  radius = player.torch ? player.torch  + game.rnd.integerInRange(1,10):0;

  points = [];
  for(var a = 0; a < Math.PI * 2; a += Math.PI/360) {
      var ray = new Phaser.Line(
	  player.x, player.y,
          player.x + Math.cos(a) * radius, player.y + Math.sin(a) * radius);

      var intersect = getWallIntersection(ray);

      if (intersect) {
          points.push(intersect);
      } else {
          points.push(ray.end);
      }
  }
}
