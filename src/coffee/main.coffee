################################
##########   Vec2
################################

class Vec2
	constructor: (x,y) ->
		@x = x ? 0
		@y = y ? 0
	add: (vec) ->
		@x += vec.x
		@y += vec.y
		return @
	copy: -> new Vec2 @x, @y
	@getRandom: (min, max) ->
		new Vec2 do Math.random * (max - min) + min,
			do Math.random * (max - min) + min


################################
##########   WORLD
################################

class World
	constructor: (@canvas) ->
		@ctx = @canvas.getContext '2d'
		@canvasWidth = @canvas.width = 400
		@canvasHeight = @canvas.height = 500

		@objects = []

		@controllable = {}
		@mouse = new Vec2 @canvasWidth/2, @canvasHeight/2

		@params =
			gravity: new Vec2 0, -.2

		@canvas.addEventListener "mousemove",( (e) =>
			[@mouse.x, @mouse.y] = [e.offsetX, e.offsetY]
		), no

		@canvas.addEventListener "touchmove",( (e) =>
			do e.preventDefault
			console.log e
			# [@mouse.x, @mouse.y] = [e.offsetX, e.offsetY]
			@mouse.x =  e.touches[0].pageX - e.touches[0].target.offsetLeft
			@mouse.y =  e.touches[0].pageY - e.touches[0].target.offsetTop
		), no

		@canvas.addEventListener "mousewheel", ((e) =>
			do e.preventDefault
			if @controllable instanceof ParticleSystem
				if e.shiftKey
					@controllable.scatter = Math.max 0, @controllable.scatter - e.wheelDelta / 100
				else if e.altKey
					@controllable.particleSize = Math.max 0, @controllable.particleSize - e.wheelDelta / 100
				else 
					@controllable.particleLife = Math.max 1, @controllable.particleLife - e.wheelDelta / 10
		),no

	addObject: (constructor, config, controllable) ->
		config.world = @
		obj = new constructor config
		do obj.setControllable if controllable
		@objects.push obj

	removeObject: (index) ->
		@objects.splice(index,1)

	start: -> do @tick

	tick: ->
		do @update
		do @draw
		requestAnimationFrame @tick.bind @

	update: ->
		object.update ind for object, ind in @objects when object

	draw: ->
		@ctx.clearRect 0, 0, @canvasWidth, @canvasHeight
		@ctx.globalAlpha = 1
		do object.draw for object in @objects



################################
##########   Vec2
################################

class _Object
	constructor: (config) ->
		@loc = config.loc ? new Vec2
		@speed = config.speed ? new Vec2
		@world = config.world

	update: ->
		unless @ instanceof ParticleSystem
			@speed.add @world.params.gravity
		@loc.add @speed

	notVisible: (threshold) ->
		@loc.y > @world.canvasHeight + threshold or
		@loc.y < -threshold or
		@loc.x > @world.canvasWidth + threshold or
		@loc.x < -threshold

	setControllable: ->
		@world.controllable = @
		@loc = @world.mouse


################################
##########   ParticleSystem
################################

class ParticleSystem extends _Object
	constructor: (config) ->
		super config
		@particles = []
		@maxParticles = config.maxParticles ? 3000
		@particleLife = config.particleLife ? 60
		@particleSize = config.particleSize ? 24
		@creationRate = config.creationRate ? 4
		@scatter = config.scatter ? 1.3

	addParticle: (config) ->
		config.system = @
		config.world = @world
		@particles.push new Particle config

	removeParticle: (index) -> @particles.splice(index, 1)

	update: ->
		super
		unless @particles.length > @maxParticles
			for i in [0...@creationRate]
				@addParticle {
					loc: do @loc.copy
					speed: Vec2.getRandom -@scatter, @scatter
				}
		particle.update ind for particle, ind in @particles when particle

	draw: ->
		do particle.draw for particle in @particles



################################
##########   Particle
################################

class Particle extends _Object
	constructor: (config) ->
		super config
		@system = config.system
		@initialLife = @system.particleLife
		@life = @initialLife
		@size = @system.particleSize

	update: (ind) ->
		super
		@size = Math.max 0, @system.particleSize * (@life-- / @initialLife)
		if @notVisible 100 or @life < 0 then @system.removeParticle ind

	draw: ->
		@world.ctx.globalCompositeOperation = "lighter"
		@world.ctx.globalAlpha = @life / @initialLife
		grad = @world.ctx.createRadialGradient @loc.x, @loc.y, 0, @loc.x, @loc.y, @size
		grad.addColorStop 0, "rgba(255,255,255,.5)"
		grad.addColorStop .3, "rgba(255,255,255,.3)"
		grad.addColorStop 1, "transparent"
		@world.ctx.fillStyle = grad

		do @world.ctx.beginPath
		@world.ctx.arc @loc.x, @loc.y, @size, 0, 2 * Math.PI
		do @world.ctx.fill

################################
##########   code
################################

test = new World document.getElementById 'canvas'

test.addObject ParticleSystem, {
	loc: new Vec2 200, 400
	particleSize: 30
	particleLife: 55
	scatter: 0.4
}, on


do test.start