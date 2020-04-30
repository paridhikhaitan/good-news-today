"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Presets = (function () {
    function Presets() {
    }
    Presets.getPreset = function (preset) {
        return this.presets[preset];
    };
    Presets.addPreset = function (presetKey, options) {
        if (!this.presets[presetKey]) {
            this.presets[presetKey] = options;
        }
    };
    Presets.presets = {};
    return Presets;
}());
exports.Presets = Presets;
