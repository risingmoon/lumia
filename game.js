var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update});

var bmd;
var map;
var layer;
var player;
var cursors;
var pathfinder;
var test = true;

function preload() {
  game.load.tilemap('map', 'level1.csv', null, Phaser.Tilemap.CSV);
}

var enemies;

function create() {

  game.stage.backgroundColor = '#2d2d2d';
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

  //var rect = game.add.bitmapData(16,16);
  //rect.ctx.beginPath();
  //rect.ctx.rect(0,0,16, 16);
  //rect.ctx.fillStyle= "#ff0000";
  //rect.ctx.fill();

  var player_bmd = game.add.bitmapData(16,16);
  player_bmd.circle(8, 8, 8, "#ff0000");
  player = game.add.sprite(32, 32, player_bmd); 
  game.physics.enable(player, Phaser.Physics.ARCADE);
  player.body.setSize(16,16);
  game.camera.follow(player);

  var enemy_bmd = game.add.bitmapData(16, 16);
  enemy_bmd.circle(8, 8, 8, "#008000");
  enemy = game.add.sprite(32* 14, 64, enemy_bmd);
  game.physics.enable(enemy, Phaser.Physics.ARCADE);
  enemy.body.setSize(16, 16);

  //Group creation
  //enemies = game.add.group();
  //var enemy_bmd = game.add.bitmapData(16, 16);
  //enemy_bmd.circle(8, 8, 8, "#008000");
  //enemies.create(32 * 14, 64, enemy_bmd);

  cursors = game.input.keyboard.createCursorKeys();
}

function findPathTo(tilex, tiley) {
  //console.log("CALLED");
  pathfinder.setCallbackFunction(function(path) {
    path = path || [];
    for(var i = 0, ilen= path.length; i < ilen; i++) {
      //console.log(path[i].x, path[i].y);
      //var tile = layer.getTileXY(path[i].x, path[i].y);
      //console.log(tile);
    }
    blocked= false;
    if (path.length>=1) {
      enemy.x = path[1].x * 32;
      enemy.y = path[1].y * 32;
    }
  });

  //console.log(layer.getTileX(enemy.x), layer.getTileY(enemy.y));
  pathfinder.preparePathCalculation(
      [layer.getTileX(enemy.x), layer.getTileY(enemy.y) ],
      [tilex, tiley]);
  //pathfinder.preparePathCalculation([1,1 ], [3, 3]);
  pathfinder.calculatePath();
}


function update() {
  game.physics.arcade.collide(player,layer);

  player.body.velocity.set(0);

  if (cursors.left.isDown) {
      player.body.velocity.x = -100;
  }
  else if (cursors.right.isDown) {
      player.body.velocity.x = 100;
  }
  else if (cursors.up.isDown) {
      player.body.velocity.y = -100;
  }
  else if (cursors.down.isDown) {
      player.body.velocity.y = 100;
  }
  if ( test== true) {
    findPathTo(layer.getTileX(player.x), layer.getTileY(player.y));
    //test = false;
  }
}
