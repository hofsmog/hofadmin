"use server";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivityEvent } from "@/lib/activity";
import { requireOrganizationContext } from "@/lib/auth/require-organization-context";
import { sendNotificationEmail } from "@/lib/email/sendNotificationEmail";
import type { Json } from "@/types/database";

export async function createIssueAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/issues");
  const db = supabase as any;
  const { data: issue, error } = await db.from("issues").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    category: clean(formData.get("category")),
    priority: String(formData.get("priority") || "normal"),
    status: String(formData.get("status") || "new"),
    assignee_member_id: clean(formData.get("assigneeMemberId")),
    internal_notes: clean(formData.get("internalNotes")),
    created_by: user.id,
  }).select("id, title").single();

  if (error || !issue) redirect("/dashboard/issues?error=create");
  await activity(supabase, organizationId, "issue_created", "Issue created", issue.title, user.id, { issueId: issue.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/issues");
  redirect("/dashboard/issues?created=1");
}

export async function createFaultReportAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/fault-reports");
  const db = supabase as any;
  const { data: issue } = await db.from("issues").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    category: clean(formData.get("category")) ?? "Fault Report",
    priority: "normal",
    status: "new",
    created_by: user.id,
  }).select("id").single();
  const { data: report, error } = await db.from("fault_reports").insert({
    organization_id: organizationId,
    issue_id: issue?.id ?? null,
    title,
    description: clean(formData.get("description")),
    location: clean(formData.get("location")),
    category: clean(formData.get("category")),
    contact_person: clean(formData.get("contactPerson")),
    contact_email: clean(formData.get("contactEmail")),
    created_by: user.id,
  }).select("id, title").single();

  if (error || !report) redirect("/dashboard/fault-reports?error=create");
  await activity(supabase, organizationId, "fault_report_submitted", "Fault report submitted", report.title, user.id, { faultReportId: report.id, issueId: issue?.id });
  await notify(supabase, organizationId, "New fault report", `${report.title} was submitted.`, `${report.title} was submitted in HofAdmin.`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/fault-reports");
  revalidatePath("/dashboard/issues");
  redirect("/dashboard/fault-reports?created=1");
}

export async function createBookingAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const resourceName = requiredText(formData, "resourceName", "/dashboard/bookings");
  const startAt = String(formData.get("startAt") || "");
  const endAt = String(formData.get("endAt") || "");
  if (!startAt || !endAt || new Date(endAt) <= new Date(startAt)) redirect("/dashboard/bookings?error=invalid");

  const db = supabase as any;
  const { data: conflict } = await db.from("bookings")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("resource_name", resourceName)
    .in("status", ["requested", "approved"])
    .lt("start_at", endAt)
    .gt("end_at", startAt)
    .limit(1);
  if (conflict?.length) redirect("/dashboard/bookings?error=conflict");

  const { data: booking, error } = await db.from("bookings").insert({
    organization_id: organizationId,
    resource_name: resourceName,
    resource_type: clean(formData.get("resourceType")) ?? "Other",
    start_at: startAt,
    end_at: endAt,
    responsible_member_id: clean(formData.get("responsibleMemberId")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, resource_name").single();
  if (error || !booking) redirect("/dashboard/bookings?error=create");
  await activity(supabase, organizationId, "booking_created", "Booking created", booking.resource_name, user.id, { bookingId: booking.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/bookings");
  redirect("/dashboard/bookings?created=1");
}

export async function createKeyAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const name = requiredText(formData, "name", "/dashboard/keys");
  const keyNumber = requiredText(formData, "keyNumber", "/dashboard/keys");
  const holderId = clean(formData.get("holderMemberId"));
  const db = supabase as any;
  const { data: key, error } = await db.from("key_items").insert({
    organization_id: organizationId,
    key_number: keyNumber,
    name,
    category: clean(formData.get("category")),
    location: clean(formData.get("location")),
    status: holderId ? "on_loan" : "available",
    current_holder_member_id: holderId,
    loan_date: holderId ? clean(formData.get("loanDate")) : null,
    return_date: holderId ? clean(formData.get("returnDate")) : null,
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, name").single();
  if (error || !key) redirect("/dashboard/keys?error=create");
  await db.from("key_events").insert({ organization_id: organizationId, key_item_id: key.id, event_type: holderId ? "issued" : "created", note: holderId ? "Key issued to holder." : "Key registered.", created_by: user.id });
  await activity(supabase, organizationId, holderId ? "key_issued" : "issue_updated", holderId ? "Key issued" : "Key registered", key.name, user.id, { keyId: key.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/keys");
  redirect("/dashboard/keys?created=1");
}

export async function createChecklistAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/checklists");
  const items = String(formData.get("items") || "").split("\n").map((item) => item.trim()).filter(Boolean).map((label) => ({ label, done: false }));
  const db = supabase as any;
  const { error } = await db.from("checklists").insert({
    organization_id: organizationId,
    title,
    template_name: clean(formData.get("templateName")),
    assigned_member_id: clean(formData.get("assignedMemberId")),
    due_date: clean(formData.get("dueDate")),
    items,
    created_by: user.id,
  });
  if (error) redirect("/dashboard/checklists?error=create");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/checklists");
  redirect("/dashboard/checklists?created=1");
}

export async function createVisitorAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const visitorName = requiredText(formData, "visitorName", "/dashboard/visitors");
  const db = supabase as any;
  const { data: visitor, error } = await db.from("visitors").insert({
    organization_id: organizationId,
    visitor_name: visitorName,
    company: clean(formData.get("company")),
    email: clean(formData.get("email")),
    phone: clean(formData.get("phone")),
    host_member_id: clean(formData.get("hostMemberId")),
    notes: clean(formData.get("notes")),
    created_by: user.id,
  }).select("id, visitor_name").single();
  if (error || !visitor) redirect("/dashboard/visitors?error=create");
  await activity(supabase, organizationId, "visitor_checked_in", "Visitor checked in", visitor.visitor_name, user.id, { visitorId: visitor.id });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/visitors");
  redirect("/dashboard/visitors?created=1");
}

export async function checkoutVisitorAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const visitorId = String(formData.get("visitorId") || "");
  const db = supabase as any;
  const { data: visitor, error } = await db.from("visitors").update({ status: "checked_out", checked_out_at: new Date().toISOString() }).eq("id", visitorId).eq("organization_id", organizationId).select("id, visitor_name").single();
  if (error || !visitor) redirect("/dashboard/visitors?error=checkout");
  await activity(supabase, organizationId, "visitor_checked_out", "Visitor checked out", visitor.visitor_name, user.id, { visitorId });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/visitors");
  redirect("/dashboard/visitors?updated=1");
}

export async function createPlannerTaskAction(formData: FormData) {
  const { user, supabase, organizationContext } = await requireOrganizationContext();
  const organizationId = organizationContext.activeOrganization.id;
  const title = requiredText(formData, "title", "/dashboard/annual-planner");
  const db = supabase as any;
  const { error } = await db.from("annual_planner_tasks").insert({
    organization_id: organizationId,
    title,
    description: clean(formData.get("description")),
    category: clean(formData.get("category")),
    responsible_member_id: clean(formData.get("responsibleMemberId")),
    due_date: clean(formData.get("dueDate")),
    recurrence: String(formData.get("recurrence") || "none"),
    created_by: user.id,
  });
  if (error) redirect("/dashboard/annual-planner?error=create");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/annual-planner");
  redirect("/dashboard/annual-planner?created=1");
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

async function activity(supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"], organizationId: string, type: any, title: string, description: string, actorId: string, metadata: Record<string, unknown>) {
  await recordActivityEvent({ supabase, organizationId, type, title, description, actorId, metadata: metadata as Json });
}

async function notify(supabase: Awaited<ReturnType<typeof requireOrganizationContext>>["supabase"], organizationId: string, subject: string, preview: string, body: string) {
  const db = supabase as any;
  const { data: preferences } = await db.from("organization_notification_preferences").select("enable_email_notifications, notification_emails").eq("organization_id", organizationId).maybeSingle();
  if (preferences?.enable_email_notifications) {
    await sendNotificationEmail({ to: preferences.notification_emails, subject, preview, body });
  }
}
