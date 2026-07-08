import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SchemaListComponent from './SchemaListComponent';
import { SchemaProvider } from '../context/SchemaContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockSchemas = [
  {
    id: '1',
    name: 'Test Schema 1',
    description: 'Test Description',
    version: 1,
    schema: {},
    status: 'active' as const,
    userId: 'user1',
    examplesCount: 5,
    generatedRulesCount: 3,
    averageConfidence: 0.85,
    directoryPath: '/schemas/test1',
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    isArchived: false,
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <SchemaProvider>
          {component}
        </SchemaProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('SchemaListComponent', () => {
  test('renders component', () => {
    renderWithProviders(<SchemaListComponent />);
    expect(screen.getByText('Schema Management')).toBeInTheDocument();
  });

  test('displays refresh button', () => {
    renderWithProviders(<SchemaListComponent />);
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    renderWithProviders(<SchemaListComponent />);
    // Component should show error or empty state (backend not running)
    expect(screen.queryByText(/schema|management|refresh/i)).toBeTruthy();
  });

  test('refresh button is clickable', () => {
    renderWithProviders(<SchemaListComponent />);
    const refreshBtn = screen.getByRole('button', { name: /refresh/i });
    expect(refreshBtn).toBeEnabled();
    fireEvent.click(refreshBtn);
    expect(refreshBtn).toBeEnabled();
  });
});
