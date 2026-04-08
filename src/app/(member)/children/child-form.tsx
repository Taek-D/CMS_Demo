'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
          setError(result.error ?? '자녀 정보를 저장하지 못했습니다.');
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
          setError(result.error ?? '자녀 정보를 삭제하지 못했습니다.');
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
    <div className="shell-frame px-4 pb-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <span className="section-eyebrow">자녀 등록</span>
            <CardTitle className="text-[1.9rem]">자녀 정보와 소속 반을 연결하세요</CardTitle>
            <CardDescription>
              어린이집을 먼저 찾고, 해당 기관에 속한 반만 선택할 수 있도록 구성했습니다.
              한 화면에서 신규 등록과 수정까지 이어서 처리할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6" data-testid="child-form">
            {error ? (
              <div className="rounded-[1.15rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="child-name">자녀 이름</Label>
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
                  placeholder="자녀 이름을 입력해 주세요"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth-date">생년월일</Label>
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
              <Label htmlFor="center-search">어린이집 검색</Label>
              <Input
                id="center-search"
                data-testid="center-search"
                value={formState.centerSearch}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    centerSearch: event.target.value,
                  }))
                }
                placeholder="어린이집 이름을 입력해 주세요"
              />
              <div className="grid gap-2 sm:grid-cols-2" data-testid="center-select">
                {filteredCenters.map((center) => (
                  <Button
                    key={center.id}
                    type="button"
                    variant={
                      center.id === formState.selectedCenterId ? 'default' : 'outline'
                    }
                    className="h-auto min-h-14 justify-start px-4 py-3 text-left"
                    aria-pressed={center.id === formState.selectedCenterId}
                    data-testid={`center-select-${center.id}`}
                    onClick={() => handleCenterSelect(center.id)}
                  >
                    {center.name}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                선택한 어린이집: {selectedCenter?.name ?? '아직 선택하지 않았습니다'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class-select-trigger">반 선택</Label>
              <Select
                value={formState.classId}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    classId: value ?? '',
                  }))
                }
                disabled={!formState.selectedCenterId}
              >
                <SelectTrigger
                  id="class-select-trigger"
                  data-testid="class-select"
                  className="w-full"
                  disabled={!formState.selectedCenterId}
                >
                  <SelectValue>
                    {selectedClassLabel || '반을 선택해 주세요'}
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
                size="lg"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  !formState.name.trim() ||
                  !formState.selectedCenterId ||
                  !formState.classId
                }
              >
                {formState.childId ? '자녀 정보 저장' : '자녀 등록'}
              </Button>
              {formState.childId ? (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  수정 취소
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <span className="section-eyebrow">등록 현황</span>
            <CardTitle className="text-[1.9rem]">현재 등록된 자녀</CardTitle>
            <CardDescription>
              이미 등록한 자녀 정보는 오른쪽 목록에서 바로 수정하거나 삭제할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-testid="child-list">
            {childRecords.length > 0 ? (
              childRecords.map((child) => (
                <div
                  key={child.id}
                  className="rounded-[1.35rem] border border-border/70 bg-[color:var(--surface-strong)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                  data-testid={`child-card-${child.id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[color:var(--brand-ink)]">
                        {child.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {child.cms_childcare_classes.cms_childcare_centers.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {child.cms_childcare_classes.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid={`edit-child-${child.id}`}
                        onClick={() => handleEdit(child)}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        data-testid={`remove-child-${child.id}`}
                        onClick={() => handleDelete(child.id)}
                        disabled={isPending}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="rounded-[1.35rem] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground"
                data-testid="child-list-empty"
              >
                등록된 자녀가 아직 없습니다.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
