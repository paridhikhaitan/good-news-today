"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var Canvas_1 = require("./Canvas");
var EventListeners_1 = require("./Utils/EventListeners");
var Particles_1 = require("./Particles");
var Retina_1 = require("./Retina");
var ShapeType_1 = require("../Enums/ShapeType");
var PolygonMask_1 = require("./PolygonMask");
var FrameManager_1 = require("./FrameManager");
var Options_1 = require("./Options/Options");
var Utils_1 = require("./Utils/Utils");
var Presets_1 = require("./Utils/Presets");
var Emitter_1 = require("./Emitter");
var Absorber_1 = require("./Absorber");
var Container = (function () {
    function Container(id, params) {
        var presets = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            presets[_i - 2] = arguments[_i];
        }
        this.started = false;
        this.destroyed = false;
        this.id = id;
        this.paused = true;
        this.sourceOptions = params;
        this.lastFrameTime = 0;
        this.pageHidden = false;
        this.retina = new Retina_1.Retina(this);
        this.canvas = new Canvas_1.Canvas(this);
        this.particles = new Particles_1.Particles(this);
        this.polygon = new PolygonMask_1.PolygonMask(this);
        this.drawer = new FrameManager_1.FrameManager(this);
        this.interactivity = {
            mouse: {},
        };
        this.images = [];
        this.bubble = {};
        this.repulse = { particles: [] };
        this.emitters = [];
        this.absorbers = [];
        this.options = new Options_1.Options();
        for (var _a = 0, presets_1 = presets; _a < presets_1.length; _a++) {
            var preset = presets_1[_a];
            this.options.load(Presets_1.Presets.getPreset(preset));
        }
        if (this.sourceOptions) {
            this.options.load(this.sourceOptions);
        }
        this.eventListeners = new EventListeners_1.EventListeners(this);
    }
    Container.requestFrame = function (callback) {
        return window.customRequestAnimationFrame(callback);
    };
    Container.cancelAnimation = function (handle) {
        window.cancelAnimationFrame(handle);
    };
    Container.prototype.play = function () {
        var _this = this;
        if (this.paused) {
            this.lastFrameTime = performance.now();
            this.paused = false;
            for (var _i = 0, _a = this.emitters; _i < _a.length; _i++) {
                var emitter = _a[_i];
                emitter.start();
            }
        }
        this.drawAnimationFrame = Container.requestFrame(function (t) { return _this.drawer.nextFrame(t); });
    };
    Container.prototype.pause = function () {
        if (this.drawAnimationFrame !== undefined) {
            for (var _i = 0, _a = this.emitters; _i < _a.length; _i++) {
                var emitter = _a[_i];
                emitter.stop();
            }
            Container.cancelAnimation(this.drawAnimationFrame);
            delete this.drawAnimationFrame;
            this.paused = true;
        }
    };
    Container.prototype.densityAutoParticles = function () {
        if (!(this.canvas.element && this.options.particles.number.density.enable)) {
            return;
        }
        var area = this.canvas.element.width * this.canvas.element.height / 1000;
        if (this.retina.isRetina) {
            area /= this.retina.pixelRatio * 2;
        }
        var optParticlesNumber = this.options.particles.number.value;
        var density = this.options.particles.number.density.area;
        var particlesNumber = area * optParticlesNumber / density;
        var particlesCount = this.particles.count;
        if (particlesCount < particlesNumber) {
            this.particles.push(Math.abs(particlesNumber - particlesCount));
        }
        else if (particlesCount > particlesNumber) {
            this.particles.removeQuantity(particlesCount - particlesNumber);
        }
    };
    Container.prototype.destroy = function () {
        this.stop();
        this.retina.reset();
        this.canvas.destroy();
        delete this.interactivity;
        delete this.options;
        delete this.retina;
        delete this.canvas;
        delete this.particles;
        delete this.polygon;
        delete this.bubble;
        delete this.repulse;
        delete this.images;
        delete this.drawer;
        delete this.eventListeners;
        this.destroyed = true;
    };
    Container.prototype.exportImg = function (callback) {
        this.exportImage(callback);
    };
    Container.prototype.exportImage = function (callback, type, quality) {
        var _a;
        return (_a = this.canvas.element) === null || _a === void 0 ? void 0 : _a.toBlob(callback, type !== null && type !== void 0 ? type : "image/png", quality);
    };
    Container.prototype.exportConfiguration = function () {
        return JSON.stringify(this.options, undefined, 2);
    };
    Container.prototype.refresh = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.stop();
                        return [4, this.start()];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        });
    };
    Container.prototype.stop = function () {
        if (!this.started) {
            return;
        }
        this.started = false;
        this.eventListeners.removeListeners();
        this.pause();
        this.images = [];
        this.particles.clear();
        this.retina.reset();
        this.canvas.clear();
        this.polygon.reset();
        this.emitters = [];
        this.absorbers = [];
        delete this.particles.lineLinkedColor;
    };
    Container.prototype.start = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _i, _a, character, character, _b, _c, optionsImage;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (this.started) {
                            return [2];
                        }
                        this.started = true;
                        this.eventListeners.addListeners();
                        return [4, this.polygon.init()];
                    case 1:
                        _d.sent();
                        if (!(Utils_1.Utils.isInArray(ShapeType_1.ShapeType.char, this.options.particles.shape.type) ||
                            Utils_1.Utils.isInArray(ShapeType_1.ShapeType.character, this.options.particles.shape.type))) return [3, 8];
                        if (!(this.options.particles.shape.character instanceof Array)) return [3, 6];
                        _i = 0, _a = this.options.particles.shape.character;
                        _d.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3, 5];
                        character = _a[_i];
                        return [4, Utils_1.Utils.loadFont(character)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5: return [3, 8];
                    case 6:
                        character = this.options.particles.shape.character;
                        if (!(character !== undefined)) return [3, 8];
                        return [4, Utils_1.Utils.loadFont(character)];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8:
                        if (!(Utils_1.Utils.isInArray(ShapeType_1.ShapeType.image, this.options.particles.shape.type) ||
                            Utils_1.Utils.isInArray(ShapeType_1.ShapeType.images, this.options.particles.shape.type))) return [3, 15];
                        if (!(this.options.particles.shape.image instanceof Array)) return [3, 13];
                        _b = 0, _c = this.options.particles.shape.image;
                        _d.label = 9;
                    case 9:
                        if (!(_b < _c.length)) return [3, 12];
                        optionsImage = _c[_b];
                        return [4, this.loadImageShape(optionsImage)];
                    case 10:
                        _d.sent();
                        _d.label = 11;
                    case 11:
                        _b++;
                        return [3, 9];
                    case 12: return [3, 15];
                    case 13: return [4, this.loadImageShape(this.options.particles.shape.image)];
                    case 14:
                        _d.sent();
                        _d.label = 15;
                    case 15:
                        this.init();
                        this.play();
                        return [2];
                }
            });
        });
    };
    Container.prototype.loadImageShape = function (imageShape) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        _b = (_a = this.images).push;
                        return [4, Utils_1.Utils.loadImage(imageShape)];
                    case 1:
                        _b.apply(_a, [_d.sent()]);
                        return [3, 3];
                    case 2:
                        _c = _d.sent();
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    Container.prototype.init = function () {
        this.retina.init();
        this.canvas.init();
        this.particles.init();
        if (this.options.emitters instanceof Array) {
            for (var _i = 0, _a = this.options.emitters; _i < _a.length; _i++) {
                var emitterOptions = _a[_i];
                var emitter = new Emitter_1.Emitter(this, emitterOptions);
                this.emitters.push(emitter);
            }
        }
        else {
            var emitterOptions = this.options.emitters;
            var emitter = new Emitter_1.Emitter(this, emitterOptions);
            this.emitters.push(emitter);
        }
        if (this.options.absorbers instanceof Array) {
            for (var _b = 0, _c = this.options.absorbers; _b < _c.length; _b++) {
                var absorberOptions = _c[_b];
                var absorber = new Absorber_1.Absorber(this, absorberOptions);
                this.absorbers.push(absorber);
            }
        }
        else {
            var absorberOptions = this.options.absorbers;
            var absorber = new Absorber_1.Absorber(this, absorberOptions);
            this.absorbers.push(absorber);
        }
        this.densityAutoParticles();
    };
    return Container;
}());
exports.Container = Container;
