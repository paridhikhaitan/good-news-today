"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ImageDrawer = (function () {
    function ImageDrawer() {
    }
    ImageDrawer.prototype.draw = function (context, particle, radius, opacity) {
        var _a, _b;
        if (!context) {
            return;
        }
        var imgObj = (_b = (_a = particle.image) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.obj;
        if (!imgObj) {
            return;
        }
        var ratio = 1;
        if (particle.image) {
            ratio = particle.image.ratio;
        }
        var pos = {
            x: -radius,
            y: -radius,
        };
        context.globalAlpha = opacity;
        context.drawImage(imgObj, pos.x, pos.y, radius * 2, radius * 2 / ratio);
        context.globalAlpha = 1;
    };
    return ImageDrawer;
}());
exports.ImageDrawer = ImageDrawer;
