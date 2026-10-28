package com.quantora.backend.research.enums;

/**
 * Ordered stage of a company's research workflow. Ordinal order is the step order shown
 * to the user (Overview -> Financials -> Valuation -> Research), so do not reorder values.
 */
public enum ResearchSection {
    OVERVIEW,
    FINANCIALS,
    VALUATION,
    RESEARCH
}
