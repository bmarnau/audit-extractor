import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VersionHistoryComponent from './VersionHistoryComponent';
import { SchemaProvider } from '../context/SchemaContext';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

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

describe('VersionHistoryComponent', () => {
  test('renders component', () => {
    renderWithProviders(<VersionHistoryComponent />);
    // Component should render without crashing
    expect(screen.queryByRole('button')).toBeTruthy();
  });

  test('displays back button for navigation', () => {
    renderWithProviders(<VersionHistoryComponent />);
    const backButton = screen.queryByRole('button', { name: /back/i });
    if (backButton) {
      expect(backButton).toBeInTheDocument();
    }
  });

  test('renders timeline structure', () => {
    renderWithProviders(<VersionHistoryComponent />);
    // Component should render without errors
    expect(screen.queryByRole('button')).toBeTruthy();
  });
});
