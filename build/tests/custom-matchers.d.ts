declare global {
    namespace Chai {
        interface Assertion {
            deepEqualExcluding(expected: Record<string, any>, excludeFields: string[]): Assertion;
        }
    }
}
export {};
