
import SettingsClient from '@/components/admin/settings-client';
import { getSettings } from './actions';

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient 
            initialTaxRate={settings.taxRate} 
            initialPriceLists={settings.priceLists} 
            initialActivePriceListId={settings.activePriceListId} 
        />;
}
