(function() {
  var Particle, ParticleSystem, Vec2, World, _Object, test,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Vec2 = (function() {
    function Vec2(x, y) {
      this.x = x != null ? x : 0;
      this.y = y != null ? y : 0;
    }

    Vec2.prototype.add = function(vec) {
      this.x += vec.x;
      this.y += vec.y;
      return this;
    };

    Vec2.prototype.copy = function() {
      return new Vec2(this.x, this.y);
    };

    Vec2.getRandom = function(min, max) {
      return new Vec2(Math.random() * (max - min) + min, Math.random() * (max - min) + min);
    };

    return Vec2;

  })();

  World = (function() {
    function World(canvas) {
      this.canvas = canvas;
      this.ctx = this.canvas.getContext('2d');
      this.canvasWidth = this.canvas.width = 400;
      this.canvasHeight = this.canvas.height = 500;
      this.objects = [];
      this.controllable = {};
      this.mouse = new Vec2(this.canvasWidth / 2, this.canvasHeight / 2);
      this.params = {
        gravity: new Vec2(0, -.2)
      };
      this.canvas.addEventListener("mousemove", ((function(_this) {
        return function(e) {
          var ref;
          return ref = [e.offsetX, e.offsetY], _this.mouse.x = ref[0], _this.mouse.y = ref[1], ref;
        };
      })(this)), false);
      this.canvas.addEventListener("touchmove", ((function(_this) {
        return function(e) {
          e.preventDefault();
          console.log(e);
          _this.mouse.x = e.touches[0].pageX - e.touches[0].target.offsetLeft;
          return _this.mouse.y = e.touches[0].pageY - e.touches[0].target.offsetTop;
        };
      })(this)), false);
      this.canvas.addEventListener("mousewheel", ((function(_this) {
        return function(e) {
          e.preventDefault();
          if (_this.controllable instanceof ParticleSystem) {
            if (e.shiftKey) {
              return _this.controllable.scatter = Math.max(0, _this.controllable.scatter - e.wheelDelta / 100);
            } else if (e.altKey) {
              return _this.controllable.particleSize = Math.max(0, _this.controllable.particleSize - e.wheelDelta / 100);
            } else {
              return _this.controllable.particleLife = Math.max(1, _this.controllable.particleLife - e.wheelDelta / 10);
            }
          }
        };
      })(this)), false);
    }

    World.prototype.addObject = function(constructor, config, controllable) {
      var obj;
      config.world = this;
      obj = new constructor(config);
      if (controllable) {
        obj.setControllable();
      }
      return this.objects.push(obj);
    };

    World.prototype.removeObject = function(index) {
      return this.objects.splice(index, 1);
    };

    World.prototype.start = function() {
      return this.tick();
    };

    World.prototype.tick = function() {
      this.update();
      this.draw();
      return requestAnimationFrame(this.tick.bind(this));
    };

    World.prototype.update = function() {
      var ind, j, len, object, ref, results;
      ref = this.objects;
      results = [];
      for (ind = j = 0, len = ref.length; j < len; ind = ++j) {
        object = ref[ind];
        if (object) {
          results.push(object.update(ind));
        }
      }
      return results;
    };

    World.prototype.draw = function() {
      var j, len, object, ref, results;
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      this.ctx.globalAlpha = 1;
      ref = this.objects;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        object = ref[j];
        results.push(object.draw());
      }
      return results;
    };

    return World;

  })();

  _Object = (function() {
    function _Object(config) {
      var ref, ref1;
      this.loc = (ref = config.loc) != null ? ref : new Vec2;
      this.speed = (ref1 = config.speed) != null ? ref1 : new Vec2;
      this.world = config.world;
    }

    _Object.prototype.update = function() {
      if (!(this instanceof ParticleSystem)) {
        this.speed.add(this.world.params.gravity);
      }
      return this.loc.add(this.speed);
    };

    _Object.prototype.notVisible = function(threshold) {
      return this.loc.y > this.world.canvasHeight + threshold || this.loc.y < -threshold || this.loc.x > this.world.canvasWidth + threshold || this.loc.x < -threshold;
    };

    _Object.prototype.setControllable = function() {
      this.world.controllable = this;
      return this.loc = this.world.mouse;
    };

    return _Object;

  })();

  ParticleSystem = (function(superClass) {
    extend(ParticleSystem, superClass);

    function ParticleSystem(config) {
      var ref, ref1, ref2, ref3, ref4;
      ParticleSystem.__super__.constructor.call(this, config);
      this.particles = [];
      this.maxParticles = (ref = config.maxParticles) != null ? ref : 3000;
      this.particleLife = (ref1 = config.particleLife) != null ? ref1 : 60;
      this.particleSize = (ref2 = config.particleSize) != null ? ref2 : 24;
      this.creationRate = (ref3 = config.creationRate) != null ? ref3 : 4;
      this.scatter = (ref4 = config.scatter) != null ? ref4 : 1.3;
    }

    ParticleSystem.prototype.addParticle = function(config) {
      config.system = this;
      config.world = this.world;
      return this.particles.push(new Particle(config));
    };

    ParticleSystem.prototype.removeParticle = function(index) {
      return this.particles.splice(index, 1);
    };

    ParticleSystem.prototype.update = function() {
      var i, ind, j, k, len, particle, ref, ref1, results;
      ParticleSystem.__super__.update.apply(this, arguments);
      if (!(this.particles.length > this.maxParticles)) {
        for (i = j = 0, ref = this.creationRate; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
          this.addParticle({
            loc: this.loc.copy(),
            speed: Vec2.getRandom(-this.scatter, this.scatter)
          });
        }
      }
      ref1 = this.particles;
      results = [];
      for (ind = k = 0, len = ref1.length; k < len; ind = ++k) {
        particle = ref1[ind];
        if (particle) {
          results.push(particle.update(ind));
        }
      }
      return results;
    };

    ParticleSystem.prototype.draw = function() {
      var j, len, particle, ref, results;
      ref = this.particles;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        particle = ref[j];
        results.push(particle.draw());
      }
      return results;
    };

    return ParticleSystem;

  })(_Object);

  Particle = (function(superClass) {
    extend(Particle, superClass);

    function Particle(config) {
      Particle.__super__.constructor.call(this, config);
      this.system = config.system;
      this.initialLife = this.system.particleLife;
      this.life = this.initialLife;
      this.size = this.system.particleSize;
    }

    Particle.prototype.update = function(ind) {
      Particle.__super__.update.apply(this, arguments);
      this.size = Math.max(0, this.system.particleSize * (this.life-- / this.initialLife));
      if (this.notVisible(100 || this.life < 0)) {
        return this.system.removeParticle(ind);
      }
    };

    Particle.prototype.draw = function() {
      var grad;
      this.world.ctx.globalCompositeOperation = "lighter";
      this.world.ctx.globalAlpha = this.life / this.initialLife;
      grad = this.world.ctx.createRadialGradient(this.loc.x, this.loc.y, 0, this.loc.x, this.loc.y, this.size);
      grad.addColorStop(0, "rgba(255,255,255,.5)");
      grad.addColorStop(.3, "rgba(255,255,255,.3)");
      grad.addColorStop(1, "transparent");
      this.world.ctx.fillStyle = grad;
      this.world.ctx.beginPath();
      this.world.ctx.arc(this.loc.x, this.loc.y, this.size, 0, 2 * Math.PI);
      return this.world.ctx.fill();
    };

    return Particle;

  })(_Object);

  test = new World(document.getElementById('canvas'));

  test.addObject(ParticleSystem, {
    loc: new Vec2(200, 400),
    particleSize: 30,
    particleLife: 55,
    scatter: 0.4
  }, true);

  test.addObject(ParticleSystem, {
    loc: new Vec2(200, 400),
    particleSize: 6,
    particleLife: 80,
    scatter: 1.6
  }, true);

  test.start();

}).call(this);
