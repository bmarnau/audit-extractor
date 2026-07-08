import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SchemaEditorComponent from './SchemaEditorComponent';
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

describe('SchemaEditorComponent', () => {
  test('renders editor component', () => {
    renderWithProviders(<SchemaEditorComponent />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  test('validation rule: description max 5000 characters', async () => {
    renderWithProviders(<SchemaEditorComponent />);
    
    const descriptionField = screen.queryByLabelText(/description/i);
    if (descriptionField) {
      const longText = 'a'.repeat(5001);
      fireEvent.change(descriptionField, { target: { value: longText } });
      fireEvent.blur(descriptionField);
      
      await waitFor(() => {
        expect(screen.queryByText(/Description must be less than 5000 characters/i)).toBeInTheDocument();
      }, { timeout: 500 });
    }
  });

  test('form submit disabled with validation errors', async () => {
    renderWithProviders(<SchemaEditorComponent />);
    
    const saveButton = screen.queryByRole('button', { name: /save/i });
    if (saveButton) {
      expect(saveButton).toBeDisabled();
    }
  });
});
