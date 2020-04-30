"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Particle_1 = require("./Particle");
var PolygonMaskType_1 = require("../Enums/PolygonMaskType");
var PolygonMaskInlineArrangement_1 = require("../Enums/PolygonMaskInlineArrangement");
var InteractionManager_1 = require("./Interactions/Particles/InteractionManager");
var SpatialGrid_1 = require("./Utils/SpatialGrid");
var Utils_1 = require("./Utils/Utils");
var HoverMode_1 = require("../Enums/Modes/HoverMode");
var Grabber_1 = require("./Interactions/Mouse/Grabber");
var ClickMode_1 = require("../Enums/Modes/ClickMode");
var Repulser_1 = require("./Interactions/Mouse/Repulser");
var DivMode_1 = require("../Enums/Modes/DivMode");
var Bubbler_1 = require("./Interactions/Mouse/Bubbler");
var Connector_1 = require("./Interactions/Mouse/Connector");
var Particles = (function () {
    function Particles(container) {
        this.container = container;
        this.array = [];
        this.interactionsEnabled = false;
        this.spatialGrid = new SpatialGrid_1.SpatialGrid(this.container.canvas.size);
    }
    Object.defineProperty(Particles.prototype, "count", {
        get: function () {
            return this.array.length;
        },
        enumerable: true,
        configurable: true
    });
    Particles.prototype.init = function () {
        var container = this.container;
        var options = container.options;
        if (options.polygon.enable && options.polygon.type === PolygonMaskType_1.PolygonMaskType.inline &&
            (options.polygon.inline.arrangement === PolygonMaskInlineArrangement_1.PolygonMaskInlineArrangement.onePerPoint ||
                options.polygon.inline.arrangement === PolygonMaskInlineArrangement_1.PolygonMaskInlineArrangement.perPoint)) {
            container.polygon.drawPointsOnPolygonPath();
        }
        else {
            for (var i = this.array.length; i < options.particles.number.value; i++) {
                this.addParticle(new Particle_1.Particle(container));
            }
        }
        this.interactionsEnabled = options.particles.lineLinked.enable ||
            options.particles.move.attract.enable ||
            options.particles.collisions.enable;
    };
    Particles.prototype.redraw = function () {
        this.clear();
        this.init();
        this.draw(0);
    };
    Particles.prototype.removeAt = function (index, quantity) {
        if (index >= 0 && index <= this.count) {
            for (var _i = 0, _a = this.array.splice(index, quantity !== null && quantity !== void 0 ? quantity : 1); _i < _a.length; _i++) {
                var particle = _a[_i];
                particle.destroy();
            }
        }
    };
    Particles.prototype.remove = function (particle) {
        this.removeAt(this.array.indexOf(particle));
    };
    Particles.prototype.update = function (delta) {
        var container = this.container;
        var options = container.options;
        for (var i = 0; i < this.array.length; i++) {
            var particle = this.array[i];
            Bubbler_1.Bubbler.reset(particle);
            var stillExists = true;
            for (var _i = 0, _a = container.absorbers; _i < _a.length; _i++) {
                var absorber = _a[_i];
                stillExists = absorber.attract(particle);
                if (!stillExists) {
                    break;
                }
            }
            if (!stillExists) {
                continue;
            }
            particle.update(i, delta);
        }
        var hoverMode = options.interactivity.events.onHover.mode;
        var clickMode = options.interactivity.events.onClick.mode;
        var divMode = options.interactivity.events.onDiv.mode;
        if (Utils_1.Utils.isInArray(HoverMode_1.HoverMode.grab, hoverMode)) {
            Grabber_1.Grabber.grab(container);
        }
        if (Utils_1.Utils.isInArray(HoverMode_1.HoverMode.repulse, hoverMode) ||
            Utils_1.Utils.isInArray(ClickMode_1.ClickMode.repulse, clickMode) ||
            Utils_1.Utils.isInArray(DivMode_1.DivMode.repulse, divMode)) {
            Repulser_1.Repulser.repulse(container);
        }
        if (Utils_1.Utils.isInArray(HoverMode_1.HoverMode.bubble, hoverMode) || Utils_1.Utils.isInArray(ClickMode_1.ClickMode.bubble, clickMode)) {
            Bubbler_1.Bubbler.bubble(container);
        }
        if (Utils_1.Utils.isInArray(HoverMode_1.HoverMode.connect, hoverMode)) {
            Connector_1.Connector.connect(container);
        }
        for (var _b = 0, _c = this.array; _b < _c.length; _b++) {
            var particle = _c[_b];
            if (this.interactionsEnabled) {
                InteractionManager_1.InteractionManager.interact(particle, container);
            }
        }
    };
    Particles.prototype.draw = function (delta) {
        var container = this.container;
        var options = container.options;
        container.canvas.clear();
        this.update(delta);
        this.spatialGrid.setGrid(this.array, this.container.canvas.size);
        if (options.polygon.enable && options.polygon.draw.enable) {
            container.polygon.drawPolygon();
        }
        for (var _i = 0, _a = container.absorbers; _i < _a.length; _i++) {
            var absorber = _a[_i];
            absorber.draw();
        }
        for (var _b = 0, _c = this.array; _b < _c.length; _b++) {
            var p = _c[_b];
            p.draw();
        }
    };
    Particles.prototype.clear = function () {
        this.array = [];
    };
    Particles.prototype.push = function (nb, mousePosition) {
        var _a;
        var container = this.container;
        var options = container.options;
        this.pushing = true;
        if (options.particles.number.limit > 0) {
            if ((this.array.length + nb) > options.particles.number.limit) {
                this.removeQuantity((this.array.length + nb) - options.particles.number.limit);
            }
        }
        var pos;
        if (mousePosition) {
            pos = (_a = mousePosition.position) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
        }
        for (var i = 0; i < nb; i++) {
            this.addParticle(new Particle_1.Particle(container, pos));
        }
        if (!options.particles.move.enable) {
            this.container.play();
        }
        this.pushing = false;
    };
    Particles.prototype.addParticle = function (particle) {
        this.array.push(particle);
    };
    Particles.prototype.removeQuantity = function (quantity) {
        var container = this.container;
        var options = container.options;
        this.removeAt(0, quantity);
        if (!options.particles.move.enable) {
            this.container.play();
        }
    };
    return Particles;
}());
exports.Particles = Particles;
