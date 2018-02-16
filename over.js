var Protag = function(){
    this.rect = [100, height - 110, 100, 200];
    this.vel = [0, 0];
    this.image = 'protag';
};

Protag.prototype.draw = function(){
    ctx.drawImage(getImage(this.image), this.rect[0], this.rect[1]);
};

Protag.prototype.update = function(interval, ledges){
    if (this.vel[1]){
        this.vel[1] -= 0.3;
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
        if (collideRect(this.rect, ledge.rect) && this.vel[1] > 0 && this.rect[1] + this.rect[3] < ledge.rect[1] + 5){
            this.vel[1] *= -0.25;
            if (this.vel[1] < 0.5){
                this.vel = [0, 0];
            }
            this.rect[1] = ledge.rect[1] - this.rect[3] - 1;
        }
    });
};

var Ledge = function(image, rect){
    this.image = image;
    this.rect = rect;
};

Ledge.prototype.draw = Protag.prototype.draw;

var Game = function(){
};

Game.prototype.initialize = function(){
    this.protag = new Protag();
    this.ledges = [
        new Ledge('ground', [0, height - 5, width, 5])
    ];
};

Game.prototype.update = function(interval){
    this.protag.update(interval);
    return true;
};

Game.prototype.draw = function(){
    ctx.fillStyle = '#99aacc';
    ctx.fillRect(0, 0, width, height);
    this.protag.draw();
    _.each(this.ledges, ledge => ledge.draw());
};

var getGame = function(gameProperties){
    return new Game(gameProperties);
};

var GameProperties = function(){

};
