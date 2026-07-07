/**
 * ImprovementDashboard Unit Tests - Simplified
 */

import React from 'react';
import { render } from '@testing-library/react';
import { ImprovementDashboard } from './ImprovementDashboard';

describe('ImprovementDashboard', () => {
  const defaultProps = {
    docType: 'invoice',
  };

  it('renders dashboard component', () => {
    const { container } = render(<ImprovementDashboard {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it('contains Material-UI components', () => {
    const { container } = render(<ImprovementDashboard {...defaultProps} />);
    const muiElements = container.querySelectorAll('[class*="Mui"]');
    expect(muiElements.length).toBeGreaterThan(0);
  });

  it('renders with layout structure', () => {
    const { container } = render(<ImprovementDashboard {...defaultProps} />);
    const mainContent = container.querySelector('[class*="Mui"]');
    expect(mainContent).toBeInTheDocument();
  });

  it('displays dashboard content', () => {
    const { container } = render(<ImprovementDashboard {...defaultProps} />);
    const content = container.textContent || '';
    expect(content.length).toBeGreaterThan(0);
  });

  it('renders for invoice document type', () => {
    const { container } = render(<ImprovementDashboard docType="invoice" />);
    expect(container).toBeTruthy();
  });

  it('renders for receipt document type', () => {
    const { container } = render(<ImprovementDashboard docType="receipt" />);
    expect(container).toBeTruthy();
  });

  it('renders for purchase_order document type', () => {
    const { container } = render(<ImprovementDashboard docType="purchase_order" />);
    expect(container).toBeTruthy();
  });

  it('renders for contract document type', () => {
    const { container } = render(<ImprovementDashboard docType="contract" />);
    expect(container).toBeTruthy();
  });

  it('renders without crashing with default props', () => {
    const { container } = render(<ImprovementDashboard {...defaultProps} />);
    expect(container.firstChild).toBeTruthy();
  });
});

