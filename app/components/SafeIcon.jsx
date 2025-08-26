import * as Icons from '@shopify/polaris-icons';
export default function SafeIcon({ name, ...props }) {
  const Icon = Icons[name];
  if (!Icon) { console.warn(\Icon not found: \\); return null; }
  return <Icon {...props} />;
}
