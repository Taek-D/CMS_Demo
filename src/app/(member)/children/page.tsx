import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type {
  ChildcareCenterSummary,
  ChildcareClassSummary,
  ChildWithClass,
} from '@/types/database';

import ChildForm from './child-form';

export const childrenSelect =
  'id, parent_member_id, class_id, name, birth_date, created_at, updated_at, cms_childcare_classes(id, center_id, name, created_at, cms_childcare_centers(id, name, created_at))';

type ChildManagementClient = Pick<Awaited<ReturnType<typeof createClient>>, 'from'>;

export type ChildManagementPageData = {
  children: ChildWithClass[];
  centers: ChildcareCenterSummary[];
  classes: ChildcareClassSummary[];
};

export async function loadChildManagementData(
  supabase: ChildManagementClient,
  memberId: string
): Promise<ChildManagementPageData> {
  const [childrenResult, centersResult, classesResult] = await Promise.all([
    supabase
      .from('cms_children')
      .select(childrenSelect)
      .eq('parent_member_id', memberId)
      .order('created_at', { ascending: false }),
    supabase
      .from('cms_childcare_centers')
      .select('id, name, created_at')
      .order('name', { ascending: true }),
    supabase
      .from('cms_childcare_classes')
      .select('id, center_id, name, created_at')
      .order('name', { ascending: true }),
  ]);

  if (childrenResult.error) {
    throw new Error(childrenResult.error.message);
  }

  if (centersResult.error) {
    throw new Error(centersResult.error.message);
  }

  if (classesResult.error) {
    throw new Error(classesResult.error.message);
  }

  return {
    children: (childrenResult.data ?? []) as unknown as ChildWithClass[],
    centers: (centersResult.data ?? []) as unknown as ChildcareCenterSummary[],
    classes: (classesResult.data ?? []) as unknown as ChildcareClassSummary[],
  };
}

export default async function ChildrenPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { children, centers, classes } = await loadChildManagementData(
    supabase,
    user.id
  );

  return (
    <div data-testid="children-page">
      <ChildForm childRecords={children} centers={centers} classes={classes} />
    </div>
  );
}
