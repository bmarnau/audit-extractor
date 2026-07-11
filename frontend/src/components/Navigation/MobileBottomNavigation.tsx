/**
 * MobileBottomNavigation Component
 * 
 * Bottom navigation bar for mobile devices showing category quick access
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Badge,
  Tooltip,
} from '@mui/material';
import { navigationCategories, NavCategory } from '../../config/navigationConfig';

interface MobileBottomNavigationProps {
  onCategorySelect?: (category: NavCategory) => void;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  onCategorySelect,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get main category based on current path
  const getCurrentCategoryIndex = () => {
    for (let i = 0; i < navigationCategories.length; i++) {
      const category = navigationCategories[i];
      const hasMatch = category.items.some(
        (item) => item.path === location.pathname
      );
      if (hasMatch) return i;
    }
    return 0;
  };

  const [value, setValue] = React.useState<number>(getCurrentCategoryIndex());

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    const category = navigationCategories[newValue];
    if (category) {
      // Navigate to first item in category
      const firstItem = category.items[0];
      if (firstItem) {
        navigate(firstItem.path);
        onCategorySelect?.(category);
      }
    }
  };

  // Calculate total badge count
  const getTotalBadgeCount = (category: NavCategory): number => {
    return category.items.reduce((sum, item) => sum + (item.badge || 0), 0);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        showLabels
        sx={{
          display: 'flex',
          justifyContent: 'space-around',
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            flex: 1,
            py: 1,
            fontSize: '0.75rem',
          },
        }}
      >
        {navigationCategories.map((category, index) => {
          const badgeCount = getTotalBadgeCount(category);
          return (
            <Tooltip
              key={category.id}
              title={category.label}
              placement="top"
              arrow
            >
              <Badge
                badgeContent={badgeCount > 0 ? badgeCount : null}
                color="error"
              >
                <BottomNavigationAction
                  label={category.label}
                  icon={category.icon}
                  value={index}
                />
              </Badge>
            </Tooltip>
          );
        })}
      </BottomNavigation>
    </Box>
  );
};

export default MobileBottomNavigation;
