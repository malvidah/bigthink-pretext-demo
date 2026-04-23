export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export type Interval = {
  left: number
  right: number
}

export type Point = {
  x: number
  y: number
}

export type WrapHullMode = 'mean' | 'envelope'

export type WrapHullOptions = {
  smoothRadius: number
  mode: WrapHullMode
  convexify?: boolean
}

const wrapHullByKey = new Map<string, Promise<Point[][]>>()

export function getWrapHull(src: string, options: WrapHullOptions): Promise<Point[][]> {
  const key = `${src}::${options.mode}::${options.smoothRadius}::${options.convexify ? 'convex' : 'raw'}`
  const cached = wrapHullByKey.get(key)
  if (cached !== undefined) return cached
  const promise = makeWrapHull(src, options)
  wrapHullByKey.set(key, promise)
  return promise
}

export function transformWrapPoints(points: Point[], rect: Rect, angle: number): Point[] {
  if (angle === 0) {
    return points.map(point => ({
        x: rect.x + point.x * rect.width,
        y: rect.y + point.y * rect.height,
    }))
  }

  const centerX = rect.x + rect.width / 2
  const centerY = rect.y + rect.height / 2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return points.map(point => {
    const localX = (point.x - 0.5) * rect.width
    const localY = (point.y - 0.5) * rect.height
    return {
      x: centerX + localX * cos - localY * sin,
      y: centerY + localX * sin + localY * cos,
    }
  })
}

export function isPointInPolygon(points: Point[], x: number, y: number): boolean {
  let inside = false
  for (let index = 0, prev = points.length - 1; index < points.length; prev = index++) {
    const a = points[index]!
    const b = points[prev]!
    const intersects =
      ((a.y > y) !== (b.y > y)) &&
      (x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x)
    if (intersects) inside = !inside
  }
  return inside
}

export function getPolygonIntervalForBand(
  points: Point[],
  bandTop: number,
  bandBottom: number,
  horizontalPadding: number,
  verticalPadding: number,
): Interval | null {
  const sampleTop = bandTop - verticalPadding
  const sampleBottom = bandBottom + verticalPadding
  const startY = Math.floor(sampleTop)
  const endY = Math.ceil(sampleBottom)

  let left = Infinity
  let right = -Infinity

  for (let y = startY; y <= endY; y++) {
    const xs = getPolygonXsAtY(points, y + 0.5)
    for (let index = 0; index + 1 < xs.length; index += 2) {
      const runLeft = xs[index]!
      const runRight = xs[index + 1]!
      if (runLeft < left) left = runLeft
      if (runRight > right) right = runRight
    }
  }

  if (!Number.isFinite(left) || !Number.isFinite(right)) return null
  return { left: left - horizontalPadding, right: right + horizontalPadding }
}

export function getRectIntervalsForBand(
  rects: Rect[],
  bandTop: number,
  bandBottom: number,
  horizontalPadding: number,
  verticalPadding: number,
): Interval[] {
  const intervals: Interval[] = []
  for (let index = 0; index < rects.length; index++) {
    const rect = rects[index]!
    if (bandBottom <= rect.y - verticalPadding || bandTop >= rect.y + rect.height + verticalPadding) continue
    intervals.push({
      left: rect.x - horizontalPadding,
      right: rect.x + rect.width + horizontalPadding,
    })
  }
  return intervals
}

// Given one allowed horizontal interval and a set of blocked intervals,
// carve out the remaining usable text slots for one text line band.
//
// Example:
// - base:    80..420
// - blocked: 200..310
// - result:  80..200, 310..420
//
// On the dynamic-layout page, the base interval is one full column row,
// the blocked intervals come from the title/logo shapes at that band,
// and the returned intervals are the candidate text slots for that row.
//
// This helper is intentionally page-oriented, not pure geometry:
// it also discards absurdly narrow leftover slivers that we would never
// want to hand to text layout.
export function carveTextLineSlots(base: Interval, blocked: Interval[]): Interval[] {
  let slots: Interval[] = [base]

  for (let blockedIndex = 0; blockedIndex < blocked.length; blockedIndex++) {
    const interval = blocked[blockedIndex]!
    const next: Interval[] = []
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex++) {
      const slot = slots[slotIndex]!
      if (interval.right <= slot.left || interval.left >= slot.right) {
        next.push(slot)
        continue
      }
      if (interval.left > slot.left) next.push({ left: slot.left, right: interval.left })
      if (interval.right < slot.right) next.push({ left: interval.right, right: slot.right })
    }
    slots = next
  }

  return slots.filter(slot => slot.right - slot.left >= 24)
}

async function makeWrapHull(src: string, options: WrapHullOptions): Promise<Point[][]> {
  const image = new Image()
  image.src = src
  await image.decode()

  const maxDimension = 320
  const aspect = image.naturalWidth / image.naturalHeight
  const width = aspect >= 1
    ? maxDimension
    : Math.max(64, Math.round(maxDimension * aspect))
  const height = aspect >= 1
    ? Math.max(64, Math.round(maxDimension / aspect))
    : maxDimension

  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('2d context unavailable')

  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(image, 0, 0, width, height)

  const { data } = ctx.getImageData(0, 0, width, height)
  const alphaThreshold = 12

  // Build a binary opacity mask, then dilate it by `dilateRadius` pixels.
  // Dilation merges nearby specks (e.g. dotted lines) into the parent shape
  // while keeping genuinely separate shapes apart as long as their gap > 2*R.
  const dilateRadius = 3
  const raw = new Uint8Array(width * height)
  for (let i = 0; i < raw.length; i++) raw[i] = data[i * 4 + 3]! >= alphaThreshold ? 1 : 0

  // Two-pass dilation (horizontal, then vertical) using sliding-window counts.
  const horiz = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    const row = y * width
    let count = 0
    for (let x = 0; x <= dilateRadius && x < width; x++) count += raw[row + x]!
    for (let x = 0; x < width; x++) {
      horiz[row + x] = count > 0 ? 1 : 0
      const addIdx = x + dilateRadius + 1
      if (addIdx < width) count += raw[row + addIdx]!
      const removeIdx = x - dilateRadius
      if (removeIdx >= 0) count -= raw[row + removeIdx]!
    }
  }
  const mask = new Uint8Array(width * height)
  for (let x = 0; x < width; x++) {
    let count = 0
    for (let y = 0; y <= dilateRadius && y < height; y++) count += horiz[y * width + x]!
    for (let y = 0; y < height; y++) {
      mask[y * width + x] = count > 0 ? 1 : 0
      const addIdx = y + dilateRadius + 1
      if (addIdx < height) count += horiz[addIdx * width + x]!
      const removeIdx = y - dilateRadius
      if (removeIdx >= 0) count -= horiz[removeIdx * width + x]!
    }
  }

  // Connected-component labeling (8-connected) via union-find on opaque pixels.
  const labels = new Int32Array(width * height)
  const parent: number[] = [0]
  const findRoot = (n: number): number => {
    while (parent[n] !== n) {
      parent[n] = parent[parent[n]!]!
      n = parent[n]!
    }
    return n
  }
  const union = (a: number, b: number) => {
    const ra = findRoot(a); const rb = findRoot(b)
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (mask[idx] === 0) continue
      const neighbors: number[] = []
      if (x > 0 && labels[idx - 1]! > 0) neighbors.push(labels[idx - 1]!)
      if (y > 0 && labels[idx - width]! > 0) neighbors.push(labels[idx - width]!)
      if (x > 0 && y > 0 && labels[idx - width - 1]! > 0) neighbors.push(labels[idx - width - 1]!)
      if (x + 1 < width && y > 0 && labels[idx - width + 1]! > 0) neighbors.push(labels[idx - width + 1]!)
      if (neighbors.length === 0) {
        const next = parent.length
        parent.push(next)
        labels[idx] = next
      } else {
        let min = neighbors[0]!
        for (const n of neighbors) if (n < min) min = n
        labels[idx] = min
        for (const n of neighbors) if (n !== min) union(n, min)
      }
    }
  }

  // Collect row extents from the RAW pixels (not the dilated mask) grouped by
  // their component label, so the hull envelopes actual pixels — not the puffy
  // dilated boundary. Every raw pixel is always inside the dilated mask, so
  // labels[idx] is guaranteed nonzero for each raw opaque pixel.
  type ComponentRows = { lefts: Array<number | null>; rights: Array<number | null>; validRows: number[]; count: number }
  const componentByRoot = new Map<number, ComponentRows>()
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (raw[idx] === 0) continue
      const label = labels[idx]!
      if (label === 0) continue
      const root = findRoot(label)
      let comp = componentByRoot.get(root)
      if (!comp) {
        comp = {
          lefts: new Array(height).fill(null),
          rights: new Array(height).fill(null),
          validRows: [],
          count: 0,
        }
        componentByRoot.set(root, comp)
      }
      const curLeft = comp.lefts[y]
      if (curLeft === null || x < curLeft) comp.lefts[y] = x
      const curRight = comp.rights[y]
      if (curRight === null || x + 1 > curRight) comp.rights[y] = x + 1
      comp.count++
    }
  }

  if (componentByRoot.size === 0) throw new Error(`No opaque pixels found in ${src}`)

  // Drop tiny specks (e.g. stray AA pixels).
  const minPixels = Math.max(48, Math.round((width * height) * 0.0015))
  const components: ComponentRows[] = []
  for (const comp of componentByRoot.values()) {
    if (comp.count < minPixels) continue
    for (let y = 0; y < height; y++) {
      if (comp.lefts[y] !== null && comp.rights[y] !== null) comp.validRows.push(y)
    }
    if (comp.validRows.length > 0) components.push(comp)
  }
  if (components.length === 0) throw new Error(`No opaque components found in ${src}`)

  const hulls: Point[][] = []
  for (const comp of components) {
    const { lefts, rights, validRows } = comp
    const smoothedLefts: number[] = new Array(height).fill(0)
    const smoothedRights: number[] = new Array(height).fill(0)

    for (let index = 0; index < validRows.length; index++) {
      const y = validRows[index]!
      let leftSum = 0
      let rightSum = 0
      let count = 0
      let leftEdge = Infinity
      let rightEdge = -Infinity
      for (let offset = -options.smoothRadius; offset <= options.smoothRadius; offset++) {
        const sampleIndex = y + offset
        if (sampleIndex < 0 || sampleIndex >= height) continue
        const left = lefts[sampleIndex]
        const right = rights[sampleIndex]
        if (left == null || right == null) continue
        leftSum += left
        rightSum += right
        if (left < leftEdge) leftEdge = left
        if (right > rightEdge) rightEdge = right
        count++
      }
      if (count === 0) continue
      switch (options.mode) {
        case 'envelope':
          smoothedLefts[y] = leftEdge
          smoothedRights[y] = rightEdge
          break
        case 'mean':
          smoothedLefts[y] = leftSum / count
          smoothedRights[y] = rightSum / count
          break
      }
    }

    const step = Math.max(1, Math.floor(validRows.length / 52))
    const sampledRows: number[] = []
    for (let index = 0; index < validRows.length; index += step) sampledRows.push(validRows[index]!)
    const lastRow = validRows[validRows.length - 1]!
    if (sampledRows[sampledRows.length - 1] !== lastRow) sampledRows.push(lastRow)

    const points: Point[] = []
    for (let index = 0; index < sampledRows.length; index++) {
      const y = sampledRows[index]!
      points.push({ x: smoothedLefts[y]! / width, y: (y + 0.5) / height })
    }
    for (let index = sampledRows.length - 1; index >= 0; index--) {
      const y = sampledRows[index]!
      points.push({ x: smoothedRights[y]! / width, y: (y + 0.5) / height })
    }

    hulls.push(options.convexify ? makeConvexHull(points) : points)
  }

  return hulls
}

function getPolygonXsAtY(points: Point[], y: number): number[] {
  const xs: number[] = []
  let a = points[points.length - 1]
  if (!a) return xs

  for (let index = 0; index < points.length; index++) {
    const b = points[index]!
    if ((a.y <= y && y < b.y) || (b.y <= y && y < a.y)) {
      xs.push(a.x + ((y - a.y) * (b.x - a.x)) / (b.y - a.y))
    }
    a = b
  }

  xs.sort((a, b) => a - b)
  return xs
}

function cross(origin: Point, a: Point, b: Point): number {
  return (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)
}

function makeConvexHull(points: Point[]): Point[] {
  if (points.length <= 3) return points
  const sorted = [...points].sort((a, b) => (a.x - b.x) || (a.y - b.y))
  const lower: Point[] = []
  for (let index = 0; index < sorted.length; index++) {
    const point = sorted[index]!
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, point) <= 0) {
      lower.pop()
    }
    lower.push(point)
  }
  const upper: Point[] = []
  for (let index = sorted.length - 1; index >= 0; index--) {
    const point = sorted[index]!
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, point) <= 0) {
      upper.pop()
    }
    upper.push(point)
  }
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}
