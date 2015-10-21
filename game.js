var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render});

var bmd;
var map;
var layer;
var player;
var cursors;
var pathfinder;
var shadowTexture;
var lightSprite;
var fogTexture;
var fogSprite;
var bitmap


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
  //tileset.rect(0, 0, 32, 32, '#FFFFFF');

  tileset.rect(0, 32, 32, 32,'#000000');
  map.addTilesetImage('tiles', tileset);
  layer = map.createLayer(0);
  map.setCollision(1);


  var walkables = [0];
  pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
  pathfinder.setGrid(map.layers[0].data, walkables);

  //var rect = game.add.bitmapData(16,16);
  //rect.ctx.beginPath();
  //rect.ctx.rect(0,0,16, 16);
  //rect.ctx.fillStyle= "#ff0000";
  //rect.ctx.fill();

  var player_bmd = game.add.bitmapData(16,16);
  player_bmd.circle(8, 8, 8, "#ff0000");
  player = game.add.sprite(32 * 3, 32 * 2.5, player_bmd); 
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.setSize(16,16);
  player.speed = 100;
  game.camera.follow(player);

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

  cursors = game.input.keyboard.createCursorKeys();


  //shadowTexture = game.make.bitmapData(game.width, game.height);
  //lightSprite = game.add.image(0,0, shadowTexture);
  //lightSprite.blendMode = Phaser.blendModes.MULTIPLY;
  //shadowTexture.context.fillStyle = 'rgb(0, 0, 0)';
  //shadowTexture.context.fillRect(0, 0, game.width, game.height);

  //fogTexture = game.make.bitmapData(game.width, game.height);
  //fogSprite = game.add.image(0,0, fogTexture);
  //fogSprite.blendMode = Phaser.blendModes.MULTIPLY;

  bitmap = game.add.bitmapData(game.width, game.height);
  bitmap.context.fillStyle = 'rgb(255, 255, 255)';
  bitmap.context.strokeStyle = 'rgb(255, 255, 255)';
  var lightBitmap = game.add.image(0, 0, bitmap);  
  lightBitmap.blendMode = Phaser.blendModes.MULTIPLY;
}

function findPathToPlayer(enemy) {
  var ray = new Phaser.Line(enemy.x, enemy.y, player.x, player.y);
  var tileHits = layer.getRayCastTiles(ray, 4, true, false);
  //if (tileHits.length > 0 && enemy.visible) {
  if (tileHits.length > 0 ) {
      enemy.tint = 0xffffff;
      enemy.seePlayer = false;
      //console.log("CANNOT SEE");
  } else {
      enemy.tint = 0xffaaaa;
      enemy.seePlayer = true;
      //console.log("CAN SEE");
  } 
  pathfinder.setCallbackFunction(function(path) {
    path = path || [];
    if(path.length > 1) {
      var pathx = path[1].x* 32 + 8,
          pathy = path[1].y* 32 + 8;
      game.physics.arcade.moveToXY(enemy, pathx, pathy , 100);
    }
  });

  pathfinder.preparePathCalculation(
      [layer.getTileX(enemy.x), layer.getTileY(enemy.y) ],
      [layer.getTileX(player.x), layer.getTileY(player.y) ]);
  pathfinder.calculatePath();
}
function updateShadowTexture() {

    // Draw circle of light
    shadowTexture.context.beginPath();
    shadowTexture.context.fillStyle = 'rgb(255, 255, 255)';
    shadowTexture.context.arc(player.x, player.y,
        100, 0, Math.PI*2);
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

    // Random radius
    var radius = 100 + game.rnd.integerInRange(1,10);

    //Gradient
    var gradient = fogTexture.context.createRadialGradient(
        player.x, player.y, radius * 0.75,
        player.x, player.y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
    fogTexture.context.fillStyle = gradient;
    //fogTexture.context.fillStyle = 'rgb(255, 255, 255)';
    fogTexture.context.arc(player.x, player.y,
        100, 0, Math.PI*2);
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
  enemies.forEach(function(enemy){
    //findPathToPlayer(enemy);
  });
  //updateShadowTexture();
  //updateFogTexture();
  bitmap.context.fillStyle = 'rgb(0, 0, 0)';
  bitmap.context.fillRect(0, 0, game.width, game.height);
  var x = game.input.activePointer.x;
  var y = game.input.activePointer.y;
  // Ray casting!
  // Cast rays at intervals in a large circle around the light.
  // Save all of the intersection points or ray end points if there was no intersection.
  // Random radius
  var radius = 100 + game.rnd.integerInRange(1,10);

  //Gradient
  var gradient = bitmap.context.createRadialGradient(
      x, y, radius * 0.75,
      x, y, radius);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  var points = [];
  for(var a = 0; a < Math.PI * 2; a += Math.PI/360) {
      // Create a ray from the light to a point on the circle
      var ray = new Phaser.Line(x, y,
          x + Math.cos(a) * radius, y + Math.sin(a) * radius);

      // Check if the ray intersected any walls
      var intersect = getWallIntersection(ray);

      // Save the intersection or the end of the ray
      if (intersect) {
          points.push(intersect);
      } else {
          points.push(ray.end);
      }
  }

  // Connect the dots and fill in the shape, which are cones of light,
  // with a bright white color. When multiplied with the background,
  // the white color will allow the full color of the background to
  // shine through.
  bitmap.context.beginPath();
  //bitmap.context.fillStyle = 'rgb(255, 255, 255)';
  bitmap.context.fillStyle = gradient;
  bitmap.context.moveTo(points[0].x, points[0].y);
  for(var i = 0; i < points.length; i++) {
      bitmap.context.lineTo(points[i].x, points[i].y);
  }
  bitmap.context.closePath();
  bitmap.context.fill();

  // This just tells the engine it should update the texture cache
  bitmap.dirty = true;
  
}

function render() {
  //game.debug.text('render FPS: ' + (game.time.fps || '--') , 2, 14, "#00ff00");

  //game.debug.text( "This is debug text", 100, 380 );
  //pathpoints.forEach(function(point){
  //  game.debug.geom( point, 'rgba(255, 255, 0, 1)');
  //});

}
