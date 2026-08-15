import { describe, it, expect } from 'vitest';
import {
  searchLocalRxNormDb,
  normalizeRxNormTerm,
  RXNORM_LOCAL_DATABASE,
} from '@/lib/rxnormLocalDb';

describe('Functional QA: RxNorm & Medication Database Engine', () => {
  describe('Normalization & Query Processing', () => {
    it('normalizes complex drug strings by stripping non-alphanumerics and lowercasing', () => {
      expect(normalizeRxNormTerm('  Advil (Ibuprofen) 200mg! ')).toBe('advilibuprofen200mg');
      expect(normalizeRxNormTerm('Panadol-Extra')).toBe('panadolextra');
    });

    it('returns null for queries that are empty or under 2 characters', () => {
      expect(searchLocalRxNormDb('')).toBeNull();
      expect(searchLocalRxNormDb(' ')).toBeNull();
      expect(searchLocalRxNormDb('a')).toBeNull();
    });
  });

  describe('Local RxNorm Concept Matching', () => {
    it('accurately resolves Ibuprofen concept via brand names and active ingredient', () => {
      const advilMatch = searchLocalRxNormDb('Advil');
      expect(advilMatch).toBeDefined();
      expect(advilMatch?.rxcui).toBe('5640');
      expect(advilMatch?.nameEn).toBe('Ibuprofen');
      expect(advilMatch?.nameAr).toContain('إيبوبروفين');

      const motrinMatch = searchLocalRxNormDb('Motrin');
      expect(motrinMatch?.rxcui).toBe('5640');
    });

    it('accurately resolves Acetaminophen / Paracetamol concept', () => {
      const panadolMatch = searchLocalRxNormDb('Panadol');
      expect(panadolMatch).toBeDefined();
      expect(panadolMatch?.rxcui).toBe('161');
      expect(panadolMatch?.nameEn).toBe('Acetaminophen');

      const tylenolMatch = searchLocalRxNormDb('Tylenol');
      expect(tylenolMatch?.rxcui).toBe('161');
    });

    it('accurately resolves Metformin (Glucophage / Cidophage)', () => {
      const glucophage = searchLocalRxNormDb('Glucophage');
      expect(glucophage).toBeDefined();
      expect(glucophage?.rxcui).toBe('6809');
      expect(glucophage?.categoryEn).toContain('Antidiabetic');
    });

    it('accurately resolves Aspirin with antiplatelet category', () => {
      const aspirin = searchLocalRxNormDb('Aspirin');
      expect(aspirin).toBeDefined();
      expect(aspirin?.rxcui).toBe('1191');
      expect(aspirin?.atcCode).toBe('N02BA01');
    });

    it('contains valid clinical structural metadata for all pre-bundled concepts', () => {
      const concepts = Object.values(RXNORM_LOCAL_DATABASE);
      expect(concepts.length).toBeGreaterThan(15);

      for (const concept of concepts) {
        expect(concept.rxcui).toBeTruthy();
        expect(concept.nameEn).toBeTruthy();
        expect(concept.nameAr).toBeTruthy();
        expect(Array.isArray(concept.synonyms)).toBe(true);
        expect(Array.isArray(concept.activeIngredients)).toBe(true);
        expect(concept.activeIngredients.length).toBeGreaterThan(0);
      }
    });
  });
});
