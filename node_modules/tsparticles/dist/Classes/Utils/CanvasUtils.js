"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ColorUtils_1 = require("./ColorUtils");
var CanvasUtils = (function () {
    function CanvasUtils() {
    }
    CanvasUtils.paintBase = function (context, dimension, baseColor) {
        context.save();
        context.fillStyle = baseColor !== null && baseColor !== void 0 ? baseColor : "rgba(0,0,0,0)";
        context.fillRect(0, 0, dimension.width, dimension.height);
        context.restore();
    };
    CanvasUtils.clear = function (context, dimension) {
        context.clearRect(0, 0, dimension.width, dimension.height);
    };
    CanvasUtils.drawPolygonMask = function (context, rawData, stroke) {
        var color = typeof stroke.color === "string" ?
            ColorUtils_1.ColorUtils.stringToRgb(stroke.color) :
            ColorUtils_1.ColorUtils.colorToRgb(stroke.color);
        if (color) {
            context.save();
            context.beginPath();
            context.moveTo(rawData[0].x, rawData[0].y);
            for (var i = 1; i < rawData.length; i++) {
                context.lineTo(rawData[i].x, rawData[i].y);
            }
            context.closePath();
            context.strokeStyle = ColorUtils_1.ColorUtils.getStyleFromColor(color);
            context.lineWidth = stroke.width;
            context.stroke();
            context.restore();
        }
    };
    CanvasUtils.drawPolygonMaskPath = function (context, path, stroke, position) {
        context.save();
        context.translate(position.x, position.y);
        var color = typeof stroke.color === "string" ?
            ColorUtils_1.ColorUtils.stringToRgb(stroke.color) :
            ColorUtils_1.ColorUtils.colorToRgb(stroke.color);
        if (color) {
            context.strokeStyle = ColorUtils_1.ColorUtils.getStyleFromColor(color, stroke.opacity);
            context.lineWidth = stroke.width;
            context.stroke(path);
        }
        context.restore();
    };
    CanvasUtils.drawAbsorber = function (context, absorber) {
        context.save();
        context.translate(absorber.position.x, absorber.position.y);
        context.beginPath();
        context.arc(0, 0, absorber.size, 0, Math.PI * 2, false);
        context.closePath();
        context.fillStyle = ColorUtils_1.ColorUtils.getStyleFromColor(absorber.color, absorber.opacity);
        context.fill();
        context.restore();
    };
    CanvasUtils.drawLineLinked = function (context, width, begin, end, backgroundMask, colorLine, opacity, shadow) {
        context.save();
        context.lineWidth = width;
        context.beginPath();
        context.moveTo(begin.x, begin.y);
        context.lineTo(end.x, end.y);
        context.closePath();
        if (backgroundMask) {
            context.globalCompositeOperation = 'destination-out';
        }
        if (colorLine) {
            context.strokeStyle = ColorUtils_1.ColorUtils.getStyleFromColor(colorLine, opacity);
        }
        var shadowColor = typeof shadow.color === "string" ?
            ColorUtils_1.ColorUtils.stringToRgb(shadow.color) :
            ColorUtils_1.ColorUtils.colorToRgb(shadow.color);
        if (shadow.enable && shadowColor) {
            context.shadowBlur = shadow.blur;
            context.shadowColor = ColorUtils_1.ColorUtils.getStyleFromColor(shadowColor);
        }
        context.stroke();
        context.restore();
    };
    CanvasUtils.drawConnectLine = function (context, width, lineStyle, begin, end) {
        context.save();
        context.beginPath();
        context.moveTo(begin.x, begin.y);
        context.lineTo(end.x, end.y);
        context.closePath();
        context.lineWidth = width;
        context.strokeStyle = lineStyle;
        context.stroke();
        context.restore();
    };
    CanvasUtils.gradient = function (context, p1, p2, opacity) {
        var gradStop = Math.floor(p2.size.value / p1.size.value);
        if (!p1.color || !p2.color) {
            return;
        }
        var sourcePos = {
            x: p1.position.x + p1.offset.x,
            y: p1.position.y + p1.offset.y
        };
        var destPos = {
            x: p2.position.x + p2.offset.x,
            y: p2.position.y + p2.offset.y
        };
        var midRgb = ColorUtils_1.ColorUtils.mix(p1.color, p2.color, p1.size.value, p2.size.value);
        var grad = context.createLinearGradient(sourcePos.x, sourcePos.y, destPos.x, destPos.y);
        grad.addColorStop(0, ColorUtils_1.ColorUtils.getStyleFromColor(p1.color, opacity));
        grad.addColorStop(gradStop > 1 ? 1 : gradStop, ColorUtils_1.ColorUtils.getStyleFromColor(midRgb, opacity));
        grad.addColorStop(1, ColorUtils_1.ColorUtils.getStyleFromColor(p2.color, opacity));
        return grad;
    };
    CanvasUtils.drawGrabLine = function (context, width, begin, end, colorLine, opacity) {
        context.save();
        context.beginPath();
        context.moveTo(begin.x, begin.y);
        context.lineTo(end.x, end.y);
        context.closePath();
        context.strokeStyle = ColorUtils_1.ColorUtils.getStyleFromColor(colorLine, opacity);
        context.lineWidth = width;
        context.stroke();
        context.restore();
    };
    CanvasUtils.drawParticle = function (context, particle, colorValue, backgroundMask, radius, opacity, shadow) {
        var pos = {
            x: particle.position.x + particle.offset.x,
            y: particle.position.y + particle.offset.y,
        };
        context.save();
        context.translate(pos.x, pos.y);
        context.beginPath();
        var shadowColor = particle.shadowColor;
        if (shadow.enable && shadowColor) {
            context.shadowBlur = shadow.blur;
            context.shadowColor = ColorUtils_1.ColorUtils.getStyleFromColor(shadowColor);
            context.shadowOffsetX = shadow.offset.x;
            context.shadowOffsetY = shadow.offset.y;
        }
        context.fillStyle = colorValue;
        if (particle.angle !== 0) {
            context.rotate(particle.angle * Math.PI / 180);
        }
        if (backgroundMask) {
            context.globalCompositeOperation = "destination-out";
        }
        var stroke = particle.stroke;
        if (stroke.width > 0 && particle.strokeColor) {
            context.strokeStyle = ColorUtils_1.ColorUtils.getStyleFromColor(particle.strokeColor, particle.stroke.opacity);
            context.lineWidth = stroke.width;
        }
        this.drawShape(context, particle, radius, opacity);
        if (particle.close) {
            context.closePath();
        }
        if (stroke.width > 0 && particle.strokeColor) {
            context.stroke();
        }
        if (particle.fill) {
            context.fill();
        }
        context.restore();
    };
    CanvasUtils.addShapeDrawer = function (type, drawer) {
        if (!this.drawers[type]) {
            this.drawers[type] = drawer;
        }
    };
    CanvasUtils.drawShape = function (context, particle, radius, opacity) {
        if (!particle.shape) {
            return;
        }
        var drawer = this.drawers[particle.shape];
        if (!drawer) {
            return;
        }
        drawer.draw(context, particle, radius, opacity);
    };
    CanvasUtils.drawers = {};
    return CanvasUtils;
}());
exports.CanvasUtils = CanvasUtils;
