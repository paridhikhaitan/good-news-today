"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const spec_1 = require("@hayspec/spec");
const all = require("..");
const spec = new spec_1.Spec();
spec.test('exposes objects', (ctx) => {
    ctx.true(!!all.MongoCron);
});
exports.default = spec;
//# sourceMappingURL=index.test.js.map