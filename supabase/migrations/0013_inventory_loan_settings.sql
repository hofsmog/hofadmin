-- Organization-level Inventory loan agreement template.

alter table public.organizations
  add column if not exists default_loan_agreement_text text not null
    default 'I confirm that I have received this item and that I am responsible for returning it in the same condition by the agreed return date.';
