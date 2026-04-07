export interface Member {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  member_no: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  member_id: string;
  bank_code: string;
  account_number_enc: string;
  account_holder: string;
  consent_status: 'pending' | 'consented' | 'revoked';
  consented_at: string | null;
  created_at: string;
}

export interface BillingSchedule {
  id: string;
  member_id: string;
  account_id: string;
  amount: number;
  billing_day: number;
  is_active: boolean;
  created_at: string;
}

export interface BillingBatch {
  id: string;
  batch_month: string;
  status: 'pending' | 'processing' | 'completed';
  total_count: number;
  success_count: number;
  fail_count: number;
  created_at: string;
}

export interface BillingResult {
  id: string;
  batch_id: string;
  member_id: string;
  account_id: string;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  fail_reason: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface ChildcareCenter {
  id: string;
  name: string;
  created_at: string;
}

export interface ChildcareClass {
  id: string;
  center_id: string;
  name: string;
  created_at: string;
}

export interface Child {
  id: string;
  parent_member_id: string;
  class_id: string;
  name: string;
  birth_date: string | null;
  created_at: string;
  updated_at: string;
}

export type ConsentStatus = 'pending' | 'consented' | 'revoked';
export type BillingStatus = 'pending' | 'success' | 'failed';
export type BatchStatus = 'pending' | 'processing' | 'completed';
export type ChildcareCenterSummary = Pick<ChildcareCenter, 'id' | 'name'>;
export type ChildcareClassSummary = Pick<ChildcareClass, 'id' | 'center_id' | 'name'>;

export type ChildcareClassWithCenter = ChildcareClass & {
  cms_childcare_centers: ChildcareCenter;
};

export type ChildWithClass = Child & {
  cms_childcare_classes: ChildcareClassWithCenter;
};

export type MemberWithChildren = Member & {
  cms_children: ChildWithClass[];
};
