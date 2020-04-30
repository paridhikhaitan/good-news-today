"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ColorUtils_1 = require("../../Utils/ColorUtils");
var Constants_1 = require("../../Utils/Constants");
var Linker = (function () {
    function Linker() {
    }
    Linker.link = function (p1, container) {
        var _a;
        var optOpacity = p1.particlesOptions.lineLinked.opacity;
        var optDistance = (_a = p1.lineLinkedDistance) !== null && _a !== void 0 ? _a : container.retina.lineLinkedDistance;
        var pos = {
            x: p1.position.x + p1.offset.x,
            y: p1.position.y + p1.offset.y,
        };
        for (var _i = 0, _b = container.particles.spatialGrid.queryRadiusWithDistance(pos, optDistance); _i < _b.length; _i++) {
            var p2 = _b[_i];
            if (p1 === p2.particle || !p2.particle.particlesOptions.lineLinked.enable) {
                continue;
            }
            var opacityLine = optOpacity - (p2.distance * optOpacity) / optDistance;
            if (opacityLine > 0) {
                if (!container.particles.lineLinkedColor) {
                    var optColor = p1.particlesOptions.lineLinked.color;
                    var color = typeof optColor === "string" ? optColor : optColor.value;
                    if (color === Constants_1.Constants.randomColorValue) {
                        if (p1.particlesOptions.lineLinked.consent) {
                            container.particles.lineLinkedColor = ColorUtils_1.ColorUtils.colorToRgb({ value: color });
                        }
                        else if (p1.particlesOptions.lineLinked.blink) {
                            container.particles.lineLinkedColor = Constants_1.Constants.randomColorValue;
                        }
                        else {
                            container.particles.lineLinkedColor = Constants_1.Constants.midColorValue;
                        }
                    }
                    else {
                        container.particles.lineLinkedColor = ColorUtils_1.ColorUtils.colorToRgb({ value: color });
                    }
                }
                if (p2.particle.links.indexOf(p1) == -1 && p1.links.indexOf(p2.particle) == -1) {
                    p1.links.push(p2.particle);
                    container.canvas.drawLinkedLine(p1, p2.particle, opacityLine);
                }
            }
        }
    };
    return Linker;
}());
exports.Linker = Linker;
