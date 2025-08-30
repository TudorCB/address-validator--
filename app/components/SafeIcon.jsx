import { Icon } from '@shopify/polaris';
import * as Icons from '@shopify/polaris-icons';

export default function SafeIcon({ name, ...props }) {
  const source = Icons[name];
  if (!source) {
    console.warn('Icon not found:', name);
    return null;
  }
  return <Icon source={source} {...props} />;
}

