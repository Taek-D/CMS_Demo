'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ChildcareCenterSummary,
  ChildcareClassSummary,
  ChildWithClass,
} from '@/types/database';

import { createChild, deleteChild, updateChild } from './actions';

type ChildFormProps = {
  childRecords: ChildWithClass[];
  centers: ChildcareCenterSummary[];
  classes: ChildcareClassSummary[];
};

type FormState = {
  childId: string | null;
  name: string;
  birthDate: string;
  selectedCenterId: string;
  classId: string;
  centerSearch: string;
};

function getEmptyFormState(): FormState {
  return {
    childId: null,
    name: '',
    birthDate: '',
    selectedCenterId: '',
    classId: '',
    centerSearch: '',
  };
}

function appendChildId(formData: FormData, childId: string) {
  formData.set('child_id', childId);
  return formData;
}

export default function ChildForm({
  childRecords,
  centers,
  classes,
}: ChildFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>(getEmptyFormState);

  const filteredCenters = useMemo(() => {
    const query = formState.centerSearch.trim().toLowerCase();

    if (!query) {
      return centers;
    }

    return centers.filter((center) =>
      center.name.toLowerCase().includes(query)
    );
  }, [centers, formState.centerSearch]);

  const scopedClasses = useMemo(
    () =>
      classes.filter(
        (childcareClass) => childcareClass.center_id === formState.selectedCenterId
      ),
    [classes, formState.selectedCenterId]
  );

  const selectedCenter = centers.find(
    (center) => center.id === formState.selectedCenterId
  );
  const selectedClassLabel =
    classes.find((childcareClass) => childcareClass.id === formState.classId)?.name ??
    '';

  function resetForm() {
    setError(null);
    setFormState(getEmptyFormState());
  }

  function handleCenterSelect(centerId: string) {
    setFormState((current) => {
      const nextScopedClasses = classes.filter(
        (childcareClass) => childcareClass.center_id === centerId
      );
      const keepCurrentClass = nextScopedClasses.some(
        (childcareClass) => childcareClass.id === current.classId
      );

      return {
        ...current,
        selectedCenterId: centerId,
        classId: keepCurrentClass ? current.classId : '',
      };
    });
  }

  function handleEdit(child: ChildWithClass) {
    setError(null);
    setFormState({
      childId: child.id,
      name: child.name,
      birthDate: child.birth_date ?? '',
      selectedCenterId: child.cms_childcare_classes.center_id,
      classId: child.class_id,
      centerSearch: child.cms_childcare_classes.cms_childcare_centers.name,
    });
  }

  function handleSubmit() {
    startTransition(() => {
      void (async () => {
        setError(null);

        const formData = new FormData();
        formData.set('name', formState.name);
        formData.set('class_id', formState.classId);

        if (formState.birthDate) {
          formData.set('birth_date', formState.birthDate);
        }

        const result = formState.childId
          ? await updateChild(appendChildId(formData, formState.childId))
          : await createChild(formData);

        if (!result.success) {
          setError(result.error ?? 'Unable to save child.');
          return;
        }

        resetForm();
        router.refresh();
      })();
    });
  }

  function handleDelete(childId: string) {
    startTransition(() => {
      void (async () => {
        setError(null);

        const formData = new FormData();
        formData.set('child_id', childId);

        const result = await deleteChild(formData);

        if (!result.success) {
          setError(result.error ?? 'Unable to remove child.');
          return;
        }

        if (formState.childId === childId) {
          resetForm();
        }

        router.refresh();
      })();
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Manage Children</CardTitle>
            <CardDescription>
              Search a center, lock the class list to that center, then add or edit a
              child from the same surface.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="child-name">Child Name</Label>
                <Input
                  id="child-name"
                  name="name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter child name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth-date">Birth Date</Label>
                <Input
                  id="birth-date"
                  name="birth_date"
                  type="date"
                  value={formState.birthDate}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      birthDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="center-search">Search Center</Label>
              <Input
                id="center-search"
                value={formState.centerSearch}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    centerSearch: event.target.value,
                  }))
                }
                placeholder="Type a center name"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                {filteredCenters.map((center) => (
                  <Button
                    key={center.id}
                    type="button"
                    variant={
                      center.id === formState.selectedCenterId ? 'default' : 'outline'
                    }
                    className="justify-start"
                    aria-pressed={center.id === formState.selectedCenterId}
                    onClick={() => handleCenterSelect(center.id)}
                  >
                    {center.name}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Selected center: {selectedCenter?.name ?? 'None'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-select-trigger">Class</Label>
              <Select
                value={formState.classId}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    classId: value,
                  }))
                }
                disabled={!formState.selectedCenterId}
              >
                <SelectTrigger
                  id="class-select-trigger"
                  data-testid="class-select-trigger"
                  className="w-full"
                  disabled={!formState.selectedCenterId}
                >
                  <SelectValue>
                    {selectedClassLabel || 'Select a class'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {scopedClasses.map((childcareClass) => (
                    <SelectItem key={childcareClass.id} value={childcareClass.id}>
                      {childcareClass.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  !formState.name.trim() ||
                  !formState.selectedCenterId ||
                  !formState.classId
                }
              >
                {formState.childId ? 'Save Child' : 'Add Child'}
              </Button>
              {formState.childId ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Children</CardTitle>
            <CardDescription>
              Edit or remove existing children without leaving this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {childRecords.length > 0 ? (
              childRecords.map((child) => (
                <div
                  key={child.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-600">
                        {child.cms_childcare_classes.cms_childcare_centers.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {child.cms_childcare_classes.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(child)}
                      >
                        {`Edit ${child.name}`}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(child.id)}
                        disabled={isPending}
                      >
                        {`Remove ${child.name}`}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600">
                No children have been added yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
