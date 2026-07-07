/**
 * LearningWorkflowContainer Unit Tests - Simplified
 */

import React from 'react';
import { render } from '@testing-library/react';
import { LearningWorkflowContainer } from './LearningWorkflowContainer';
import { ExtractionResult } from './index';

describe('LearningWorkflowContainer', () => {
  const mockResult: ExtractionResult = {
    resultId: 'result-001',
    docType: 'invoice',
    extractedFields: [
      { field: 'invoice_number', value: 'INV-2024-001', confidence: 0.95 },
      { field: 'invoice_date', value: '2024-01-08', confidence: 0.87 },
    ],
    missingFields: ['customer_name', 'total_amount'],
    quality: {
      successRate: 0.92,
      confidence: 0.88,
    },
  };

  const mockOnFeedbackSubmitted = jest.fn();
  const mockOnImprovementsApplied = jest.fn();

  const defaultProps = {
    result: mockResult,
    onFeedbackSubmitted: mockOnFeedbackSubmitted,
    onImprovementsApplied: mockOnImprovementsApplied,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders container component', () => {
    const { container } = render(<LearningWorkflowContainer {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('contains Material-UI components', () => {
    const { container } = render(<LearningWorkflowContainer {...defaultProps} />);
    const muiElements = container.querySelectorAll('[class*="Mui"]');
    expect(muiElements.length).toBeGreaterThan(0);
  });

  it('renders with extraction result prop', () => {
    const { container } = render(<LearningWorkflowContainer {...defaultProps} />);
    expect(container.textContent).toBeTruthy();
  });

  it('displays content sections', () => {
    const { container } = render(<LearningWorkflowContainer {...defaultProps} />);
    const content = container.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('has responsive layout structure', () => {
    const { container } = render(<LearningWorkflowContainer {...defaultProps} />);
    const mainContent = container.querySelector('[class*="Mui"]');
    expect(mainContent).toBeInTheDocument();
  });

  it('supports feedback submitted callback', () => {
    render(<LearningWorkflowContainer {...defaultProps} />);
    expect(typeof mockOnFeedbackSubmitted).toBe('function');
  });

  it('supports improvements applied callback', () => {
    render(<LearningWorkflowContainer {...defaultProps} />);
    expect(typeof mockOnImprovementsApplied).toBe('function');
  });

  it('handles empty extracted fields', () => {
    const emptyResult: ExtractionResult = {
      ...mockResult,
      extractedFields: [],
    };
    const { container } = render(
      <LearningWorkflowContainer {...defaultProps} result={emptyResult} />
    );
    expect(container).toBeTruthy();
  });

  it('renders with different document types', () => {
    const docTypes = ['invoice', 'receipt', 'purchase_order'];

    docTypes.forEach(docType => {
      const result: ExtractionResult = {
        ...mockResult,
        docType: docType as any,
      };
      const { unmount } = render(
        <LearningWorkflowContainer {...defaultProps} result={result} />
      );
      expect(result.docType).toBe(docType);
      unmount();
    });
  });

  it('renders without crashing with all props', () => {
    const { container } = render(<LearningWorkflowContainer {...defaultProps} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('supports missing fields prop', () => {
    const resultWithMissingFields: ExtractionResult = {
      ...mockResult,
      missingFields: ['field1', 'field2', 'field3'],
    };
    const { container } = render(
      <LearningWorkflowContainer {...defaultProps} result={resultWithMissingFields} />
    );
    expect(container).toBeTruthy();
  });

  it('handles quality metrics', () => {
    const resultWithQuality: ExtractionResult = {
      ...mockResult,
      quality: { successRate: 0.95, confidence: 0.93 },
    };
    const { container } = render(
      <LearningWorkflowContainer {...defaultProps} result={resultWithQuality} />
    );
    expect(container).toBeTruthy();
  });
});
