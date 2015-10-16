var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update});

var bmd;
var map;
var layer;
var player;
var cursors;

function preload() {
}

function create() {
    game.stage.backgroundColor = '#2d2d2d';

    //map = game.add.tilemap(null,32,32,10,10);
    map = game.add.tilemap();
    bmd = game.make.bitmapData(32, 64);
    

    bmd.rect(0, 0, 32, 32, '#FFFFFF');
    bmd.rect(32, 0, 32, 32,'#000000');


    map.addTilesetImage('tiles', bmd);

    layer = map.create('level1', 40, 30, 32, 32);

    map.setCollision(1);

    for(var x=0; x<15; x++) {
        map.putTile(1, x, 0, layer);
        map.putTile(0, x, 1, layer);
        map.putTile(1, x, 2, layer);
    }

    var rect = game.add.bitmapData(16,16);
    rect.ctx.beginPath();
    rect.ctx.rect(0,0,16, 16);
    rect.ctx.fillStyle= "#ff0000";
    rect.ctx.fill();

    player = game.add.sprite(32, 32, rect); 


    game.physics.enable(player, Phaser.Physics.ARCADE);
    player.body.setSize(16,16);
    game.camera.follow(player);
    cursors = game.input.keyboard.createCursorKeys();
}


function update() {
    game.physics.arcade.collide(player,layer);

    player.body.velocity.set(0);

    if (cursors.left.isDown)
    {
        player.body.velocity.x = -100;
    }
    else if (cursors.right.isDown)
    {
        player.body.velocity.x = 100;
    }
    else if (cursors.up.isDown)
    {
        player.body.velocity.y = -100;
    }
    else if (cursors.down.isDown)
    {
        player.body.velocity.y = 100;
    }
}
