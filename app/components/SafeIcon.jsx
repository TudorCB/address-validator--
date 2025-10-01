import { Icon } from '@shopify/polaris';
import * as Icons from '@shopify/polaris-icons';

// Icon mapping from custom names to proper Polaris icon names
const iconMapping = {
  StoreIcon: 'StorefrontIcon',
  ClipboardChecklistIcon: 'ChecklistIcon',
  CashDollarIcon: 'DollarIcon',
  AlertTriangleIcon: 'AlertWarningIcon',
};

export default function SafeIcon({ name, ...props }) {
  // Map custom icon names to proper Polaris icons
  const mappedName = iconMapping[name] || name;
  const source = Icons[mappedName];

  if (!source) {
    console.warn('Icon not found:', mappedName, '(original:', name, ')');
    return null;
  }

  return <Icon source={source} {...props} />;
}

