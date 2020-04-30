"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SizeAnimation = (function () {
    function SizeAnimation() {
        this.enable = false;
        this.minimumValue = 0;
        this.speed = 5;
        this.sync = false;
    }
    Object.defineProperty(SizeAnimation.prototype, "size_min", {
        get: function () {
            return this.minimumValue;
        },
        set: function (value) {
            this.minimumValue = value;
        },
        enumerable: true,
        configurable: true
    });
    SizeAnimation.prototype.load = function (data) {
        var _a;
        if (data !== undefined) {
            if (data.enable !== undefined) {
                this.enable = data.enable;
            }
            var minimumValue = (_a = data.minimumValue) !== null && _a !== void 0 ? _a : data.size_min;
            if (minimumValue !== undefined) {
                this.minimumValue = minimumValue;
            }
            if (data.speed !== undefined) {
                this.speed = data.speed;
            }
            if (data.sync !== undefined) {
                this.sync = data.sync;
            }
        }
    };
    return SizeAnimation;
}());
exports.SizeAnimation = SizeAnimation;
