export type AuthenticatedActor = {
  userId: string;
  email: string;
  displayName: string | null;
  provider: "clerk";
};

export type BookmarkRow = {
  termSlug: string;
  createdAt: string;
};

export type NoteRow = {
  id: string;
  termSlug: string;
  title: string | null;
  bodyMarkdown: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
};

export type AnnotationRow = {
  id: string;
  termSlug: string;
  blockId: string;
  startOffset: number | null;
  endOffset: number | null;
  selectedText: string | null;
  noteId: string | null;
  noteBody: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShareLinkRow = {
  id: string;
  userId?: string;
  resourceType: string;
  resourceId: string;
  token: string;
  visibility: string;
  expiresAt: string | null;
  createdAt: string;
};

export type ExportJobRow = {
  id: string;
  exportType: string;
  status: string;
  objectKey: string | null;
  requestedAt: string;
  completedAt: string | null;
};

export type EntitlementRow = {
  id: string;
  planFamily: string;
  billingMode: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function upsertUser(db: D1Database, actor: AuthenticatedActor): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (
         id,
         auth_provider,
         auth_subject,
         email,
         display_name
       ) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         auth_provider = excluded.auth_provider,
         auth_subject = excluded.auth_subject,
         email = excluded.email,
         display_name = excluded.display_name,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(actor.userId, actor.provider, actor.userId, actor.email, actor.displayName)
    .run();
}

export async function listEntitlements(
  db: D1Database,
  actor: AuthenticatedActor,
): Promise<EntitlementRow[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         plan_family AS planFamily,
         billing_mode AS billingMode,
         status,
         starts_at AS startsAt,
         ends_at AS endsAt,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM entitlements
       WHERE user_id = ?
       ORDER BY created_at DESC`,
    )
    .bind(actor.userId)
    .all<EntitlementRow>();

  return result.results ?? [];
}

export async function listBookmarks(db: D1Database, actor: AuthenticatedActor): Promise<BookmarkRow[]> {
  const result = await db
    .prepare(
      `SELECT term_slug AS termSlug, created_at AS createdAt
       FROM bookmarks
       WHERE user_id = ?
       ORDER BY created_at DESC`,
    )
    .bind(actor.userId)
    .all<BookmarkRow>();

  return result.results ?? [];
}

export async function addBookmark(
  db: D1Database,
  actor: AuthenticatedActor,
  termSlug: string,
): Promise<void> {
  await db
    .prepare(
      `INSERT OR IGNORE INTO bookmarks (id, user_id, term_slug)
       VALUES (?, ?, ?)`,
    )
    .bind(`${actor.userId}:${termSlug}`, actor.userId, termSlug)
    .run();
}

export async function removeBookmark(
  db: D1Database,
  actor: AuthenticatedActor,
  termSlug: string,
): Promise<void> {
  await db.prepare(`DELETE FROM bookmarks WHERE user_id = ? AND term_slug = ?`).bind(actor.userId, termSlug).run();
}

export async function listNotes(db: D1Database, actor: AuthenticatedActor): Promise<NoteRow[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         term_slug AS termSlug,
         title,
         body_markdown AS bodyMarkdown,
         visibility,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM notes
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
    )
    .bind(actor.userId)
    .all<NoteRow>();

  return result.results ?? [];
}

export async function upsertNote(
  db: D1Database,
  actor: AuthenticatedActor,
  input: { termSlug: string; title?: string | null; bodyMarkdown: string; visibility?: string | null },
): Promise<void> {
  const noteId = `${actor.userId}:${input.termSlug}`;
  await db
    .prepare(
      `INSERT INTO notes (
         id,
         user_id,
         term_slug,
         title,
         body_markdown,
         visibility
       ) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, term_slug) DO UPDATE SET
         title = excluded.title,
         body_markdown = excluded.body_markdown,
         visibility = excluded.visibility,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      noteId,
      actor.userId,
      input.termSlug,
      input.title?.trim() || null,
      input.bodyMarkdown,
      input.visibility?.trim() || "private",
    )
    .run();
}

export async function deleteNote(
  db: D1Database,
  actor: AuthenticatedActor,
  termSlug: string,
): Promise<void> {
  await db.prepare(`DELETE FROM notes WHERE user_id = ? AND term_slug = ?`).bind(actor.userId, termSlug).run();
}

export async function claimPendingEntitlements(
  db: D1Database,
  actor: AuthenticatedActor,
): Promise<{ claimedCount: number }> {
  const pending = await db
    .prepare(
      `SELECT
         id,
         plan_family,
         billing_mode,
         status,
         billing_provider,
         provider_customer_id,
         provider_subscription_id,
         provider_product_id,
         starts_at,
         ends_at
       FROM pending_entitlements
       WHERE lower(customer_email) = lower(?)
         AND claimed_at IS NULL
       ORDER BY created_at ASC`,
    )
    .bind(actor.email)
    .all<Record<string, string | null>>();

  const rows = pending.results ?? [];
  if (!rows.length) {
    return { claimedCount: 0 };
  }

  await db.batch(
    rows.flatMap((row: Record<string, string | null>) => [
      db.prepare(
        `INSERT INTO entitlements (
           id,
           user_id,
           plan_family,
           billing_mode,
           status,
           billing_provider,
           provider_customer_id,
           provider_subscription_id,
           provider_product_id,
           starts_at,
           ends_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           user_id = excluded.user_id,
           plan_family = excluded.plan_family,
           billing_mode = excluded.billing_mode,
           status = excluded.status,
           billing_provider = excluded.billing_provider,
           provider_customer_id = excluded.provider_customer_id,
           provider_subscription_id = excluded.provider_subscription_id,
           provider_product_id = excluded.provider_product_id,
           starts_at = excluded.starts_at,
           ends_at = excluded.ends_at,
           updated_at = CURRENT_TIMESTAMP`,
      ).bind(
        row.id,
        actor.userId,
        row.plan_family,
        row.billing_mode,
        row.status,
        row.billing_provider,
        row.provider_customer_id,
        row.provider_subscription_id,
        row.provider_product_id,
        row.starts_at,
        row.ends_at,
      ),
      db.prepare(
        `UPDATE pending_entitlements
         SET claimed_by_user_id = ?, claimed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      ).bind(actor.userId, row.id),
    ]),
  );

  return { claimedCount: rows.length };
}

export async function listAnnotations(
  db: D1Database,
  actor: AuthenticatedActor,
  termSlug?: string,
): Promise<AnnotationRow[]> {
  const query = termSlug
    ? `SELECT
         annotations.id AS id,
         annotations.term_slug AS termSlug,
         annotations.block_id AS blockId,
         annotations.start_offset AS startOffset,
         annotations.end_offset AS endOffset,
         annotations.selected_text AS selectedText,
         annotations.note_id AS noteId,
         notes.body_markdown AS noteBody,
         annotations.created_at AS createdAt,
         annotations.updated_at AS updatedAt
       FROM annotations
       LEFT JOIN notes ON notes.id = annotations.note_id
       WHERE annotations.user_id = ? AND annotations.term_slug = ?
       ORDER BY annotations.updated_at DESC`
    : `SELECT
         annotations.id AS id,
         annotations.term_slug AS termSlug,
         annotations.block_id AS blockId,
         annotations.start_offset AS startOffset,
         annotations.end_offset AS endOffset,
         annotations.selected_text AS selectedText,
         annotations.note_id AS noteId,
         notes.body_markdown AS noteBody,
         annotations.created_at AS createdAt,
         annotations.updated_at AS updatedAt
       FROM annotations
       LEFT JOIN notes ON notes.id = annotations.note_id
       WHERE annotations.user_id = ?
       ORDER BY annotations.updated_at DESC`;

  const statement = termSlug
    ? db.prepare(query).bind(actor.userId, termSlug)
    : db.prepare(query).bind(actor.userId);
  const result = await statement.all<AnnotationRow>();
  return result.results ?? [];
}

export async function upsertAnnotation(
  db: D1Database,
  actor: AuthenticatedActor,
  input: {
    annotationId?: string | null;
    termSlug: string;
    blockId: string;
    selectedText?: string | null;
    noteBody?: string | null;
  },
): Promise<string> {
  const annotationId = input.annotationId?.trim() || crypto.randomUUID();
  const noteId = input.noteBody?.trim() ? `${annotationId}:note` : null;

  if (noteId) {
    await db
      .prepare(
        `INSERT INTO notes (
           id,
           user_id,
           term_slug,
           title,
           body_markdown,
           visibility
         ) VALUES (?, ?, ?, ?, ?, 'private')
         ON CONFLICT(id) DO UPDATE SET
           body_markdown = excluded.body_markdown,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(noteId, actor.userId, input.termSlug, `Annotation for ${input.blockId}`, input.noteBody?.trim())
      .run();
  }

  await db
    .prepare(
      `INSERT INTO annotations (
         id,
         user_id,
         term_slug,
         block_id,
         start_offset,
         end_offset,
         selected_text,
         note_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         block_id = excluded.block_id,
         selected_text = excluded.selected_text,
         note_id = excluded.note_id,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      annotationId,
      actor.userId,
      input.termSlug,
      input.blockId,
      null,
      null,
      input.selectedText?.trim() || null,
      noteId,
    )
    .run();

  return annotationId;
}

export async function deleteAnnotation(
  db: D1Database,
  actor: AuthenticatedActor,
  annotationId: string,
): Promise<void> {
  const existing = await db
    .prepare(`SELECT note_id AS noteId FROM annotations WHERE id = ? AND user_id = ?`)
    .bind(annotationId, actor.userId)
    .first<{ noteId: string | null }>();

  await db.prepare(`DELETE FROM annotations WHERE id = ? AND user_id = ?`).bind(annotationId, actor.userId).run();
  if (existing?.noteId) {
    await db.prepare(`DELETE FROM notes WHERE id = ? AND user_id = ?`).bind(existing.noteId, actor.userId).run();
  }
}

export async function listShareLinks(
  db: D1Database,
  actor: AuthenticatedActor,
): Promise<ShareLinkRow[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         resource_type AS resourceType,
         resource_id AS resourceId,
         token,
         visibility,
         expires_at AS expiresAt,
         created_at AS createdAt
       FROM share_links
       WHERE user_id = ?
       ORDER BY created_at DESC`,
    )
    .bind(actor.userId)
    .all<ShareLinkRow>();
  return result.results ?? [];
}

export async function createShareLink(
  db: D1Database,
  actor: AuthenticatedActor,
  input: { resourceType: string; resourceId: string; visibility?: string | null; expiresAt?: string | null },
): Promise<ShareLinkRow> {
  const id = crypto.randomUUID();
  const token = crypto.randomUUID().replace(/-/g, "");
  await db
    .prepare(
      `INSERT INTO share_links (
         id,
         user_id,
         resource_type,
         resource_id,
         token,
         visibility,
         expires_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      actor.userId,
      input.resourceType,
      input.resourceId,
      token,
      input.visibility?.trim() || "private",
      input.expiresAt ?? null,
    )
    .run();

  return {
    id,
    userId: actor.userId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    token,
    visibility: input.visibility?.trim() || "private",
    expiresAt: input.expiresAt ?? null,
    createdAt: new Date().toISOString(),
  };
}

export async function getShareLinkByToken(
  db: D1Database,
  token: string,
): Promise<ShareLinkRow | null> {
  const row = await db
    .prepare(
      `SELECT
         id,
         user_id AS userId,
         resource_type AS resourceType,
         resource_id AS resourceId,
         token,
         visibility,
         expires_at AS expiresAt,
         created_at AS createdAt
       FROM share_links
       WHERE token = ?`,
    )
    .bind(token)
    .first<ShareLinkRow>();

  if (!row) {
    return null;
  }

  if (row.expiresAt && Date.parse(row.expiresAt) < Date.now()) {
    return null;
  }

  if (row.visibility === "private") {
    return null;
  }

  return row;
}

export async function listExportJobs(
  db: D1Database,
  actor: AuthenticatedActor,
): Promise<ExportJobRow[]> {
  const result = await db
    .prepare(
      `SELECT
         id,
         export_type AS exportType,
         status,
         object_key AS objectKey,
         requested_at AS requestedAt,
         completed_at AS completedAt
       FROM export_jobs
       WHERE user_id = ?
       ORDER BY requested_at DESC`,
    )
    .bind(actor.userId)
    .all<ExportJobRow>();
  return result.results ?? [];
}

export async function createExportJob(
  db: D1Database,
  actor: AuthenticatedActor,
  exportType: string,
): Promise<ExportJobRow> {
  const id = crypto.randomUUID();
  const completedAt = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO export_jobs (
         id,
         user_id,
         export_type,
         status,
         object_key,
         completed_at
       ) VALUES (?, ?, ?, 'completed', NULL, ?)`,
    )
    .bind(id, actor.userId, exportType, completedAt)
    .run();

  return {
    id,
    exportType,
    status: "completed",
    objectKey: null,
    requestedAt: completedAt,
    completedAt,
  };
}
