/**
 * Breadcrumb Navigation Component
 * 
 * Shows current location in navigation hierarchy
 */

import React, { useMemo } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Breadcrumbs,
  Link,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { navigationCategories } from '../../config/navigationConfig';

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

export const BreadcrumbNavigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Home', path: '/', icon: <HomeIcon sx={{ fontSize: 16 }} /> },
    ];

    if (location.pathname === '/') {
      return items;
    }

    // Find matching category and item
    let currentCategory: any = null;
    let currentItem: any = null;

    for (const category of navigationCategories) {
      const item = category.items.find((i) => i.path === location.pathname);
      if (item) {
        currentCategory = category;
        currentItem = item;
        break;
      }
    }

    if (currentCategory) {
      items.push({
        label: currentCategory.label,
        path: currentCategory.items[0]?.path || '/',
      });
    }

    if (currentItem) {
      items.push({
        label: currentItem.label,
        path: location.pathname,
      });
    }

    return items;
  }, [location.pathname]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 1.5,
        backgroundColor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontSize: isMobile ? '0.875rem' : '1rem',
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}
        aria-label="breadcrumb"
      >
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast) {
            return (
              <Box
                key={item.path}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  fontWeight: 500,
                }}
              >
                {item.icon}
                <Typography variant="body2">{item.label}</Typography>
              </Box>
            );
          }

          return (
            <Link
              key={item.path}
              component={RouterLink}
              to={item.path}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline',
                },
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.label}</Typography>
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbNavigation;
