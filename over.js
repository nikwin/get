var TalkHandler = function(){
    this.y = 0;
    this.playing = false;
    this.maxHeight = 0;
    this.climbClips = [];
    this.climbIndex = 0;

    var clipData = [
        ['fall1', false],
        ['pt2', true],
        ['pt3', true],
        ['fall3', false],
        ['pt4', true],
        ['fall4', false],
        ['pt5', true],
        ['fall5', false],
        ['pt7', true]
    ];

    this.clipIndex = 0;

    var loadSound = function(soundName){
        var sound = new Audio('sounds/' + soundName + '.ogg');
        sound.load();
        return sound;
    };

    this.clips = _.map(clipData, data => { 
        return {
            sound: loadSound(data[0]), 
            climb: data[1]
        };
    });

    var endClip = loadSound('end');
    
    this.currentSound = loadSound('intro_long');
    this.currentSound.play();
};

TalkHandler.prototype.updateY = function(y){
    var yDiff = y - this.y;
    this.y = y;

    if (this.playing){
        return;
    }

    if (yDiff > 100){
        this.maxHeight = y;
        this.play(this.climbClips[this.climbIndex]);
        this.climbIndex += 1;
    }
    else if (yDiff < -100){
        var fallClip = _.sample(this.fallClips);
        if (fallClip){
            var fallClipIndex = _.indexOf(this.fallClips, fallClip);
            this.fallClips.splice(fallClipIndex, 1);
            this.play(fallClip);
        }
    }
};

TalkHandler.prototype.playNext = function(climb){
    if (this.currentSound.ended){
        if (this.clips[this.clipIndex].climb == climb){
            this.clips[this.clipIndex].sound.play();
            this.clipIndex += 1;
        }
    }
};

TalkHandler.prototype.playEnd = function(){
    this.currentSound.pause();
    
    if (this.clipIndex == this.clips.length){
        this.endClip.play();
    }
};

var Protag = function(){
    this.rect = [100, height - 65, 40, 60];
    this.vel = [0, 0];
    this.image = 'protag';
    this.talkHandler = new TalkHandler();

    document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    this.lastCodes = [];

    this.flying = false;
};

Protag.prototype.draw = function(camera){
    var y = this.rect[1] - camera.y;
    ctx.drawImage(getImage(this.image), this.rect[0], y);
};

Protag.prototype.update = function(interval, ledges){
    if (this.flying){
        this.vel[1] = -10;
    }
    else if (this.vel[1]){
        this.vel[1] += 0.3;
    }

    this.rect[0] += this.vel[0];
    this.rect[1] += this.vel[1];

    if (this.rect[0] < 0){
        this.rect[0] = 0;
        this.vel[0] *= -1;
    }
    else if (this.rect[0] + this.rect[2] > width){
        this.rect[0] = width - this.rect[2];
        this.vel[0] *= -1;
    }

    _.each(ledges, ledge => {
        if (collideRect(this.rect, ledge.rect) && this.vel[1] > 0 && this.rect[1] + this.rect[3] - this.vel[1] < ledge.rect[1]){
            this.vel[1] *= -0.25;
            if (this.vel[1] > -0.5){
                this.talkHandler.updateY(this.rect[1]);
                this.vel = [0, 0];
            }
            this.rect[1] = ledge.rect[1] - this.rect[3] - 1;
        }
    });
};

Protag.prototype.handleKeyPress = function(e){
    this.lastCodes.push(e.keyCode);
    this.lastCodes = _.last(this.lastCodes, 4);
    var helpCode = [72, 69, 76, 80];

    if (_.isEqual(this.lastCodes, helpCode)){
        this.flying = true;
        this.talkHandler.playEnd();
    }
};

var Ledge = function(image, rect){
    this.image = image;
    this.rect = rect;
};

Ledge.prototype.draw = Protag.prototype.draw;

var StruggleButton = function(protag){
    this.protag = protag;
    this.rect = [width - 120, 20, 100, 40];
    this.name = 'Struggle';
};

StruggleButton.prototype.clicked = function(){
    if (Math.random() < 0.25 && !_.any(this.protag.vel, _.identity)){
        this.protag.vel[1] = -12 - Math.random() * 5;
        this.protag.vel[0] = (6 + Math.random() * 3) * ((Math.random() > 0.5) ? 1 : -1);
    }
};

StruggleButton.prototype.draw = function(){
    ctx.strokeStyle = '#000000';
    ctxRoundedRect(this.rect);
    ctx.fillStyle = '#000000';
    ctx.fillText('STRUGGLE', this.rect[0], this.rect[1] + this.rect[3]);
};

var Camera = function(){
    this.y = 0;
};

Camera.prototype.update = function(protag){
    this.y = min(0, protag.rect[1] + ((protag.rect[3] - height) / 2));
};

var Game = function(){
};

Game.prototype.initialize = function(){
    this.protag = new Protag();
    this.ledges = [
        new Ledge('ground', [0, height - 5, width, 5])
    ];

    var ledges = [
        new Ledge('trashtrash', [0, height - 200, 600, 65]),
        new Ledge('failures', [400, height - 350, 400, 60]),
        new Ledge('inhibition', [100, height - 500, 444, 60]),
        new Ledge('oar', [width - 175, height - 700, 175, 60]),
        new Ledge('trash', [400, height - 850, 1, 277, 60]),
        new Ledge('pain', [width - 184, height - 1050, 184, 58])
    ];

    this.ledges = this.ledges.concat(ledges);

    var extraLedges = [];

    var y = height - 1050;
    for (var i = 0; i < 50; i++){
        var baseLedge = _.sample(ledges);
        y -= Math.random() * 150 + 50;
        var ledge = new Ledge(baseLedge.image, 
                              [Math.random() * (width - baseLedge.rect[2]), y, baseLedge.rect[2], baseLedge.rect[3]]);
        extraLedges.push(ledge);
    }
    
    this.ledges = this.ledges.concat(extraLedges);

    this.buttons = [
        new StruggleButton(this.protag)
    ];

    this.camera = new Camera();

    bindHandler.bindFunction(this.getTouchFunction());
};

Game.prototype.update = function(interval){
    this.protag.update(interval, this.ledges);
    this.camera.update(this.protag);
    return true;
};

Game.prototype.draw = function(){
    ctx.fillStyle = '#99aacc';
    ctx.fillRect(0, 0, width, height);
    
    _.each(this.ledges, ledge => ledge.draw(this.camera));

    this.protag.draw(this.camera);

    _.each(this.buttons, button => button.draw());
};

Game.prototype.getTouchFunction = function(){
    return (e) => {
        e.preventDefault();

        var pos = getPos(e);
        
        _.each(this.buttons, button => {
            if (containsPos(button.rect, pos)){
                button.clicked();
            }
        });
    };
};

var getGame = function(gameProperties){
    return new Game(gameProperties);
};

var GameProperties = function(){

};
