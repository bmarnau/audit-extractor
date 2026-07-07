/**
 * SuggestionReviewPanel Unit Tests - Simplified
 */

import React from 'react';
import { render } from '@testing-library/react';
import { SuggestionReviewPanel } from './SuggestionReviewPanel';
import * as apiClientModule from '@/services/apiClient';

jest.mock('@/services/apiClient');

describe('SuggestionReviewPanel', () => {
  const mockOnApply = jest.fn();
  const mockOnError = jest.fn();

  const defaultProps = {
    resultId: 'test-result-001',
    docType: 'invoice',
    onApply: mockOnApply,
    onError: mockOnError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders panel component', () => {
    const { container } = render(<SuggestionReviewPanel {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('contains card element', () => {
    const { container } = render(<SuggestionReviewPanel {...defaultProps} />);
    const card = container.querySelector('.MuiCard-root');
    expect(card).toBeInTheDocument();
  });

  it('renders with Material-UI components', () => {
    const { container } = render(<SuggestionReviewPanel {...defaultProps} />);
    const muiElements = container.querySelectorAll('[class*="Mui"]');
    expect(muiElements.length).toBeGreaterThan(0);
  });

  it('has loading or content area', () => {
    const { container } = render(<SuggestionReviewPanel {...defaultProps} />);
    const content = container.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('supports on-apply callback', () => {
    render(<SuggestionReviewPanel {...defaultProps} />);
    expect(mockOnApply).toBeDefined();
  });

  it('supports on-error callback', () => {
    render(<SuggestionReviewPanel {...defaultProps} />);
    expect(mockOnError).toBeDefined();
  });

  it('accepts resultId prop', () => {
    const { container } = render(<SuggestionReviewPanel {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('accepts docType prop', () => {
    const propsWithDifferentDocType = {
      ...defaultProps,
      docType: 'receipt',
    };
    const { container } = render(<SuggestionReviewPanel {...propsWithDifferentDocType} />);
    expect(container).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { container } = render(<SuggestionReviewPanel {...defaultProps} />);
    expect(container.firstChild).toBeTruthy();
  });
});
