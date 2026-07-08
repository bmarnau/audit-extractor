import React from 'react';
import { render, screen } from '@testing-library/react';
import { SchemaProvider, useSchemaContext } from '../context/SchemaContext';

// Test component that uses the context
const TestComponent = () => {
  const context = useSchemaContext();
  return (
    <div>
      <span>{context.schemas.length}</span>
      <span>{context.currentPage}</span>
      <span>{context.loading ? 'loading' : 'ready'}</span>
    </div>
  );
};

describe('SchemaContext', () => {
  test('SchemaProvider wraps component correctly', () => {
    render(
      <SchemaProvider>
        <TestComponent />
      </SchemaProvider>
    );
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('useSchemaContext returns initial state', () => {
    render(
      <SchemaProvider>
        <TestComponent />
      </SchemaProvider>
    );
    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  test('throws error when used outside provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSchemaContext must be used within SchemaProvider');
    
    consoleError.mockRestore();
  });
});
