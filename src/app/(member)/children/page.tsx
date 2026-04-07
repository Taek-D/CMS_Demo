import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type {
  ChildcareCenterSummary,
  ChildcareClassSummary,
  ChildWithClass,
} from '@/types/database';

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
    children: (childrenResult.data ?? []) as ChildWithClass[],
    centers: (centersResult.data ?? []) as ChildcareCenterSummary[],
    classes: (classesResult.data ?? []) as ChildcareClassSummary[],
  };
}

export default async function ChildrenPage() {
  const user = await requireAuth();
  const supabase = await createClient();
  const { children, centers, classes } = await loadChildManagementData(supabase, user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Child Management</CardTitle>
          <CardDescription>
            Review the children linked to your member account and available childcare options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Registered Children</h2>
            {children.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {children.map((child) => (
                  <li key={child.id} className="rounded-lg border border-gray-200 p-4">
                    <p className="font-medium text-gray-900">{child.name}</p>
                    <p className="text-sm text-gray-600">
                      {child.cms_childcare_classes.cms_childcare_centers.name} /{' '}
                      {child.cms_childcare_classes.name}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-gray-600">
                No children have been added yet.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-sm font-medium text-gray-900">Available Centers</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{centers.length}</p>
            </div>
            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              <p className="text-sm font-medium text-gray-900">Available Classes</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{classes.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
