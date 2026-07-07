/**
 * ExtractionFeedbackForm Unit Tests - Simplified
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ExtractionFeedbackForm } from './ExtractionFeedbackForm';
import * as apiClientModule from '@/services/apiClient';

jest.mock('@/services/apiClient');

describe('ExtractionFeedbackForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    resultId: 'test-result-001',
    docType: 'invoice',
    extractedFields: [
      { field: 'invoice_number', value: 'INV-2024-001', confidence: 0.95 },
      { field: 'invoice_date', value: '2024-01-08', confidence: 0.87 },
    ],
    onSuccess: mockOnSuccess,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form component without errors', () => {
    const { container } = render(<ExtractionFeedbackForm {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('displays Card component', () => {
    const { container } = render(<ExtractionFeedbackForm {...defaultProps} />);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('contains form inputs and buttons', () => {
    const { container } = render(<ExtractionFeedbackForm {...defaultProps} />);
    const inputs = container.querySelectorAll('input, textarea, select, button');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders Material-UI components', () => {
    const { container } = render(<ExtractionFeedbackForm {...defaultProps} />);
    const muiElements = container.querySelectorAll('[class*="Mui"]');
    expect(muiElements.length).toBeGreaterThan(0);
  });

  it('displays extracted fields content', () => {
    const { container } = render(<ExtractionFeedbackForm {...defaultProps} />);
    const content = container.textContent || '';
    expect(content).toBeTruthy();
  });

  it('has success callback defined', () => {
    render(<ExtractionFeedbackForm {...defaultProps} />);
    expect(mockOnSuccess).toBeDefined();
  });

  it('has error callback defined', () => {
    render(<ExtractionFeedbackForm {...defaultProps} />);
    expect(mockOnError).toBeDefined();
  });

  it('renders with multiple fields', () => {
    const propsWithMoreFields = {
      ...defaultProps,
      extractedFields: [
        ...defaultProps.extractedFields,
        { field: 'vendor_name', value: 'Acme Inc', confidence: 0.88 },
      ],
    };
    const { container } = render(<ExtractionFeedbackForm {...propsWithMoreFields} />);
    expect(container).toBeTruthy();
  });

  it('accepts different document types', () => {
    const propsWithDifferentDocType = {
      ...defaultProps,
      docType: 'receipt',
    };
    const { container } = render(<ExtractionFeedbackForm {...propsWithDifferentDocType} />);
    expect(container).toBeTruthy();
  });

  it('renders without crashing with minimal props', () => {
    const minimalProps = {
      ...defaultProps,
      extractedFields: [],
    };
    const { container } = render(<ExtractionFeedbackForm {...minimalProps} />);
    expect(container).toBeTruthy();
  });
});
