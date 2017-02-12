var world;
var shapeArray=[];

if (typeof SpriteTag == "undefined") {
   var SpriteTag = {};
   SpriteTag.totem = 0; // トーテム
   SpriteTag.destroyable = 1; //
   SpriteTag.solid = 2; //
   SpriteTag.ground = 3; //地面

};
var gameLayer;
var gameScene = cc.Scene.extend({
    onEnter:function () {
        this._super();
        gameLayer = new game();
        gameLayer.init();
        this.addChild(gameLayer);
    }
});

var game = cc.Layer.extend({
    init:function () {
        this._super();
        var backgroundLayer = cc.LayerGradient.create(cc.color(0xdf,0x9f,0x83,255),cc.color(0xfa,0xf7,0x9f,255));
        this.addChild(backgroundLayer);
        world = new cp.Space();
        world.gravity = cp.v(0, -100);
        var debugDraw = cc.PhysicsDebugNode.create(world);
        debugDraw.setVisible(true);
        this.addChild(debugDraw);


        var wallBottom = new cp.SegmentShape(world.staticBody,
           cp.v(-4294967294, -100), // start point
           cp.v(4294967295, -100), // MAX INT:4294967295
           0); // thickness of wall
        world.addStaticShape(wallBottom);


        // this.addBody(240,10,480,20,false,res.ground_png,"ground");
        // this.addBody(204,32,24,24,true,res.brick1x1_png,"destroyable");
        // this.addBody(276,32,24,24,true,res.brick1x1_png,"destroyable");
        // this.addBody(240,56,96,24,true,res.brick4x1_png,"destroyable");
        // this.addBody(240,80,48,24,true,res.brick2x1_png,"solid");
        // this.addBody(228,104,72,24,true,res.brick3x1_png,"destroyable");
        // this.addBody(240,140,96,48,true,res.brick4x2_png,"solid");
        // this.addBody(240,188,24,48,true,res.totem_png,"totem");

        this.addBody(240,10,480,20,false,res.ground_png,SpriteTag.ground);
        this.addBody(204,32,24,24,true,res.brick1x1_png,SpriteTag.destroyable);
        this.addBody(276,32,24,24,true,res.brick1x1_png,SpriteTag.destroyable);
        this.addBody(240,56,96,24,true,res.brick4x1_png,SpriteTag.destroyable);
        this.addBody(240,80,48,24,true,res.brick2x1_png,SpriteTag.solid);
        this.addBody(228,104,72,24,true,res.brick3x1_png,SpriteTag.destroyable);
        this.addBody(240,140,96,48,true,res.brick4x2_png,SpriteTag.solid);
        this.addBody(240,188,24,48,true,res.totem_png,SpriteTag.totem);


        this.scheduleUpdate();
        cc.eventManager.addListener(touchListener, this);
        world.setDefaultCollisionHandler (this.collisionBegin,null,null,null);

    },
    addBody: function(posX,posY,width,height,isDynamic,spriteImage,type){
        if(isDynamic){
            var body = new cp.Body(1,cp.momentForBox(1,width,height));
        }
        else{
            var body = new cp.Body(Infinity,Infinity);
        }
        body.setPos(cp.v(posX,posY));
        var bodySprite = cc.Sprite.create(spriteImage);
        gameLayer.addChild(bodySprite,0);
        bodySprite.setPosition(posX,posY);
        if(isDynamic){
            world.addBody(body);
        }
        var shape = new cp.BoxShape(body, width, height);
        shape.setFriction(1);
        shape.setElasticity(0);
        shape.name=type;
        shape.setCollisionType(type);
        shape.image=bodySprite;
        world.addShape(shape);
        shapeArray.push(shape);
    },
    update:function(dt){
        world.step(dt);
        for(var i=shapeArray.length-1;i>=0;i--){
            shapeArray[i].image.x=shapeArray[i].body.p.x
            shapeArray[i].image.y=shapeArray[i].body.p.y
            var angle = Math.atan2(-shapeArray[i].body.rot.y,shapeArray[i].body.rot.x);
            shapeArray[i].image.rotation= angle*57.2957795;
        }
    },
    collisionBegin : function (arbiter, space ) {
      /*
        if((arbiter.a.name=="totem" && arbiter.b.name=="ground") || (arbiter.b.name=="totem" && arbiter.a.name=="ground")){
            console.log("Oh no!!!!");
        }
        */

        if(arbiter.a.name== SpriteTag.totem && arbiter.b.name== SpriteTag.ground ) {
           cc.audioEngine.playEffect(res.landing_mp3);
        }
        return true;
    },


});


var touchListener = cc.EventListener.create({
   event: cc.EventListener.TOUCH_ONE_BY_ONE, // シングルタッチのみ対応
   swallowTouches: false, // 以降のノードにタッチイベントを渡す
   onTouchBegan: function(touch, event) { // タッチ開始時
      var pos = touch.getLocation();

      console.log("shapeArray.length:", shapeArray.length)
         // すべてのshapをチェックする
      for (var i = 0; i < shapeArray.length; i++) {
         var shape = shapeArray[i];
         console.log("shape.type:", i, shape.type)
            //pointQueryは物理オブジェクトの内側がタップされたかどうか判定する関数
         if (shape.pointQuery(cp.v(pos.x, pos.y)) != undefined) {
            console.log("hit ")
            if (shape.name == SpriteTag.destroyable) {
               //ブロックをタップしたときは、消去する
               world.removeBody(shape.getBody());
               world.removeShape(shape);
               gameLayer.removeChild(shape.image);
               shapeArray.splice(i, 1);
               console.log("remove block")
               return;
            } else if (shape.name == SpriteTag.totem) {
               // トーテムをタップしたときは、衝撃を与える
               shape.body.applyImpulse(cp.v(500, 0), cp.v(0, -20))
               return;
            }
         }
      }
      // 何も無い場所をタップしたときは箱を追加する
      gameLayer.addBody(pos.x,pos.y,24,24,true,res.brick1x1_png,SpriteTag.destroyable);
      return;

   }

});

/*
var touchListener = cc.EventListener.create({
    event: cc.EventListener.TOUCH_ONE_BY_ONE,
    onTouchBegan: function (touch, event) {
        for(var i=shapeArray.length-1;i>=0;i--){
            if(shapeArray[i].pointQuery(cp.v(touch.getLocation().x,touch.getLocation().y))!=undefined){
                if(shapeArray[i].name== SpriteTag.destroyable ){
                    gameLayer.removeChild(shapeArray[i].image);
                    world.removeBody(shapeArray[i].getBody())
                    world.removeShape(shapeArray[i])
                    shapeArray.splice(i,1);
                }
            }
        }
    }
});
*/
