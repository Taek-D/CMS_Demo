'use server';

import { revalidatePath } from 'next/cache';

import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export type ChildActionResult = {
  success: boolean;
  error?: string;
};

function getRequiredField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function getOptionalDate(formData: FormData) {
  const value = formData.get('birth_date');

  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function revalidateMemberChildrenPaths() {
  revalidatePath('/children');
  revalidatePath('/dashboard');
}

export async function createChild(formData: FormData): Promise<ChildActionResult> {
  const user = await requireAuth();
  const name = getRequiredField(formData, 'name');
  const classId = getRequiredField(formData, 'class_id');

  if (!name || !classId) {
    return { success: false, error: 'Name and class are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('cms_children').insert({
    parent_member_id: user.id,
    class_id: classId,
    name,
    birth_date: getOptionalDate(formData),
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateMemberChildrenPaths();

  return { success: true };
}

export async function updateChild(formData: FormData): Promise<ChildActionResult> {
  const user = await requireAuth();
  const childId = getRequiredField(formData, 'child_id');
  const name = getRequiredField(formData, 'name');
  const classId = getRequiredField(formData, 'class_id');

  if (!childId || !name || !classId) {
    return { success: false, error: 'Child, name, and class are required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('cms_children')
    .update({
      name,
      class_id: classId,
      birth_date: getOptionalDate(formData),
    })
    .eq('id', childId)
    .eq('parent_member_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateMemberChildrenPaths();

  return { success: true };
}

export async function deleteChild(formData: FormData): Promise<ChildActionResult> {
  const user = await requireAuth();
  const childId = getRequiredField(formData, 'child_id');

  if (!childId) {
    return { success: false, error: 'Child is required.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('cms_children')
    .delete()
    .eq('id', childId)
    .eq('parent_member_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateMemberChildrenPaths();

  return { success: true };
}
