const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const TWO_PI = Math.PI * 2
const MIN_ACCEPTABLE_DISTANCE = 0.08

export interface SphericalPoint {
  theta: number
  phi: number
}

const fibonacciPoint = (index: number): SphericalPoint => {
  // 使用递增序列生成稳定的球面点位，避免新增点扎堆在局部区域
  const count = index + 1
  const z = 1 - (2 * (index + 0.5)) / count
  return {
    theta: normalizeTheta(index * GOLDEN_ANGLE),
    phi: clampPhi(Math.acos(z)),
  }
}

const normalizeTheta = (theta: number): number => {
  let t = theta % TWO_PI
  if (t < 0) {
    t += TWO_PI
  }
  return t
}

const clampPhi = (phi: number): number => {
  if (phi < 0.001) return 0.001
  if (phi > Math.PI - 0.001) return Math.PI - 0.001
  return phi
}

const toCartesian = (point: SphericalPoint): [number, number, number] => {
  const sinPhi = Math.sin(point.phi)
  return [sinPhi * Math.cos(point.theta), Math.cos(point.phi), sinPhi * Math.sin(point.theta)]
}

const cosineDistance = (a: SphericalPoint, b: SphericalPoint): number => {
  const [ax, ay, az] = toCartesian(a)
  const [bx, by, bz] = toCartesian(b)
  return 1 - (ax * bx + ay * by + az * bz)
}

const minDistance = (point: SphericalPoint, existing: SphericalPoint[]): number => {
  if (existing.length === 0) {
    return Number.POSITIVE_INFINITY
  }
  return existing.reduce((best, current) => Math.min(best, cosineDistance(point, current)), Number.POSITIVE_INFINITY)
}

export const generateDistributedPoint = (existing: SphericalPoint[]): SphericalPoint => {
  const index = existing.length

  let bestPoint = fibonacciPoint(index)
  let bestDistance = minDistance(bestPoint, existing)

  if (bestDistance < MIN_ACCEPTABLE_DISTANCE) {
    for (let radius = 1; radius <= 6; radius += 1) {
      for (let sector = 0; sector < 16; sector += 1) {
        const candidate: SphericalPoint = {
          theta: normalizeTheta(bestPoint.theta + radius * 0.08 * Math.cos(sector * GOLDEN_ANGLE)),
          phi: clampPhi(bestPoint.phi + radius * 0.05 * Math.sin(sector * GOLDEN_ANGLE)),
        }
        const distance = minDistance(candidate, existing)
        if (distance > bestDistance) {
          bestPoint = candidate
          bestDistance = distance
        }
      }

      if (bestDistance >= MIN_ACCEPTABLE_DISTANCE) {
        break
      }
    }
  }

  return bestPoint
}

export const defaultOrbitRadius = (index: number): number => {
  const presets = [1.05, 1.1, 1.15]
  return presets[index % presets.length]
}

export const defaultMemoryColor = (index: number): string => {
  const palette = ['#42A5F5', '#EF5350', '#26C6DA', '#EC407A', '#66BB6A', '#5C6BC0', '#FFB300', '#AB47BC']
  return palette[index % palette.length]
}
