import SettingsForm from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/db/queries";

export const metadata = { title: "Settings — Shop Admin" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsForm settings={settings} />;
}
