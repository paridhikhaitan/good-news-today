"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("../../Utils/Utils");
var CollisionMode_1 = require("../../../Enums/CollisionMode");
var Collider = (function () {
    function Collider() {
    }
    Collider.collide = function (p1, container) {
        for (var _i = 0, _a = container.particles.spatialGrid.queryRadius(p1.position, p1.size.value * 2); _i < _a.length; _i++) {
            var p2 = _a[_i];
            if (p1 === p2 || !p2.particlesOptions.collisions.enable ||
                p1.particlesOptions.collisions.mode !== p2.particlesOptions.collisions.mode) {
                continue;
            }
            var pos1 = {
                x: p1.position.x + p1.offset.x,
                y: p1.position.y + p1.offset.y
            };
            var pos2 = {
                x: p2.position.x + p2.offset.x,
                y: p2.position.y + p2.offset.y
            };
            var dist = Utils_1.Utils.getDistanceBetweenCoordinates(pos1, pos2);
            var defaultSize = container.retina.sizeValue;
            var radius1 = this.getRadius(p1, defaultSize);
            var radius2 = this.getRadius(p2, defaultSize);
            var distP = radius1 + radius2;
            if (dist <= distP) {
                this.resolveCollision(p1, p2);
            }
        }
    };
    Collider.getRadius = function (particle, fallback) {
        return particle.bubble.radius || particle.size.value || fallback;
    };
    Collider.resolveCollision = function (p1, p2) {
        var pos1 = {
            x: p1.position.x + p1.offset.x,
            y: p1.position.y + p1.offset.y
        };
        var pos2 = {
            x: p2.position.x + p2.offset.x,
            y: p2.position.y + p2.offset.y
        };
        switch (p1.particlesOptions.collisions.mode) {
            case CollisionMode_1.CollisionMode.bounce:
                var xVelocityDiff = p1.velocity.horizontal - p2.velocity.horizontal;
                var yVelocityDiff = p1.velocity.vertical - p2.velocity.vertical;
                var xDist = pos2.x - pos1.x;
                var yDist = pos2.y - pos1.y;
                if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {
                    var angle = -Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x);
                    var m1 = p1.size.value;
                    var m2 = p2.size.value;
                    var u1 = this.rotate(p1.velocity, angle);
                    var u2 = this.rotate(p2.velocity, angle);
                    var v1 = {
                        horizontal: u1.horizontal * (m1 - m2) / (m1 + m2) + u2.horizontal * 2 * m2 / (m1 + m2),
                        vertical: u1.vertical,
                    };
                    var v2 = {
                        horizontal: u2.horizontal * (m1 - m2) / (m1 + m2) + u1.horizontal * 2 * m2 / (m1 + m2),
                        vertical: u2.vertical,
                    };
                    var vFinal1 = this.rotate(v1, -angle);
                    var vFinal2 = this.rotate(v2, -angle);
                    p1.velocity.horizontal = vFinal1.horizontal;
                    p1.velocity.vertical = vFinal1.vertical;
                    p2.velocity.horizontal = vFinal2.horizontal;
                    p2.velocity.vertical = vFinal2.vertical;
                }
        }
    };
    Collider.rotate = function (velocity, angle) {
        return {
            horizontal: velocity.horizontal * Math.cos(angle) - velocity.vertical * Math.sin(angle),
            vertical: velocity.horizontal * Math.sin(angle) + velocity.vertical * Math.cos(angle),
        };
    };
    return Collider;
}());
exports.Collider = Collider;
