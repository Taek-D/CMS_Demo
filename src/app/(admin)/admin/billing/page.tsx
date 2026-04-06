import { requireAdmin } from '@/lib/admin-auth';
import BillingRunCard from './billing-run-card';

export default async function BillingPage() {
  await requireAdmin();

  return (
    <div className="container mx-auto py-8 px-4 flex justify-center">
      <BillingRunCard />
    </div>
  );
}
