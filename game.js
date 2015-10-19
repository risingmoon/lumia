var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update, render: render});

var bmd;
var map;
var layer;
var player;
var cursors;
var pathfinder;
var mask;

function preload() {
  game.load.tilemap('map', 'level1.csv', null, Phaser.Tilemap.CSV);
}

var enemies;

function create() {

  game.stage.backgroundColor = '#2d2d2d';
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
  player = game.add.sprite(32 * 3, 32 * 3, player_bmd); 
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.setSize(16,16);
  player.speed = 100;
  game.camera.follow(player);

  mask = game.add.graphics(0, 0);
  mask.beginFill(0xffffff);
  mask.drawCircle(0,0, 100);
  layer.mask = mask;

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

//    // Draw shadow
//    layer.context.fillStyle = 'rgb(100, 100, 100)';
//    layer.context.fillRect(0, 0, game.width, game.height);
//
//    // Iterate through each of the lights and draw the glow
//    // Randomly change the radius each frame
//    //var radius = LIGHT_RADIUS + this.game.rnd.integerInRange(1,10);
//    var radius = 100 + game.rnd.integerInRange(1,10);
//
//    // Draw circle of light with a soft edge
//    //var gradient =
//    //    layer.context.createRadialGradient(
//    //        player.x, player.y, 100* 0.75,
//    //        player.x, player.y, radius);
//    //gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
//    //gradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
//
//    layer.context.beginPath();
//    //layer.context.fillStyle = gradient;
//    layer.context.fillStyle = 'rgb(100,100,100)';
//    layer.context.arc(player.x, player.y, 100, 0, Math.PI*2);
//    //layer.context.arc(game.input.activePointer.x, game.input.activePointer.y, 100, 0, Math.PI*2);
//    layer.context.fill();
//    layer.dirty = true;

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
  mask.clear();
  mask.beginFill(0xffffff);
  mask.drawCircle(0,0, 100 + game.rnd.integerInRange(1,10));
  mask.x = player.x;
  mask.y = player.y;
}

function render() {
  //game.debug.text( "This is debug text", 100, 380 );
  //pathpoints.forEach(function(point){
  //  game.debug.geom( point, 'rgba(255, 255, 0, 1)');
  //});

}
