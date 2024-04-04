"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
/*
Waits until node is ready to receive traffic. It's used to wait for local environment setup.
 */
async function main() {
    const maxAttempts = 30;
    const provider = src_1.Provider.getDefaultProvider();
    for (let i = 0; i < maxAttempts; i++) {
        try {
            await provider.getNetwork();
            return;
        }
        catch (error) {
            await src_1.utils.sleep(20000);
        }
    }
    throw new Error('Maximum retries exceeded.');
}
main()
    .then()
    .catch(error => {
    console.log(`Error: ${error}`);
});
//# sourceMappingURL=wait.js.map