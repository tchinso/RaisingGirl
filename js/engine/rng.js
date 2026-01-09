export class SeededRNG {
    constructor(seed) {
        this.seed = seed || Math.floor(Math.random() * 2147483647);
    }

    // Mulberry32 알고리즘
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    random() { return this.next(); }
    range(min, max) { return Math.floor(this.random() * (max - min + 1)) + min; }
    check(percentage) { return (this.random() * 100) < percentage; }
    getState() { return this.seed; }
    setState(seed) { this.seed = seed; }
}