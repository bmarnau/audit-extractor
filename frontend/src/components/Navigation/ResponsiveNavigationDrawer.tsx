/**
 * ResponsiveNavigationDrawer Component
 * 
 * Main navigation component supporting Desktop, Tablet, and Mobile layouts
 */

import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  DrawerProps,
  List,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close as CloseIcon,
} from '@mui/icons-material';
import { navigationCategories, NavItem } from '../../config/navigationConfig';
import NavCategoryGroup from './NavCategoryGroup';

interface ResponsiveNavigationDrawerProps {
  open?: boolean;
  onClose?: () => void;
  onNavigate?: (item: NavItem) => void;
  expandedCategories?: Record<string, boolean>;
  onToggleCategory?: (categoryId: string) => void;
  variant?: 'permanent' | 'temporary' | 'persistent';
  anchor?: 'left' | 'top' | 'right' | 'bottom';
}

export const ResponsiveNavigationDrawer: React.FC<ResponsiveNavigationDrawerProps> = ({
  open = true,
  onClose,
  onNavigate,
  expandedCategories = {},
  onToggleCategory,
  variant = 'permanent',
  anchor = 'left',
}) => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const isCompact = isTablet;
  const drawerWidth = isMobile ? 280 : isCompact ? 80 : 280;

  // Sort categories by order
  const sortedCategories = useMemo(
    () => navigationCategories.sort((a, b) => a.order - b.order),
    []
  );

  const drawerContent = (
    <Box
      data-testid="navigation-drawer-content"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Drawer Header */}
      {!isCompact && (
        <Box
          data-testid="navigation-header"
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Audit-Safe
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Document Extraction
          </Typography>
        </Box>
      )}

      {/* Navigation List */}
      <List
        data-testid="navigation-list"
        sx={{
          flex: 1,
          overflow: 'auto',
          p: isMobile ? 1 : isCompact ? 0.5 : 1,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.divider,
            borderRadius: 4,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
            },
          },
        }}
      >
        {sortedCategories.map((category) => (
          <NavCategoryGroup
            key={category.id}
            category={category}
            expanded={expandedCategories[category.id] ?? true}
            onToggle={() => onToggleCategory?.(category.id)}
            onItemClick={(item) => {
              onNavigate?.(item);
              if (isMobile && onClose) {
                onClose();
              }
            }}
            isCompact={isCompact}
            activeItemPath={location.pathname}
          />
        ))}
      </List>

      {/* Footer Info */}
      {!isCompact && (
        <Box
          data-testid="navigation-footer"
          sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            fontSize: '0.75rem',
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          v0.35.0
        </Box>
      )}
    </Box>
  );

  // Mobile drawer (temporary, slide-in from left)
  if (isMobile) {
    return (
      <Drawer
        anchor={anchor}
        open={open}
        onClose={onClose}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Tablet/Desktop drawer (permanent)
  return (
    <Drawer
      variant={variant}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
          borderRight: `1px solid ${theme.palette.divider}`,
          height: '100%', // Full height of parent flex container
          overflow: 'auto',
        },
      }}
      open={open}
    >
      {drawerContent}
    </Drawer>
  );
};

export default ResponsiveNavigationDrawer;
