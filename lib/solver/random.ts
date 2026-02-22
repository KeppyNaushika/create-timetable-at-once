// シード付き乱数生成器 (xoshiro128**)
export class SeededRandom {
  private state: [number, number, number, number]

  constructor(seed?: number) {
    seed = seed ?? Date.now()
    // Initialize state from seed using splitmix32
    let s = seed | 0
    const splitmix32 = (): number => {
      s = (s + 0x9e3779b9) | 0
      let t = s ^ (s >>> 16)
      t = Math.imul(t, 0x21f0aaad)
      t = t ^ (t >>> 15)
      t = Math.imul(t, 0x735a2d97)
      t = t ^ (t >>> 15)
      return t >>> 0
    }
    this.state = [splitmix32(), splitmix32(), splitmix32(), splitmix32()]
  }

  // Returns [0, 1)
  next(): number {
    const [s0, s1, s2, s3] = this.state
    const result = Math.imul(s1 * 5, 7) >>> 0
    const t = s1 << 9

    this.state[2] = s2 ^ s0
    this.state[3] = s3 ^ s1
    this.state[1] = s1 ^ s2
    this.state[0] = s0 ^ s3
    this.state[2] = s2 ^ t
    this.state[3] = (s3 << 11) | (s3 >>> 21)

    return (result >>> 0) / 4294967296
  }

  // Returns integer in [min, max]
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  // Fisher-Yates shuffle
  shuffle<T>(array: T[]): T[] {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i)
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  // Pick random element
  pick<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)]
  }
}
