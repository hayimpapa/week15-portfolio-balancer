import { describe, it, expect } from 'vitest'
import { parsePercentage, parseAllocationCsv } from './csv.js'
import { analyzePortfolio, varianceStatus } from './rebalance.js'
import { suggestAssetType, detectTicker } from './classify.js'

describe('parsePercentage', () => {
  it('parses plain numbers', () => {
    expect(parsePercentage('80')).toBe(80)
    expect(parsePercentage(80)).toBe(80)
  })
  it('parses fractions <= 1 as percentages', () => {
    expect(parsePercentage('0.8')).toBeCloseTo(80)
    expect(parsePercentage('1')).toBe(100)
  })
  it('parses percent-suffixed values literally', () => {
    expect(parsePercentage('80%')).toBe(80)
    expect(parsePercentage(' 80 % ')).toBe(80)
    expect(parsePercentage('0.5%')).toBe(0.5)
  })
  it('returns NaN for garbage', () => {
    expect(Number.isNaN(parsePercentage('abc'))).toBe(true)
    expect(Number.isNaN(parsePercentage(''))).toBe(true)
  })
})

describe('parseAllocationCsv', () => {
  it('parses a valid CSV summing to 100', () => {
    const csv = 'asset_type,percentage\nAustralian Shares,50\nBonds,0.3\nCash,20%'
    const { rows, errors } = parseAllocationCsv(csv)
    expect(errors).toHaveLength(0)
    expect(rows).toHaveLength(3)
    expect(rows[1]).toEqual({ assetType: 'Bonds', targetPercentage: 30 })
  })
  it('accepts header aliases and rounding tolerance', () => {
    const csv = 'Asset,Target\nA,33.33\nB,33.33\nC,33.34'
    const { errors, total } = parseAllocationCsv(csv)
    expect(errors).toHaveLength(0)
    expect(total).toBeCloseTo(100, 1)
  })
  it('flags sums outside tolerance', () => {
    const csv = 'asset_type,percentage\nA,50\nB,40'
    const { errors } = parseAllocationCsv(csv)
    expect(errors.some((e) => e.includes('sum to 100'))).toBe(true)
  })
  it('errors on missing columns', () => {
    const { errors } = parseAllocationCsv('foo,bar\n1,2')
    expect(errors.length).toBeGreaterThan(0)
  })
})

describe('varianceStatus', () => {
  it('classifies by threshold', () => {
    expect(varianceStatus(1)).toBe('on-target')
    expect(varianceStatus(-2)).toBe('on-target')
    expect(varianceStatus(3)).toBe('minor')
    expect(varianceStatus(-5)).toBe('minor')
    expect(varianceStatus(6)).toBe('major')
  })
})

describe('analyzePortfolio', () => {
  const targets = [
    { assetType: 'Australian Shares', targetPercentage: 50 },
    { assetType: 'Bonds', targetPercentage: 50 },
  ]
  const holdings = [
    { id: '1', assetType: 'Australian Shares', quantity: 10, unitPrice: 10 }, // 100
    { id: '2', assetType: 'Bonds', quantity: 10, unitPrice: 30 }, // 300
  ]

  it('computes totals and current percentages', () => {
    const { totalValue, byType } = analyzePortfolio(holdings, targets)
    expect(totalValue).toBe(400)
    const aus = byType.find((b) => b.assetType === 'Australian Shares')
    expect(aus.currentPercentage).toBeCloseTo(25)
    expect(aus.variance).toBeCloseTo(-25)
    expect(aus.status).toBe('major')
  })

  it('suggests investing in the most underweight type with correct amount', () => {
    const { suggestion } = analyzePortfolio(holdings, targets)
    expect(suggestion.type).toBe('invest')
    expect(suggestion.assetType).toBe('Australian Shares')
    // Need (0.5*400 - 100)/(1-0.5) = 100/0.5 = 200 -> new total 600, AUS=300=50%.
    expect(suggestion.amount).toBeCloseTo(200)
  })

  it('reports balanced when all on/above target', () => {
    const balanced = [
      { id: '1', assetType: 'Australian Shares', quantity: 10, unitPrice: 10 },
      { id: '2', assetType: 'Bonds', quantity: 10, unitPrice: 10 },
    ]
    const { suggestion } = analyzePortfolio(balanced, targets)
    expect(suggestion.type).toBe('balanced')
  })
})

describe('suggestAssetType', () => {
  const types = ['Australian Shares', 'International Shares', 'Bonds', 'Cash']
  it('matches known tickers', () => {
    expect(suggestAssetType('VAS', 'VAS.AX', types).assetType).toBe('Australian Shares')
    expect(suggestAssetType('BND', '', types).assetType).toBe('Bonds')
  })
  it('matches descriptive names via keywords', () => {
    expect(suggestAssetType('Vanguard Australian Shares', '', types).assetType).toBe(
      'Australian Shares',
    )
    expect(suggestAssetType('Global Developed Markets', '', types).assetType).toBe(
      'International Shares',
    )
  })
})

describe('detectTicker', () => {
  it('detects ticker-like names', () => {
    expect(detectTicker('vas')).toBe('VAS')
    expect(detectTicker('VAS.AX')).toBe('VAS.AX')
  })
  it('extracts parenthesised tickers', () => {
    expect(detectTicker('Vanguard Australian Shares (VAS)')).toBe('VAS')
  })
  it('returns empty for descriptive names', () => {
    expect(detectTicker('My favourite fund')).toBe('')
  })
})
