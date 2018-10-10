import { Transformation } from './transform'
import '../utils/arrayScan'

export function mul(a: number, b: number) {
  return a * b
}

export function add(a: number, b: number) {
  return a + b
}

export function colMulRow(col: number[], row: number[]): number[][] {
  const width = row.length
  const height = col.length
  const output: number[][] = new Array(width)
  for (let i = 0; i < width; i++) {
    const outputColumn: number[] = new Array(height)
    for (let j = 0; j < height; j++) {
      outputColumn[j] = row[i] * col[j]
    }
    output[i] = outputColumn
  }
  return output
}

export function vector(length: number, seed: (i: number) => number): number[] {
  const output = new Array(length)
  for (let i = 0; i < length; i++) {
    output[i] = seed(i)
  }
  return output
}

export function matrix(
  width: number,
  height: number,
  seed: (i: number, j: number) => number,
): number[][] {
  const output = new Array(width)
  for (let i = 0; i < width; i++) {
    output[i] = vector(height, j => seed(i, j))
  }
  return output
}

export function rowMulCol(row: number[], col: number[]): number {
  let output = 0
  for (let i = 0; i < row.length; i++) {
    output += row[i] * col[i]
  }
  return output
}

export function rowMulMat(row: number[], mat: number[][]): number[] {
  const output = new Array(mat.length)
  for (let i = 0; i < mat.length; i++) {
    let sum = 0
    const matCol = mat[i]
    for (let j = 0; j < row.length; j++) {
      sum += matCol[j] * row[j]
    }
    output[i] = sum
  }
  return output
}

export function matMulCol(mat: number[][], col: number[]): number[] {
  if (mat.length === 0) {
    return []
  }
  const height = mat[0].length
  const output = new Array(height)
  for (let j = 0; j < height; j++) {
    let sum = 0
    for (let i = 0; i < mat.length; i++) {
      sum += mat[i][j] * col[i]
    }
    output[j] = sum
  }
  return output
}

export function mapRow<I, O>(
  row: I[],
  fun: (n: I, i: number) => O,
  out?: any[],
): O[] {
  const output = out !== undefined ? out : new Array(row.length)
  const length = row.length
  for (let i = 0; i < length; i++) {
    output[i] = fun(row[i], i)
  }
  return output
}

export function matAddMat(
  a: number[][],
  b: number[][],
  out?: number[][],
): number[][] {
  const width = a.length
  const output = out || new Array(width)
  for (let i = 0; i < width; i++) {
    const aCol = a[i]
    const bCol = b[i]
    const oCol = output[i] || new Array(aCol.length)
    for (let j = 0; j < oCol.length; j++) {
      oCol[j] = aCol[j] + bCol[j]
    }
  }
  return output
}

export function scaleMat(
  scalar: number,
  mat: number[][],
  out?: number[][],
): number[][] {
  const width = mat.length
  const output = out || new Array(width)
  for (let i = 0; i < width; i++) {
    const mCol = mat[i]
    const oCol = output[i] || new Array(mCol.length)
    for (let j = 0; j < oCol.length; j++) {
      oCol[j] = scalar * mCol[j]
    }
  }
  return output
}

export function rowZip(
  a: number[],
  b: number[],
  zip: (a: number, b: number) => number,
  out?: number[],
): number[] {
  const output = out !== undefined ? out : new Array(a.length)
  for (let i = 0; i < a.length; i++) {
    output[i] = zip(a[i], b[i])
  }
  return output
}
