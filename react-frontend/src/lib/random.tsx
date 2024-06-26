// Implementation of simple pseudo-random number generator (PRNG), using
// the Linear Congruential Generator (LCG) algorithm

class SeededRandom {
  private seed: number

  constructor (seed: string) {
    // Convert the seed string to a number using a simple hash function
    this.seed = this.hashCode(seed)
  }

  // Simple hash function to convert a string to a number
  private hashCode (str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0 // Convert to 32-bit integer
    }
    return hash
  }

  // LCG constants
  private readonly a = 1664525
  private readonly c = 1013904223
  private readonly m = 2 ** 32

  // Generate a pseudo-random number between 0 and 1
  public next (): number {
    this.seed = (this.a * this.seed + this.c) % this.m
    return this.seed / this.m
  }
}

export default SeededRandom
