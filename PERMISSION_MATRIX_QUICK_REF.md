# Permission Matrix - Quick Reference

## Access
Settings → Permission Matrix

## Interface Overview
```
[Search] [Filter] [Bulk Mode] [Permission Sets] [Save]
─────────────────────────────────────────────────────
Role      │ Module A        │ Module B
          │ R W D E I H    │ R W D E I H
Admin     │ ✓ ✓ ✓ ✓ ✓ □    │ ✓ ✓ ✓ ✓ ✓ □
Manager   │ ✓ ✓ □ ✓ □ □    │ ✓ ✓ □ ✓ □ □
```

## Permission Types
| Icon | Type | Description |
|------|------|-------------|
| R | Read | View data |
| W | Write | Create/edit |
| D | Delete | Remove records |
| E | Export | Download data |
| I | Import | Upload data |
| H | Hide | Make invisible |

## Checkbox States
- ✓ **All**: All fields have permission
- ▬ **Some**: Some fields have permission
- ☐ **None**: No fields have permission

## Quick Actions

### Basic Operations
1. **Single Permission**: Click checkbox in cell
2. **Module-Wide**: Click checkbox in module header
3. **Field-Level**: Click ▼ to expand, then click field checkbox

### Bulk Mode (Fastest)
1. Click **Bulk Mode** button
2. Select roles (check boxes)
3. Select modules (check boxes)
4. Click permission buttons (✓ read, ✓ write, etc.)
5. Changes apply instantly to all selections

### Search & Filter
- **Search**: Type role or module name
- **Category**: Select from dropdown
- **Clear**: Remove search text to show all

### Permission Sets
1. Click **Permission Sets** button
2. **Create**: Save current config as template
3. **Apply**: Load template to matrix
4. **Manage**: Edit, clone, or delete sets

## Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+S` | Save changes |
| `Ctrl+F` | Search |
| `Ctrl+B` | Toggle bulk mode |
| `Esc` | Exit mode/Close sidebar |
| `Space` | Toggle checkbox |
| `Tab` | Navigate |

## Conflict Badges
| Badge | Meaning |
|-------|---------|
| 🟠 Amber | Override warning |
| 🔴 Red | Missing dependency |
| 🟡 Yellow | Inconsistency |

## Common Workflows

### Setup New Role
1. Create role in Roles Management first
2. Open Permission Matrix
3. Start with Read on key modules
4. Add Write where needed
5. Be cautious with Delete
6. Save changes

### Clone Permissions
1. Click **Permission Sets**
2. Click **Create** (saves current)
3. Select target role
4. Click **Apply** on saved set

### Bulk Update
1. Enable **Bulk Mode**
2. Select 2+ roles
3. Select 2+ modules
4. Click permission type
5. Exit bulk mode
6. Save

### Fix Conflicts
1. Click conflict badge (e.g., "5 Conflicts")
2. Review each conflict
3. Click to jump to cell
4. Adjust permission
5. Verify conflict clears

## Best Practices

✅ **DO**
- Start with minimal permissions
- Use permission sets for consistency
- Review conflicts regularly
- Save changes frequently
- Test with user accounts

❌ **DON'T**
- Give Delete to all roles
- Ignore conflict warnings
- Skip testing after changes
- Create too many permission sets
- Override parent roles unnecessarily

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Not saving | Check connection, refresh |
| Too slow | Use search/filter |
| Can't find role | Clear search |
| Bulk not working | Exit and re-enter mode |
| Many conflicts | Review role hierarchy |

## Tips

💡 Keep modules collapsed for overview
💡 Expand only for field-level work
💡 Use bulk mode for >5 changes
💡 Name permission sets clearly
💡 Export matrix monthly for backup
💡 Check conflicts after major changes

## Related Docs
- Full Guide: `PERMISSION_MATRIX_GUIDE.md`
- Roles: `ROLES_MANAGEMENT_GUIDE.md`
- Permission Model: `PERMISSION_MODEL_GUIDE.md`

---
**Quick Help**: Press `?` in app for inline help
