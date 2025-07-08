import SettingsClient from '@/components/admin/settings-client';
import { getSettings } from './actions';

export default async function AdminSettingsPage() {
    const { taxRate, priceLists } = await getSettings();

    return (
        <SettingsClient initialTaxRate={taxRate} initialPriceLists={priceLists} />
    );
}
