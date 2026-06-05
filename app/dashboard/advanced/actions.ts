"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import type { Json } from "@/types/database";

export async function updateAssetLifecycleAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const itemId = requiredText(formData, "itemId", "/dashboard/assets");
  const db = supabase as any;
  const update = {
    supplier: clean(formData.get("supplier")),
    warranty_expiration: clean(formData.get("warrantyExpiration")),
    model: clean(formData.get("model")),
    manufacturer: clean(formData.get("manufacturer")),
    expected_replacement_date: clean(formData.get("expectedReplacementDate")),
    end_of_life_date: clean(formData.get("endOfLifeDate")),
    lifecycle_status: String(formData.get("lifecycleStatus") || "active"),
    updated_at: new Date().toISOString(),
  };
  const { data: item, error } = await db
    .from("inventory_items")
    .update(update)
    .eq("id", itemId)
    .eq("organization_id", organizationId)
    .select("id, name")
    .single();

  if (error || !item) redirect("/dashboard/assets?error=save");
  await db.from("asset_lifecycle_events").insert({
    organization_id: organizationId,
    inventory_item_id: item.id,
    event_type: "updated",
    title: "Lifecycle details updated",
    notes: clean(formData.get("notes")),
    created_by: user.id,
  });
  await activity(supabase, organizationId, "asset_lifecycle_updated", "Asset lifecycle updated", item.name, user.id, { itemId: item.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
  redirect("/dashboard/assets?updated=1");
}

export async function createAssetLifecycleEventAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const itemId = requiredText(formData, "itemId", "/dashboard/assets");
  const eventType = String(formData.get("eventType") || "service");
  const title = requiredText(formData, "title", "/dashboard/assets");
  const db = supabase as any;
  const { data: event, error } = await db.from("asset_lifecycle_events").insert({
    organization_id: organizationId,
    inventory_item_id: itemId,
    event_type: eventType,
    title,
    event_date: clean(formData.get("eventDate")),
    cost: numberOrNull(formData.get("cost")),
    supplier: clean(formData.get("supplier")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, title").single();

  if (error || !event) redirect("/dashboard/assets?error=create");
  await activity(
    supabase,
    organizationId,
    eventType === "repair" ? "asset_repair_recorded" : eventType === "retired" ? "asset_retired" : "asset_lifecycle_updated",
    eventType === "repair" ? "Asset repair recorded" : eventType === "retired" ? "Asset retired" : "Asset lifecycle event added",
    event.title,
    user.id,
    { itemId, lifecycleEventId: event.id },
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/assets");
  redirect("/dashboard/assets?created=1");
}

export async function createOnboardingAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/onboarding");
  const db = supabase as any;
  const { data: process, error } = await db.from("onboarding_processes").insert({
    organization_id: organizationId,
    name,
    role_title: clean(formData.get("roleTitle")),
    department: clean(formData.get("department")),
    start_date: clean(formData.get("startDate")),
    manager_member_id: clean(formData.get("managerMemberId")),
    location: clean(formData.get("location")),
    status: String(formData.get("status") || "pending"),
    progress: numberOrZero(formData.get("progress")),
    checklist: checklistFromText(formData.get("checklist")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !process) redirect("/dashboard/onboarding?error=create");
  await activity(supabase, organizationId, "onboarding_started", "Onboarding started", process.name, user.id, { onboardingId: process.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/onboarding");
  redirect("/dashboard/onboarding?created=1");
}

export async function createOffboardingAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/offboarding");
  const db = supabase as any;
  const { data: process, error } = await db.from("offboarding_processes").insert({
    organization_id: organizationId,
    member_id: clean(formData.get("memberId")),
    name,
    role_title: clean(formData.get("roleTitle")),
    department: clean(formData.get("department")),
    departure_date: clean(formData.get("departureDate")),
    manager_member_id: clean(formData.get("managerMemberId")),
    status: String(formData.get("status") || "pending"),
    checklist: checklistFromText(formData.get("checklist")),
    missing_assets_count: numberOrZero(formData.get("missingAssetsCount")),
    outstanding_keys_count: numberOrZero(formData.get("outstandingKeysCount")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !process) redirect("/dashboard/offboarding?error=create");
  await activity(supabase, organizationId, "offboarding_started", "Offboarding started", process.name, user.id, { offboardingId: process.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/offboarding");
  redirect("/dashboard/offboarding?created=1");
}

export async function createPolicyAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/policies");
  const status = String(formData.get("status") || "draft");
  const db = supabase as any;
  const { data: policy, error } = await db.from("policies").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    version: clean(formData.get("version")) ?? "1.0",
    status,
    file_path: clean(formData.get("filePath")),
    require_acknowledgement: formData.get("requireAcknowledgement") === "on",
    require_signature: formData.get("requireSignature") === "on",
    published_at: status === "published" ? new Date().toISOString() : null,
    created_by: user.id,
  }).select("id, title").single();
  if (error || !policy) redirect("/dashboard/policies?error=create");
  if (status === "published") {
    await activity(supabase, organizationId, "policy_published", "Policy published", policy.title, user.id, { policyId: policy.id });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/policies");
  redirect("/dashboard/policies?created=1");
}

export async function createTrainingAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/training");
  const status = String(formData.get("status") || "not_started");
  const db = supabase as any;
  const { data: training, error } = await db.from("training_records").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    member_id: clean(formData.get("memberId")),
    status,
    due_date: clean(formData.get("dueDate")),
    completed_at: status === "completed" ? new Date().toISOString() : null,
    expires_at: clean(formData.get("expiresAt")),
    certification_file_path: clean(formData.get("certificationFilePath")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, title").single();
  if (error || !training) redirect("/dashboard/training?error=create");
  if (status === "completed") {
    await activity(supabase, organizationId, "training_completed", "Training completed", training.title, user.id, { trainingId: training.id });
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/training");
  redirect("/dashboard/training?created=1");
}

export async function createVoteAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/voting");
  const db = supabase as any;
  const { data: vote, error } = await db.from("votes").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    vote_type: String(formData.get("voteType") || "vote"),
    status: String(formData.get("status") || "draft"),
    anonymous: formData.get("anonymous") === "on",
    starts_at: clean(formData.get("startsAt")),
    ends_at: clean(formData.get("endsAt")),
    created_by: user.id,
  }).select("id, title").single();
  if (error || !vote) redirect("/dashboard/voting?error=create");
  const options = String(formData.get("options") || "").split("\n").map((label) => label.trim()).filter(Boolean);
  if (options.length) {
    await db.from("vote_options").insert(options.map((label: string) => ({ organization_id: organizationId, vote_id: vote.id, label })));
  }
  await activity(supabase, organizationId, "vote_created", "Vote created", vote.title, user.id, { voteId: vote.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/voting");
  redirect("/dashboard/voting?created=1");
}

export async function createBudgetAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/budgets");
  const db = supabase as any;
  const { data: budget, error } = await db.from("budget_categories").insert({
    organization_id: organizationId,
    name,
    planned_amount: numberOrZero(formData.get("plannedAmount")),
    actual_amount: numberOrZero(formData.get("actualAmount")),
    category: clean(formData.get("category")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !budget) redirect("/dashboard/budgets?error=create");
  await activity(supabase, organizationId, "budget_updated", "Budget updated", budget.name, user.id, { budgetId: budget.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
  redirect("/dashboard/budgets?created=1");
}

export async function createVehicleAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/vehicles");
  const db = supabase as any;
  const { data: vehicle, error } = await db.from("vehicles").insert({
    organization_id: organizationId,
    name,
    registration_number: clean(formData.get("registrationNumber")),
    vin: clean(formData.get("vin")),
    status: String(formData.get("status") || "active"),
    assigned_member_id: clean(formData.get("assignedMemberId")),
    next_service_date: clean(formData.get("nextServiceDate")),
    inspection_date: clean(formData.get("inspectionDate")),
    insurance_date: clean(formData.get("insuranceDate")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !vehicle) redirect("/dashboard/vehicles?error=create");
  await activity(supabase, organizationId, "vehicle_service_recorded", "Vehicle record updated", vehicle.name, user.id, { vehicleId: vehicle.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/vehicles");
  redirect("/dashboard/vehicles?created=1");
}

export async function createLocationAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/locations");
  const db = supabase as any;
  const { data: location, error } = await db.from("locations").insert({
    organization_id: organizationId,
    name,
    location_type: String(formData.get("locationType") || "location"),
    parent_location_id: clean(formData.get("parentLocationId")),
    building: clean(formData.get("building")),
    floor: clean(formData.get("floor")),
    room: clean(formData.get("room")),
    description: clean(formData.get("description")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !location) redirect("/dashboard/locations?error=create");
  await activity(supabase, organizationId, "location_created", "Location created", location.name, user.id, { locationId: location.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/locations");
  redirect("/dashboard/locations?created=1");
}

export async function createEventAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/events");
  const startAt = requiredText(formData, "startAt", "/dashboard/events");
  const db = supabase as any;
  const { data: event, error } = await db.from("events").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    start_at: startAt,
    end_at: clean(formData.get("endAt")),
    location: clean(formData.get("location")),
    capacity: numberOrNull(formData.get("capacity")),
    registration_deadline: clean(formData.get("registrationDeadline")),
    status: String(formData.get("status") || "draft"),
    qr_value: `event:${crypto.randomUUID()}`,
    created_by: user.id,
  }).select("id, title").single();
  if (error || !event) redirect("/dashboard/events?error=create");
  await activity(supabase, organizationId, "event_created", "Event created", event.title, user.id, { eventId: event.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events");
  redirect("/dashboard/events?created=1");
}

export async function createAnnouncementAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/announcements");
  const status = String(formData.get("status") || "draft");
  const db = supabase as any;
  const { data: announcement, error } = await db.from("announcements").insert({
    organization_id: organizationId,
    title,
    content: clean(formData.get("content")),
    target_audience: clean(formData.get("targetAudience")),
    status,
    pinned: formData.get("pinned") === "on",
    publish_at: clean(formData.get("publishAt")),
    expires_at: clean(formData.get("expiresAt")),
    created_by: user.id,
  }).select("id, title").single();
  if (error || !announcement) redirect("/dashboard/announcements?error=create");
  if (status === "published") await activity(supabase, organizationId, "announcement_published", "Announcement published", announcement.title, user.id, { announcementId: announcement.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/announcements");
  redirect("/dashboard/announcements?created=1");
}

export async function createProjectAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/projects");
  const status = String(formData.get("status") || "planning");
  const db = supabase as any;
  const { data: project, error } = await db.from("projects").insert({
    organization_id: organizationId,
    name,
    description: clean(formData.get("description")),
    status,
    due_date: clean(formData.get("dueDate")),
    progress: numberOrZero(formData.get("progress")),
    attachment_path: clean(formData.get("attachmentPath")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !project) redirect("/dashboard/projects?error=create");
  if (status === "completed") await activity(supabase, organizationId, "project_completed", "Project completed", project.name, user.id, { projectId: project.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  redirect("/dashboard/projects?created=1");
}

export async function createContractAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/contracts");
  const db = supabase as any;
  const { data: contract, error } = await db.from("contracts").insert({
    organization_id: organizationId,
    title,
    category: clean(formData.get("category")),
    supplier: clean(formData.get("supplier")),
    start_date: clean(formData.get("startDate")),
    expiration_date: clean(formData.get("expirationDate")),
    renewal_date: clean(formData.get("renewalDate")),
    status: String(formData.get("status") || "draft"),
    file_path: clean(formData.get("filePath")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, title").single();
  if (error || !contract) redirect("/dashboard/contracts?error=create");
  await activity(supabase, organizationId, "contract_renewed", "Contract record updated", contract.title, user.id, { contractId: contract.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/contracts");
  redirect("/dashboard/contracts?created=1");
}

export async function createKnowledgeArticleAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/knowledge-base");
  const status = String(formData.get("status") || "draft");
  const db = supabase as any;
  const { data: article, error } = await db.from("knowledge_articles").insert({
    organization_id: organizationId,
    title,
    content: clean(formData.get("content")),
    status,
    version: clean(formData.get("version")) ?? "1.0",
    updated_by: user.id,
  }).select("id, title").single();
  if (error || !article) redirect("/dashboard/knowledge-base?error=create");
  if (status === "published") await activity(supabase, organizationId, "article_published", "Article published", article.title, user.id, { articleId: article.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/knowledge-base");
  redirect("/dashboard/knowledge-base?created=1");
}

export async function createProcurementAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/procurement");
  const status = String(formData.get("status") || "draft");
  const db = supabase as any;
  const { data: request, error } = await db.from("procurement_requests").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    supplier: clean(formData.get("supplier")),
    cost_estimate: numberOrNull(formData.get("costEstimate")),
    priority: String(formData.get("priority") || "normal"),
    status,
    requested_by: user.id,
  }).select("id, title").single();
  if (error || !request) redirect("/dashboard/procurement?error=create");
  if (status === "approved") await activity(supabase, organizationId, "purchase_approved", "Purchase approved", request.title, user.id, { procurementRequestId: request.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/procurement");
  redirect("/dashboard/procurement?created=1");
}

export async function createDepartmentAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/departments");
  const db = supabase as any;
  const { data: department, error } = await db.from("departments").insert({
    organization_id: organizationId,
    name,
    description: clean(formData.get("description")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !department) redirect("/dashboard/departments?error=create");
  await activity(supabase, organizationId, "department_created", "Department created", department.name, user.id, { departmentId: department.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/departments");
  redirect("/dashboard/departments?created=1");
}

export async function createTimeEntryAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const startedAt = requiredText(formData, "startedAt", "/dashboard/time-tracking");
  const status = String(formData.get("status") || "draft");
  const db = supabase as any;
  const { data: entry, error } = await db.from("time_entries").insert({
    organization_id: organizationId,
    entry_type: String(formData.get("entryType") || "work"),
    started_at: startedAt,
    ended_at: clean(formData.get("endedAt")),
    hours: numberOrNull(formData.get("hours")),
    status,
    notes: clean(formData.get("notes")),
    approved_by: status === "approved" ? user.id : null,
    created_by: user.id,
  }).select("id").single();
  if (error || !entry) redirect("/dashboard/time-tracking?error=create");
  if (status === "approved") await activity(supabase, organizationId, "timesheet_approved", "Timesheet approved", "Time entry approved.", user.id, { timeEntryId: entry.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/time-tracking");
  redirect("/dashboard/time-tracking?created=1");
}

export async function createSponsorAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/sponsors");
  const db = supabase as any;
  const { data: sponsor, error } = await db.from("sponsors").insert({
    organization_id: organizationId,
    name,
    sponsor_type: String(formData.get("sponsorType") || "sponsor"),
    contact_person: clean(formData.get("contactPerson")),
    email: clean(formData.get("email")),
    phone: clean(formData.get("phone")),
    sponsorship_value: numberOrNull(formData.get("sponsorshipValue")),
    renewal_date: clean(formData.get("renewalDate")),
    agreement_path: clean(formData.get("agreementPath")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !sponsor) redirect("/dashboard/sponsors?error=create");
  await activity(supabase, organizationId, "sponsor_added", "Sponsor added", sponsor.name, user.id, { sponsorId: sponsor.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/sponsors");
  redirect("/dashboard/sponsors?created=1");
}

export async function createIdeaAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/ideas");
  const db = supabase as any;
  const { data: idea, error } = await db.from("ideas").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    category: clean(formData.get("category")),
    status: String(formData.get("status") || "new"),
    created_by: user.id,
  }).select("id, title").single();
  if (error || !idea) redirect("/dashboard/ideas?error=create");
  await activity(supabase, organizationId, "idea_submitted", "Idea submitted", idea.title, user.id, { ideaId: idea.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/ideas");
  redirect("/dashboard/ideas?created=1");
}

export async function createRiskAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/risks");
  const db = supabase as any;
  const { data: risk, error } = await db.from("risks").insert({
    organization_id: organizationId,
    title,
    category: clean(formData.get("category")),
    impact_level: String(formData.get("impactLevel") || "medium"),
    probability_level: String(formData.get("probabilityLevel") || "medium"),
    mitigation_plan: clean(formData.get("mitigationPlan")),
    review_date: clean(formData.get("reviewDate")),
    status: String(formData.get("status") || "open"),
    created_by: user.id,
  }).select("id, title").single();
  if (error || !risk) redirect("/dashboard/risks?error=create");
  await activity(supabase, organizationId, "risk_created", "Risk created", risk.title, user.id, { riskId: risk.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/risks");
  redirect("/dashboard/risks?created=1");
}

export async function createReportAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/reports");
  const db = supabase as any;
  const { data: report, error } = await db.from("reports").insert({
    organization_id: organizationId,
    name,
    description: clean(formData.get("description")),
    export_format: String(formData.get("exportFormat") || "csv"),
    last_generated_at: new Date().toISOString(),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !report) redirect("/dashboard/reports?error=create");
  await activity(supabase, organizationId, "report_generated", "Report generated", report.name, user.id, { reportId: report.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reports");
  redirect("/dashboard/reports?created=1");
}

function requiredText(formData: FormData, key: string, failTo: string) {
  const text = String(formData.get(key) || "").trim();
  if (text.length < 2) redirect(`${failTo}?error=invalid`);
  return text;
}

function clean(value: FormDataEntryValue | null) {
  const text = String(value || "").trim();
  return text || null;
}

function numberOrNull(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isFinite(number) && String(value || "").trim() ? number : null;
}

function numberOrZero(value: FormDataEntryValue | null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function checklistFromText(value: FormDataEntryValue | null) {
  return String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({ label, done: false })) as Json;
}

async function activity(supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"], organizationId: string, type: any, title: string, description: string, actorId: string, metadata: Record<string, unknown>) {
  await recordActivityEvent({ supabase, organizationId, type, title, description, actorId, metadata: metadata as Json });
}
