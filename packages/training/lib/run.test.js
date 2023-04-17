"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_1 = require("../src/run");
test('run successfully', async () => {
    await expect((0, run_1.run)({ name: 'foo' })).resolves.toBeUndefined();
});
