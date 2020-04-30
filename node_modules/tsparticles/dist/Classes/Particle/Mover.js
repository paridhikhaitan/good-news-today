"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("../Utils/Utils");
var HoverMode_1 = require("../../Enums/Modes/HoverMode");
var Mover = (function () {
    function Mover(container, particle) {
        this.container = container;
        this.particle = particle;
    }
    Mover.prototype.move = function (delta) {
        var _a;
        var container = this.container;
        var options = container.options;
        var particle = this.particle;
        if (options.particles.move.enable) {
            var slowFactor = this.getProximitySpeedFactor();
            var deltaFactor = options.fpsLimit > 0 ? (60 * delta) / 1000 : 3.6;
            var baseSpeed = (_a = particle.moveSpeed) !== null && _a !== void 0 ? _a : container.retina.moveSpeed;
            var moveSpeed = baseSpeed / 2 * slowFactor * deltaFactor;
            particle.position.x += particle.velocity.horizontal * moveSpeed;
            particle.position.y += particle.velocity.vertical * moveSpeed;
        }
        this.moveParallax();
    };
    Mover.prototype.moveParallax = function () {
        var container = this.container;
        var options = container.options;
        if (!options.interactivity.events.onHover.parallax.enable) {
            return;
        }
        var particle = this.particle;
        var parallaxForce = options.interactivity.events.onHover.parallax.force;
        var mousePos = container.interactivity.mouse.position;
        if (!mousePos) {
            return;
        }
        var windowDimension = {
            height: window.innerHeight / 2,
            width: window.innerWidth / 2,
        };
        var parallaxSmooth = options.interactivity.events.onHover.parallax.smooth;
        var tmp = {
            x: (mousePos.x - windowDimension.width) * (particle.size.value / parallaxForce),
            y: (mousePos.y - windowDimension.height) * (particle.size.value / parallaxForce),
        };
        particle.offset.x += (tmp.x - particle.offset.x) / parallaxSmooth;
        particle.offset.y += (tmp.y - particle.offset.y) / parallaxSmooth;
    };
    Mover.prototype.getProximitySpeedFactor = function () {
        var container = this.container;
        var options = container.options;
        var particle = this.particle;
        var active = Utils_1.Utils.isInArray(HoverMode_1.HoverMode.slow, options.interactivity.events.onHover.mode);
        if (!active) {
            return 1;
        }
        var mousePos = this.container.interactivity.mouse.position;
        if (!mousePos) {
            return 1;
        }
        var particlePos = {
            x: particle.position.x + particle.offset.x,
            y: particle.position.y + particle.offset.y
        };
        var dist = Utils_1.Utils.getDistanceBetweenCoordinates(mousePos, particlePos);
        var radius = container.retina.slowModeRadius;
        if (dist > radius) {
            return 1;
        }
        var proximityFactor = (dist / radius) || 0;
        var slowFactor = options.interactivity.modes.slow.factor;
        return proximityFactor / slowFactor;
    };
    return Mover;
}());
exports.Mover = Mover;
