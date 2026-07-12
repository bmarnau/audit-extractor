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
  onNavigate?: (item: any) => void;
  activeItemPath?: string;
}

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  onCategorySelect,
  onNavigate,
  activeItemPath,
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
  const getTotalBadgeCount = (category: NavCategory): number | null => {
    const count = category.items.reduce((sum, item) => {
      const badgeNum = typeof item.badge === 'number' ? item.badge : (item.badge ? parseInt(item.badge) : 0);
      return sum + badgeNum;
    }, 0);
    return count > 0 ? count : null;
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
          const IconComponent = category.icon;
          return (
            <Tooltip
              key={category.id}
              title={category.label}
              placement="top"
              arrow
            >
              <Badge
                badgeContent={badgeCount}
                color="error"
              >
                <BottomNavigationAction
                  label={category.label}
                  icon={<IconComponent />}
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
