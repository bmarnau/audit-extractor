/**
 * NavCategoryGroup Component
 * 
 * Renders a collapsible category of navigation items
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Chip,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { NavCategory, NavItem } from '../../config/navigationConfig';

interface NavCategoryGroupProps {
  category: NavCategory;
  expanded: boolean;
  onToggle: () => void;
  onItemClick?: (item: NavItem) => void;
  isCompact?: boolean;
  activeItemPath?: string;
}

export const NavCategoryGroup: React.FC<NavCategoryGroupProps> = ({
  category,
  expanded,
  onToggle,
  onItemClick,
  isCompact = false,
  activeItemPath,
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: 1 }}>
      {/* Category Header */}
      <ListItemButton
        data-testid={`nav-category-${category.id}`}
        onClick={onToggle}
        sx={{
          borderRadius: 1,
          mb: 0.5,
          backgroundColor: expanded
            ? theme.palette.action.hover
            : 'transparent',
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          transition: 'all 150ms ease-in-out',
        }}
      >
        <ListItemIcon sx={{ minWidth: isCompact ? 24 : 40, color: category.color as any }}>
          {(() => {
            const IconComp = category.icon;
            return <IconComp />;
          })()}
        </ListItemIcon>
        {!isCompact && (
          <>
            <ListItemText
              primary={
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    color: category.color || 'inherit',
                  }}
                >
                  {category.label}
                </Typography>
              }
            />
            <Box sx={{ display: 'flex', ml: 'auto' }}>
              {expanded ? (
                <ExpandLessIcon sx={{ fontSize: 20 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: 20 }} />
              )}
            </Box>
          </>
        )}
      </ListItemButton>

      {/* Category Items */}
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List sx={{ pl: isCompact ? 0 : 2, pr: 0 }}>
          {category.items.map((item) => (
            <Tooltip
              key={item.id}
              title={isCompact ? item.label : ''}
              placement="right"
              arrow
            >
              <ListItem
                disablePadding                data-testid={`nav-item-${item.id}`}                onClick={() => onItemClick?.(item)}
                component={Link}
                to={item.path}
                sx={{
                  mb: 0.5,
                  '& .MuiListItemButton-root': {
                    borderRadius: 1,
                    transition: 'all 150ms ease-in-out',
                  },
                }}
              >
                <ListItemButton
                  sx={{
                    pl: isCompact ? 2 : 1,
                    pr: 1,
                    minHeight: 36,
                    borderRadius: 1,
                    backgroundColor:
                      activeItemPath === item.path
                        ? `${category.color}20`
                        : 'transparent',
                    borderLeft:
                      activeItemPath === item.path
                        ? `3px solid ${category.color}`
                        : '3px solid transparent',
                    '&:hover': {
                      backgroundColor: `${category.color}10`,
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCompact ? 24 : 32,
                      fontSize: '1.2rem',
                    }}
                  >
                    {item.icon && (() => {
                      const IconComp = item.icon;
                      return <IconComp />;
                    })()}
                  </ListItemIcon>
                  {!isCompact && (
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{item.label}</span>
                          {item.badge !== undefined && (typeof item.badge === 'number' ? item.badge > 0 : parseInt(item.badge || '0') > 0) && (
                            <Chip
                              label={item.badge}
                              size="small"
                              color="primary"
                              variant="filled"
                              sx={{ height: 20, minWidth: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={item.description}
                      secondaryTypographyProps={{
                        sx: {
                          fontSize: '0.75rem',
                          color: 'text.secondary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        },
                      }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Collapse>
    </Box>
  );
};

export default NavCategoryGroup;
