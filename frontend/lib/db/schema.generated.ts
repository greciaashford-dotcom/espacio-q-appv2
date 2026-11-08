// AUTO-GENERADO por scripts/gen-db-schema.mjs — no editar a mano.
/* eslint-disable */

export const UserRole = { OWNER_ADMIN: "OWNER_ADMIN", RECEPTION: "RECEPTION", PROFESSIONAL: "PROFESSIONAL" } as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PriceType = { FIXED: "FIXED", FROM: "FROM", CONSULT: "CONSULT" } as const;
export type PriceType = (typeof PriceType)[keyof typeof PriceType];

export const AppointmentStatus = { PENDING_APPROVAL: "PENDING_APPROVAL", CONFIRMED: "CONFIRMED", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", NO_SHOW: "NO_SHOW" } as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const ScheduleSource = { MANUAL: "MANUAL", GOOGLE_BUSINESS: "GOOGLE_BUSINESS", GOOGLE_PLACES: "GOOGLE_PLACES" } as const;
export type ScheduleSource = (typeof ScheduleSource)[keyof typeof ScheduleSource];

export const MediaSourceType = { UPLOAD: "UPLOAD", EXTERNAL_URL: "EXTERNAL_URL", IMPORTED_URL: "IMPORTED_URL" } as const;
export type MediaSourceType = (typeof MediaSourceType)[keyof typeof MediaSourceType];

export const SubscriberStatus = { PENDING: "PENDING", ACTIVE: "ACTIVE", UNSUBSCRIBED: "UNSUBSCRIBED", BOUNCED: "BOUNCED", SUPPRESSED: "SUPPRESSED" } as const;
export type SubscriberStatus = (typeof SubscriberStatus)[keyof typeof SubscriberStatus];

export const CampaignStatus = { DRAFT: "DRAFT", READY: "READY", SCHEDULED: "SCHEDULED", SENDING: "SENDING", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", FAILED: "FAILED" } as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const JobStatus = { PENDING: "PENDING", PROCESSING: "PROCESSING", COMPLETED: "COMPLETED", FAILED: "FAILED", CANCELLED: "CANCELLED" } as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const ClientStatus = { ACTIVE: "ACTIVE", ARCHIVED: "ARCHIVED", ANONYMIZED: "ANONYMIZED" } as const;
export type ClientStatus = (typeof ClientStatus)[keyof typeof ClientStatus];

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  professionalId: string | null;
  active: boolean;
  canExportData: boolean;
  canManageMarketing: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  userAgent: string | null;
  ipRedacted: string | null;
  createdAt: Date;
};

export type SalonSettings = {
  id: string;
  brandName: string;
  tagline: string;
  city: string;
  country: string;
  timezone: string;
  currency: string;
  locale: string;
  googleMapsUrl: string;
  addressLine: string | null;
  postalCode: string | null;
  neighborhood: string | null;
  phone: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  noticeEmail: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  legalOwnerName: string | null;
  legalTaxId: string | null;
  legalRegistryInfo: string | null;
  legalRegisteredAddress: string | null;
  legalDpoEmail: string | null;
  publicBookingEnabled: boolean;
  bookingApprovalMode: string;
  slotIntervalMin: number;
  minAdvanceNoticeMin: number;
  maxBookingHorizonDays: number;
  cancellationFreeHours: number;
  rescheduleFreeHours: number;
  activeScheduleSource: ScheduleSource;
  scheduleConfirmed: boolean;
  lastScheduleVerifiedAt: Date | null;
  contactRetentionDays: number;
  exportRetentionHours: number;
  analyticsCookiesEnabled: boolean;
  marketingCookiesEnabled: boolean;
  externalMapEmbedEnabled: boolean;
  setupWizardCompleted: boolean;
  updatedAt: Date;
};

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Service = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  priceType: PriceType;
  priceCents: number | null;
  currency: string;
  featured: boolean;
  active: boolean;
  imageAssetId: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  faqJson: any | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Professional = {
  id: string;
  name: string;
  slug: string;
  roleTitle: string;
  bio: string | null;
  specialties: string[];
  photoAssetId: string | null;
  active: boolean;
  publicVisible: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProfessionalService = {
  id: string;
  professionalId: string;
  serviceId: string;
  customDurationMin: number | null;
  customPriceCents: number | null;
  active: boolean;
};

export type WorkingSchedule = {
  id: string;
  targetType: string;
  professionalId: string | null;
  dayOfWeek: number;
  isOpen: boolean;
  intervalsJson: any;
  source: ScheduleSource;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ScheduleException = {
  id: string;
  targetType: string;
  professionalId: string | null;
  dateStr: string;
  isClosed: boolean;
  intervalsJson: any | null;
  reason: string | null;
  source: ScheduleSource;
  authorized: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Client = {
  id: string;
  externalId: string | null;
  firstName: string;
  lastName: string | null;
  email: string | null;
  emailNormalized: string | null;
  phone: string | null;
  phoneNormalized: string | null;
  tags: string[];
  internalNotes: string | null;
  preferredCommunication: string;
  marketingConsent: boolean;
  marketingConsentAt: Date | null;
  marketingConsentSource: string | null;
  marketingPolicyVersion: string | null;
  welcomeSentAt: Date | null;
  status: ClientStatus;
  anonymizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Appointment = {
  id: string;
  referenceCode: string;
  clientId: string;
  serviceId: string;
  professionalId: string;
  assignedAnyProfessional: boolean;
  status: AppointmentStatus;
  attendanceConfirmedAt: Date | null;
  dateStrMadrid: string;
  startTimeMadrid: string;
  endTimeMadrid: string;
  startAtUtc: Date;
  endAtUtc: Date;
  blockStartAtUtc: Date;
  blockEndAtUtc: Date;
  serviceNameSnapshot: string;
  durationMinSnapshot: number;
  bufferBeforeSnapshot: number;
  bufferAfterSnapshot: number;
  priceTypeSnapshot: PriceType;
  priceCentsSnapshot: number | null;
  currencySnapshot: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerNotes: string | null;
  internalNotes: string | null;
  manageTokenHash: string;
  manageTokenExpiresAt: Date;
  manageTokenRevoked: boolean;
  idempotencyKey: string | null;
  version: number;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AppointmentEvent = {
  id: string;
  appointmentId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorType: string;
  actorId: string | null;
  detailsJson: any | null;
  createdAt: Date;
};

export type Occupancy = {
  id: string;
  professionalId: string;
  appointmentId: string | null;
  reason: string;
  startAtUtc: Date;
  endAtUtc: Date;
  active: boolean;
  expiresAtUtc: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ResourceReservation = {
  id: string;
  resourceKey: string;
  resourceName: string;
  appointmentId: string | null;
  startAtUtc: Date;
  endAtUtc: Date;
  active: boolean;
  createdAt: Date;
};

export type MediaAsset = {
  id: string;
  internalName: string;
  src: string;
  sourceType: MediaSourceType;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
  altText: string;
  caption: string | null;
  category: string;
  focalPointX: number;
  focalPointY: number;
  sortOrder: number;
  authorCredit: string | null;
  licenseNote: string | null;
  isProvisional: boolean;
  publicVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MediaUsage = {
  id: string;
  mediaAssetId: string;
  locationKey: string;
  locationName: string;
  createdAt: Date;
};

export type PageContent = {
  id: string;
  key: string;
  title: string;
  category: string;
  slug: string | null;
  draftData: any;
  publishedData: any;
  hasUnpublished: boolean;
  isPublished: boolean;
  version: number;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedBy: string | null;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type ContentRevision = {
  id: string;
  pageContentId: string;
  version: number;
  snapshotData: any;
  changeNote: string | null;
  createdBy: string | null;
  createdAt: Date;
};

export type Subscriber = {
  id: string;
  email: string;
  emailNormalized: string;
  firstName: string | null;
  tags: string[];
  status: SubscriberStatus;
  verifyTokenHash: string | null;
  verifyTokenExpiresAt: Date | null;
  unsubscribeTokenHash: string;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  policyVersion: string;
  source: string;
  welcomeSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ConsentEvent = {
  id: string;
  subscriberId: string | null;
  clientId: string | null;
  email: string;
  action: string;
  channel: string;
  policyVersion: string;
  consentText: string;
  createdAt: Date;
};

export type Suppression = {
  id: string;
  emailNormalized: string;
  reason: string;
  sourceEventId: string | null;
  createdAt: Date;
};

export type Campaign = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  heading: string;
  bodyText: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  heroImageUrl: string | null;
  segmentFilterJson: any;
  status: CampaignStatus;
  scheduledAtUtc: Date | null;
  sentAtUtc: Date | null;
  totalRecipients: number;
  acceptedCount: number;
  deliveredCount: number;
  bouncedCount: number;
  complainedCount: number;
  unsubscribedCount: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignRecipient = {
  id: string;
  campaignId: string;
  subscriberId: string;
  emailNormalized: string;
  status: string;
  providerMessageId: string | null;
  sentAt: Date | null;
  deliveredAt: Date | null;
  errorText: string | null;
};

export type EmailTemplate = {
  id: string;
  key: string;
  name: string;
  category: string;
  subject: string;
  preheader: string | null;
  heading: string;
  bodyTemplate: string;
  ctaLabel: string | null;
  footerNote: string | null;
  active: boolean;
  updatedAt: Date;
};

export type AutomationRule = {
  id: string;
  key: string;
  name: string;
  triggerEvent: string;
  templateKey: string;
  offsetMinutes: number;
  active: boolean;
  description: string | null;
  updatedAt: Date;
};

export type OutboxEvent = {
  id: string;
  eventType: string;
  AggregateId: string;
  payloadJson: any;
  processedAt: Date | null;
  createdAt: Date;
};

export type NotificationJob = {
  id: string;
  jobType: string;
  dedupKey: string;
  appointmentId: string | null;
  appointmentVer: number | null;
  payloadJson: any;
  status: JobStatus;
  scheduledAtUtc: Date;
  attempts: number;
  maxAttempts: number;
  nextAttemptUtc: Date;
  lockedUntilUtc: Date | null;
  lastError: string | null;
  completedAtUtc: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmailDelivery = {
  id: string;
  dedupKey: string;
  category: string;
  templateKey: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  status: string;
  providerName: string;
  providerMessageId: string | null;
  appointmentId: string | null;
  campaignId: string | null;
  errorMessage: string | null;
  acceptedAt: Date | null;
  deliveredAt: Date | null;
  bouncedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ImportJob = {
  id: string;
  fileName: string;
  mode: string;
  totalRows: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  status: string;
  actorUserId: string | null;
  createdAt: Date;
};

export type ImportRowResult = {
  id: string;
  importJobId: string;
  rowNumber: number;
  action: string;
  message: string;
  email: string | null;
};

export type ExportJob = {
  id: string;
  scope: string;
  columnsJson: any;
  rowCount: number;
  downloadToken: string;
  expiresAtUtc: Date;
  actorUserId: string | null;
  createdAt: Date;
};

export type IntegrationConnection = {
  id: string;
  provider: string;
  status: string;
  accountLabel: string | null;
  externalLocationId: string | null;
  externalLocationTitle: string | null;
  encryptedAccessToken: string | null;
  encryptedRefreshToken: string | null;
  tokenExpiresAt: Date | null;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  configJson: any | null;
  updatedAt: Date;
};

export type SyncEvent = {
  id: string;
  provider: string;
  status: string;
  summary: string;
  detailsJson: any | null;
  createdAt: Date;
};

export type ScheduleConflictAlert = {
  id: string;
  appointmentId: string;
  reason: string;
  source: string;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
};

export type AuditEvent = {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  metadata: any | null;
  createdAt: Date;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  repliedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RateLimitHit = {
  id: string;
  key: string;
  createdAt: Date;
};

export const MODEL_META = {"user":{"name":"User","collection":"user","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"email":{"name":"email","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"passwordHash":{"name":"passwordHash","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"role":{"name":"role","type":"UserRole","isList":false,"isOptional":false,"default":{"kind":"value","value":"RECEPTION"},"kind":"enum"},"professionalId":{"name":"professionalId","type":"String","isList":false,"isOptional":true,"isUnique":true,"kind":"scalar"},"professional":{"name":"professional","type":"Professional","isList":false,"isOptional":true,"fk":"professionalId","ref":"id","onDelete":"SetNull","kind":"relation"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"canExportData":{"name":"canExportData","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"canManageMarketing":{"name":"canManageMarketing","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"lastLoginAt":{"name":"lastLoginAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"sessions":{"name":"sessions","type":"Session","isList":true,"isOptional":false,"kind":"relation","backFk":"userId","backRef":"id"},"auditEvents":{"name":"auditEvents","type":"AuditEvent","isList":true,"isOptional":false,"kind":"relation","backFk":"actorUserId","backRef":"id"}},"uniques":[["email"],["professionalId"]],"indexes":[]},"session":{"name":"Session","collection":"session","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"tokenHash":{"name":"tokenHash","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"userId":{"name":"userId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"user":{"name":"user","type":"User","isList":false,"isOptional":false,"fk":"userId","ref":"id","onDelete":"Cascade","kind":"relation"},"expiresAt":{"name":"expiresAt","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"userAgent":{"name":"userAgent","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"ipRedacted":{"name":"ipRedacted","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[["tokenHash"]],"indexes":[["userId"],["expiresAt"]]},"salonSettings":{"name":"SalonSettings","collection":"salonSettings","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"value","value":"default"},"kind":"scalar"},"brandName":{"name":"brandName","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"ESPACIO Q"},"kind":"scalar"},"tagline":{"name":"tagline","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"Un espacio para cuidar de ti"},"kind":"scalar"},"city":{"name":"city","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"Madrid"},"kind":"scalar"},"country":{"name":"country","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"España"},"kind":"scalar"},"timezone":{"name":"timezone","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"Europe/Madrid"},"kind":"scalar"},"currency":{"name":"currency","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"EUR"},"kind":"scalar"},"locale":{"name":"locale","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"es-ES"},"kind":"scalar"},"googleMapsUrl":{"name":"googleMapsUrl","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"addressLine":{"name":"addressLine","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"postalCode":{"name":"postalCode","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"neighborhood":{"name":"neighborhood","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"phone":{"name":"phone","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"whatsapp":{"name":"whatsapp","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"contactEmail":{"name":"contactEmail","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"noticeEmail":{"name":"noticeEmail","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"instagramUrl":{"name":"instagramUrl","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"facebookUrl":{"name":"facebookUrl","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"tiktokUrl":{"name":"tiktokUrl","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"legalOwnerName":{"name":"legalOwnerName","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"legalTaxId":{"name":"legalTaxId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"legalRegistryInfo":{"name":"legalRegistryInfo","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"legalRegisteredAddress":{"name":"legalRegisteredAddress","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"legalDpoEmail":{"name":"legalDpoEmail","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"publicBookingEnabled":{"name":"publicBookingEnabled","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"bookingApprovalMode":{"name":"bookingApprovalMode","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"AUTOMATIC"},"kind":"scalar"},"slotIntervalMin":{"name":"slotIntervalMin","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":15},"kind":"scalar"},"minAdvanceNoticeMin":{"name":"minAdvanceNoticeMin","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":120},"kind":"scalar"},"maxBookingHorizonDays":{"name":"maxBookingHorizonDays","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":60},"kind":"scalar"},"cancellationFreeHours":{"name":"cancellationFreeHours","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":24},"kind":"scalar"},"rescheduleFreeHours":{"name":"rescheduleFreeHours","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":24},"kind":"scalar"},"activeScheduleSource":{"name":"activeScheduleSource","type":"ScheduleSource","isList":false,"isOptional":false,"default":{"kind":"value","value":"MANUAL"},"kind":"enum"},"scheduleConfirmed":{"name":"scheduleConfirmed","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"lastScheduleVerifiedAt":{"name":"lastScheduleVerifiedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"contactRetentionDays":{"name":"contactRetentionDays","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":365},"kind":"scalar"},"exportRetentionHours":{"name":"exportRetentionHours","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":24},"kind":"scalar"},"analyticsCookiesEnabled":{"name":"analyticsCookiesEnabled","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"marketingCookiesEnabled":{"name":"marketingCookiesEnabled","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"externalMapEmbedEnabled":{"name":"externalMapEmbedEnabled","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"setupWizardCompleted":{"name":"setupWizardCompleted","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[],"indexes":[]},"serviceCategory":{"name":"ServiceCategory","collection":"serviceCategory","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"slug":{"name":"slug","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"description":{"name":"description","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"sortOrder":{"name":"sortOrder","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"services":{"name":"services","type":"Service","isList":true,"isOptional":false,"kind":"relation","backFk":"categoryId","backRef":"id"}},"uniques":[["slug"]],"indexes":[["active","sortOrder"]]},"service":{"name":"Service","collection":"service","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"categoryId":{"name":"categoryId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"category":{"name":"category","type":"ServiceCategory","isList":false,"isOptional":false,"fk":"categoryId","ref":"id","onDelete":"Restrict","kind":"relation"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"slug":{"name":"slug","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"shortDescription":{"name":"shortDescription","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"description":{"name":"description","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"durationMin":{"name":"durationMin","type":"Int","isList":false,"isOptional":false,"kind":"scalar"},"bufferBeforeMin":{"name":"bufferBeforeMin","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"bufferAfterMin":{"name":"bufferAfterMin","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":10},"kind":"scalar"},"priceType":{"name":"priceType","type":"PriceType","isList":false,"isOptional":false,"default":{"kind":"value","value":"FIXED"},"kind":"enum"},"priceCents":{"name":"priceCents","type":"Int","isList":false,"isOptional":true,"kind":"scalar"},"currency":{"name":"currency","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"EUR"},"kind":"scalar"},"featured":{"name":"featured","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"imageAssetId":{"name":"imageAssetId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"imageAsset":{"name":"imageAsset","type":"MediaAsset","isList":false,"isOptional":true,"fk":"imageAssetId","ref":"id","onDelete":"SetNull","kind":"relation"},"seoTitle":{"name":"seoTitle","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"seoDescription":{"name":"seoDescription","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"faqJson":{"name":"faqJson","type":"Json","isList":false,"isOptional":true,"kind":"scalar"},"sortOrder":{"name":"sortOrder","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"professionals":{"name":"professionals","type":"ProfessionalService","isList":true,"isOptional":false,"kind":"relation","backFk":"serviceId","backRef":"id"},"appointments":{"name":"appointments","type":"Appointment","isList":true,"isOptional":false,"kind":"relation","backFk":"serviceId","backRef":"id"}},"uniques":[["slug"]],"indexes":[["active","featured","sortOrder"],["categoryId"]]},"professional":{"name":"Professional","collection":"professional","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"slug":{"name":"slug","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"roleTitle":{"name":"roleTitle","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"bio":{"name":"bio","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"specialties":{"name":"specialties","type":"String","isList":true,"isOptional":false,"kind":"scalar"},"photoAssetId":{"name":"photoAssetId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"photoAsset":{"name":"photoAsset","type":"MediaAsset","isList":false,"isOptional":true,"fk":"photoAssetId","ref":"id","onDelete":"SetNull","kind":"relation"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"publicVisible":{"name":"publicVisible","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"sortOrder":{"name":"sortOrder","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"user":{"name":"user","type":"User","isList":false,"isOptional":true,"kind":"relation","backFk":"professionalId","backRef":"id"},"services":{"name":"services","type":"ProfessionalService","isList":true,"isOptional":false,"kind":"relation","backFk":"professionalId","backRef":"id"},"workingSchedules":{"name":"workingSchedules","type":"WorkingSchedule","isList":true,"isOptional":false,"kind":"relation","backFk":"professionalId","backRef":"id"},"scheduleExceptions":{"name":"scheduleExceptions","type":"ScheduleException","isList":true,"isOptional":false,"kind":"relation","backFk":"professionalId","backRef":"id"},"appointments":{"name":"appointments","type":"Appointment","isList":true,"isOptional":false,"kind":"relation","backFk":"professionalId","backRef":"id"},"occupancies":{"name":"occupancies","type":"Occupancy","isList":true,"isOptional":false,"kind":"relation","backFk":"professionalId","backRef":"id"}},"uniques":[["slug"]],"indexes":[["active","publicVisible","sortOrder"]]},"professionalService":{"name":"ProfessionalService","collection":"professionalService","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"professionalId":{"name":"professionalId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"professional":{"name":"professional","type":"Professional","isList":false,"isOptional":false,"fk":"professionalId","ref":"id","onDelete":"Cascade","kind":"relation"},"serviceId":{"name":"serviceId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"service":{"name":"service","type":"Service","isList":false,"isOptional":false,"fk":"serviceId","ref":"id","onDelete":"Cascade","kind":"relation"},"customDurationMin":{"name":"customDurationMin","type":"Int","isList":false,"isOptional":true,"kind":"scalar"},"customPriceCents":{"name":"customPriceCents","type":"Int","isList":false,"isOptional":true,"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"}},"uniques":[["professionalId","serviceId"]],"indexes":[["serviceId"]]},"workingSchedule":{"name":"WorkingSchedule","collection":"workingSchedule","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"targetType":{"name":"targetType","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"SALON"},"kind":"scalar"},"professionalId":{"name":"professionalId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"professional":{"name":"professional","type":"Professional","isList":false,"isOptional":true,"fk":"professionalId","ref":"id","onDelete":"Cascade","kind":"relation"},"dayOfWeek":{"name":"dayOfWeek","type":"Int","isList":false,"isOptional":false,"kind":"scalar"},"isOpen":{"name":"isOpen","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"intervalsJson":{"name":"intervalsJson","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"source":{"name":"source","type":"ScheduleSource","isList":false,"isOptional":false,"default":{"kind":"value","value":"MANUAL"},"kind":"enum"},"updatedBy":{"name":"updatedBy","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[],"indexes":[["targetType","professionalId","dayOfWeek"]]},"scheduleException":{"name":"ScheduleException","collection":"scheduleException","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"targetType":{"name":"targetType","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"SALON"},"kind":"scalar"},"professionalId":{"name":"professionalId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"professional":{"name":"professional","type":"Professional","isList":false,"isOptional":true,"fk":"professionalId","ref":"id","onDelete":"Cascade","kind":"relation"},"dateStr":{"name":"dateStr","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"isClosed":{"name":"isClosed","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"intervalsJson":{"name":"intervalsJson","type":"Json","isList":false,"isOptional":true,"kind":"scalar"},"reason":{"name":"reason","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"source":{"name":"source","type":"ScheduleSource","isList":false,"isOptional":false,"default":{"kind":"value","value":"MANUAL"},"kind":"enum"},"authorized":{"name":"authorized","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"createdBy":{"name":"createdBy","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[],"indexes":[["targetType","dateStr"],["professionalId","dateStr"]]},"client":{"name":"Client","collection":"client","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"externalId":{"name":"externalId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"firstName":{"name":"firstName","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"lastName":{"name":"lastName","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"email":{"name":"email","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"emailNormalized":{"name":"emailNormalized","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"phone":{"name":"phone","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"phoneNormalized":{"name":"phoneNormalized","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"tags":{"name":"tags","type":"String","isList":true,"isOptional":false,"kind":"scalar"},"internalNotes":{"name":"internalNotes","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"preferredCommunication":{"name":"preferredCommunication","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"EMAIL"},"kind":"scalar"},"marketingConsent":{"name":"marketingConsent","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"marketingConsentAt":{"name":"marketingConsentAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"marketingConsentSource":{"name":"marketingConsentSource","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"marketingPolicyVersion":{"name":"marketingPolicyVersion","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"welcomeSentAt":{"name":"welcomeSentAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"status":{"name":"status","type":"ClientStatus","isList":false,"isOptional":false,"default":{"kind":"value","value":"ACTIVE"},"kind":"enum"},"anonymizedAt":{"name":"anonymizedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"appointments":{"name":"appointments","type":"Appointment","isList":true,"isOptional":false,"kind":"relation","backFk":"clientId","backRef":"id"},"consentEvents":{"name":"consentEvents","type":"ConsentEvent","isList":true,"isOptional":false,"kind":"relation","backFk":"clientId","backRef":"id"}},"uniques":[],"indexes":[["emailNormalized"],["phoneNormalized"],["status","createdAt"]]},"appointment":{"name":"Appointment","collection":"appointment","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"referenceCode":{"name":"referenceCode","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"clientId":{"name":"clientId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"client":{"name":"client","type":"Client","isList":false,"isOptional":false,"fk":"clientId","ref":"id","onDelete":"Restrict","kind":"relation"},"serviceId":{"name":"serviceId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"service":{"name":"service","type":"Service","isList":false,"isOptional":false,"fk":"serviceId","ref":"id","onDelete":"Restrict","kind":"relation"},"professionalId":{"name":"professionalId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"professional":{"name":"professional","type":"Professional","isList":false,"isOptional":false,"fk":"professionalId","ref":"id","onDelete":"Restrict","kind":"relation"},"assignedAnyProfessional":{"name":"assignedAnyProfessional","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"status":{"name":"status","type":"AppointmentStatus","isList":false,"isOptional":false,"default":{"kind":"value","value":"CONFIRMED"},"kind":"enum"},"attendanceConfirmedAt":{"name":"attendanceConfirmedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"dateStrMadrid":{"name":"dateStrMadrid","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"startTimeMadrid":{"name":"startTimeMadrid","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"endTimeMadrid":{"name":"endTimeMadrid","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"startAtUtc":{"name":"startAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"endAtUtc":{"name":"endAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"blockStartAtUtc":{"name":"blockStartAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"blockEndAtUtc":{"name":"blockEndAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"serviceNameSnapshot":{"name":"serviceNameSnapshot","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"durationMinSnapshot":{"name":"durationMinSnapshot","type":"Int","isList":false,"isOptional":false,"kind":"scalar"},"bufferBeforeSnapshot":{"name":"bufferBeforeSnapshot","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"bufferAfterSnapshot":{"name":"bufferAfterSnapshot","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"priceTypeSnapshot":{"name":"priceTypeSnapshot","type":"PriceType","isList":false,"isOptional":false,"kind":"enum"},"priceCentsSnapshot":{"name":"priceCentsSnapshot","type":"Int","isList":false,"isOptional":true,"kind":"scalar"},"currencySnapshot":{"name":"currencySnapshot","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"EUR"},"kind":"scalar"},"customerName":{"name":"customerName","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"customerEmail":{"name":"customerEmail","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"customerPhone":{"name":"customerPhone","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"customerNotes":{"name":"customerNotes","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"internalNotes":{"name":"internalNotes","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"manageTokenHash":{"name":"manageTokenHash","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"manageTokenExpiresAt":{"name":"manageTokenExpiresAt","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"manageTokenRevoked":{"name":"manageTokenRevoked","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"idempotencyKey":{"name":"idempotencyKey","type":"String","isList":false,"isOptional":true,"isUnique":true,"kind":"scalar"},"version":{"name":"version","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":1},"kind":"scalar"},"cancelledAt":{"name":"cancelledAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"cancellationReason":{"name":"cancellationReason","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"events":{"name":"events","type":"AppointmentEvent","isList":true,"isOptional":false,"kind":"relation","backFk":"appointmentId","backRef":"id"},"occupancy":{"name":"occupancy","type":"Occupancy","isList":false,"isOptional":true,"kind":"relation","backFk":"appointmentId","backRef":"id"},"resourceReservations":{"name":"resourceReservations","type":"ResourceReservation","isList":true,"isOptional":false,"kind":"relation","backFk":"appointmentId","backRef":"id"},"conflictAlerts":{"name":"conflictAlerts","type":"ScheduleConflictAlert","isList":true,"isOptional":false,"kind":"relation","backFk":"appointmentId","backRef":"id"}},"uniques":[["referenceCode"],["manageTokenHash"],["idempotencyKey"]],"indexes":[["professionalId","startAtUtc","endAtUtc"],["dateStrMadrid","status"],["clientId"]]},"appointmentEvent":{"name":"AppointmentEvent","collection":"appointmentEvent","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"appointmentId":{"name":"appointmentId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"appointment":{"name":"appointment","type":"Appointment","isList":false,"isOptional":false,"fk":"appointmentId","ref":"id","onDelete":"Cascade","kind":"relation"},"eventType":{"name":"eventType","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"fromStatus":{"name":"fromStatus","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"toStatus":{"name":"toStatus","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"actorType":{"name":"actorType","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"actorId":{"name":"actorId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"detailsJson":{"name":"detailsJson","type":"Json","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["appointmentId","createdAt"]]},"occupancy":{"name":"Occupancy","collection":"occupancy","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"professionalId":{"name":"professionalId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"professional":{"name":"professional","type":"Professional","isList":false,"isOptional":false,"fk":"professionalId","ref":"id","onDelete":"Cascade","kind":"relation"},"appointmentId":{"name":"appointmentId","type":"String","isList":false,"isOptional":true,"isUnique":true,"kind":"scalar"},"appointment":{"name":"appointment","type":"Appointment","isList":false,"isOptional":true,"fk":"appointmentId","ref":"id","onDelete":"Cascade","kind":"relation"},"reason":{"name":"reason","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"APPOINTMENT"},"kind":"scalar"},"startAtUtc":{"name":"startAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"endAtUtc":{"name":"endAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"expiresAtUtc":{"name":"expiresAtUtc","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"notes":{"name":"notes","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[["appointmentId"]],"indexes":[["professionalId","active","startAtUtc","endAtUtc"]]},"resourceReservation":{"name":"ResourceReservation","collection":"resourceReservation","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"resourceKey":{"name":"resourceKey","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"resourceName":{"name":"resourceName","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"appointmentId":{"name":"appointmentId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"appointment":{"name":"appointment","type":"Appointment","isList":false,"isOptional":true,"fk":"appointmentId","ref":"id","onDelete":"Cascade","kind":"relation"},"startAtUtc":{"name":"startAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"endAtUtc":{"name":"endAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["resourceKey","active","startAtUtc","endAtUtc"]]},"mediaAsset":{"name":"MediaAsset","collection":"mediaAsset","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"internalName":{"name":"internalName","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"src":{"name":"src","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"sourceType":{"name":"sourceType","type":"MediaSourceType","isList":false,"isOptional":false,"default":{"kind":"value","value":"EXTERNAL_URL"},"kind":"enum"},"mimeType":{"name":"mimeType","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"image/jpeg"},"kind":"scalar"},"width":{"name":"width","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":1200},"kind":"scalar"},"height":{"name":"height","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":1500},"kind":"scalar"},"sizeBytes":{"name":"sizeBytes","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"altText":{"name":"altText","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"caption":{"name":"caption","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"category":{"name":"category","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"general"},"kind":"scalar"},"focalPointX":{"name":"focalPointX","type":"Float","isList":false,"isOptional":false,"default":{"kind":"value","value":50},"kind":"scalar"},"focalPointY":{"name":"focalPointY","type":"Float","isList":false,"isOptional":false,"default":{"kind":"value","value":50},"kind":"scalar"},"sortOrder":{"name":"sortOrder","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"authorCredit":{"name":"authorCredit","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"licenseNote":{"name":"licenseNote","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"isProvisional":{"name":"isProvisional","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"publicVisible":{"name":"publicVisible","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"usages":{"name":"usages","type":"MediaUsage","isList":true,"isOptional":false,"kind":"relation","backFk":"mediaAssetId","backRef":"id"},"services":{"name":"services","type":"Service","isList":true,"isOptional":false,"kind":"relation","backFk":"imageAssetId","backRef":"id"},"professionals":{"name":"professionals","type":"Professional","isList":true,"isOptional":false,"kind":"relation","backFk":"photoAssetId","backRef":"id"}},"uniques":[],"indexes":[["category","publicVisible","sortOrder"]]},"mediaUsage":{"name":"MediaUsage","collection":"mediaUsage","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"mediaAssetId":{"name":"mediaAssetId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"mediaAsset":{"name":"mediaAsset","type":"MediaAsset","isList":false,"isOptional":false,"fk":"mediaAssetId","ref":"id","onDelete":"Restrict","kind":"relation"},"locationKey":{"name":"locationKey","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"locationName":{"name":"locationName","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[["mediaAssetId","locationKey"]],"indexes":[["locationKey"]]},"pageContent":{"name":"PageContent","collection":"pageContent","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"key":{"name":"key","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"title":{"name":"title","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"category":{"name":"category","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"PAGE"},"kind":"scalar"},"slug":{"name":"slug","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"draftData":{"name":"draftData","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"publishedData":{"name":"publishedData","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"hasUnpublished":{"name":"hasUnpublished","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"isPublished":{"name":"isPublished","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"version":{"name":"version","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":1},"kind":"scalar"},"seoTitle":{"name":"seoTitle","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"seoDescription":{"name":"seoDescription","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"updatedBy":{"name":"updatedBy","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"publishedAt":{"name":"publishedAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"revisions":{"name":"revisions","type":"ContentRevision","isList":true,"isOptional":false,"kind":"relation","backFk":"pageContentId","backRef":"id"}},"uniques":[["key"]],"indexes":[["category","isPublished"]]},"contentRevision":{"name":"ContentRevision","collection":"contentRevision","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"pageContentId":{"name":"pageContentId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"pageContent":{"name":"pageContent","type":"PageContent","isList":false,"isOptional":false,"fk":"pageContentId","ref":"id","onDelete":"Cascade","kind":"relation"},"version":{"name":"version","type":"Int","isList":false,"isOptional":false,"kind":"scalar"},"snapshotData":{"name":"snapshotData","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"changeNote":{"name":"changeNote","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdBy":{"name":"createdBy","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["pageContentId","version"]]},"subscriber":{"name":"Subscriber","collection":"subscriber","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"email":{"name":"email","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"emailNormalized":{"name":"emailNormalized","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"firstName":{"name":"firstName","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"tags":{"name":"tags","type":"String","isList":true,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"SubscriberStatus","isList":false,"isOptional":false,"default":{"kind":"value","value":"PENDING"},"kind":"enum"},"verifyTokenHash":{"name":"verifyTokenHash","type":"String","isList":false,"isOptional":true,"isUnique":true,"kind":"scalar"},"verifyTokenExpiresAt":{"name":"verifyTokenExpiresAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"unsubscribeTokenHash":{"name":"unsubscribeTokenHash","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"confirmedAt":{"name":"confirmedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"unsubscribedAt":{"name":"unsubscribedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"policyVersion":{"name":"policyVersion","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"v1.0"},"kind":"scalar"},"source":{"name":"source","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"newsletter_dialog"},"kind":"scalar"},"welcomeSentAt":{"name":"welcomeSentAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"consentEvents":{"name":"consentEvents","type":"ConsentEvent","isList":true,"isOptional":false,"kind":"relation","backFk":"subscriberId","backRef":"id"},"campaignRecipients":{"name":"campaignRecipients","type":"CampaignRecipient","isList":true,"isOptional":false,"kind":"relation","backFk":"subscriberId","backRef":"id"}},"uniques":[["emailNormalized"],["verifyTokenHash"],["unsubscribeTokenHash"]],"indexes":[["status","createdAt"]]},"consentEvent":{"name":"ConsentEvent","collection":"consentEvent","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"subscriberId":{"name":"subscriberId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"subscriber":{"name":"subscriber","type":"Subscriber","isList":false,"isOptional":true,"fk":"subscriberId","ref":"id","onDelete":"SetNull","kind":"relation"},"clientId":{"name":"clientId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"client":{"name":"client","type":"Client","isList":false,"isOptional":true,"fk":"clientId","ref":"id","onDelete":"SetNull","kind":"relation"},"email":{"name":"email","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"action":{"name":"action","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"channel":{"name":"channel","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"policyVersion":{"name":"policyVersion","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"consentText":{"name":"consentText","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["email","createdAt"]]},"suppression":{"name":"Suppression","collection":"suppression","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"emailNormalized":{"name":"emailNormalized","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"reason":{"name":"reason","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"sourceEventId":{"name":"sourceEventId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[["emailNormalized"]],"indexes":[]},"campaign":{"name":"Campaign","collection":"campaign","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"subject":{"name":"subject","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"preheader":{"name":"preheader","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"heading":{"name":"heading","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"bodyText":{"name":"bodyText","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"ctaLabel":{"name":"ctaLabel","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"ctaUrl":{"name":"ctaUrl","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"heroImageUrl":{"name":"heroImageUrl","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"segmentFilterJson":{"name":"segmentFilterJson","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"CampaignStatus","isList":false,"isOptional":false,"default":{"kind":"value","value":"DRAFT"},"kind":"enum"},"scheduledAtUtc":{"name":"scheduledAtUtc","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"sentAtUtc":{"name":"sentAtUtc","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"totalRecipients":{"name":"totalRecipients","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"acceptedCount":{"name":"acceptedCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"deliveredCount":{"name":"deliveredCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"bouncedCount":{"name":"bouncedCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"complainedCount":{"name":"complainedCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"unsubscribedCount":{"name":"unsubscribedCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"createdBy":{"name":"createdBy","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"},"recipients":{"name":"recipients","type":"CampaignRecipient","isList":true,"isOptional":false,"kind":"relation","backFk":"campaignId","backRef":"id"}},"uniques":[],"indexes":[["status","scheduledAtUtc"]]},"campaignRecipient":{"name":"CampaignRecipient","collection":"campaignRecipient","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"campaignId":{"name":"campaignId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"campaign":{"name":"campaign","type":"Campaign","isList":false,"isOptional":false,"fk":"campaignId","ref":"id","onDelete":"Cascade","kind":"relation"},"subscriberId":{"name":"subscriberId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"subscriber":{"name":"subscriber","type":"Subscriber","isList":false,"isOptional":false,"fk":"subscriberId","ref":"id","onDelete":"Cascade","kind":"relation"},"emailNormalized":{"name":"emailNormalized","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"PENDING"},"kind":"scalar"},"providerMessageId":{"name":"providerMessageId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"sentAt":{"name":"sentAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"deliveredAt":{"name":"deliveredAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"errorText":{"name":"errorText","type":"String","isList":false,"isOptional":true,"kind":"scalar"}},"uniques":[["campaignId","subscriberId"]],"indexes":[["campaignId","status"]]},"emailTemplate":{"name":"EmailTemplate","collection":"emailTemplate","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"key":{"name":"key","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"category":{"name":"category","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"TRANSACTIONAL"},"kind":"scalar"},"subject":{"name":"subject","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"preheader":{"name":"preheader","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"heading":{"name":"heading","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"bodyTemplate":{"name":"bodyTemplate","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"ctaLabel":{"name":"ctaLabel","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"footerNote":{"name":"footerNote","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[["key"]],"indexes":[]},"automationRule":{"name":"AutomationRule","collection":"automationRule","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"key":{"name":"key","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"triggerEvent":{"name":"triggerEvent","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"templateKey":{"name":"templateKey","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"offsetMinutes":{"name":"offsetMinutes","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"active":{"name":"active","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":true},"kind":"scalar"},"description":{"name":"description","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[["key"]],"indexes":[]},"outboxEvent":{"name":"OutboxEvent","collection":"outboxEvent","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"eventType":{"name":"eventType","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"AggregateId":{"name":"AggregateId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"payloadJson":{"name":"payloadJson","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"processedAt":{"name":"processedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["processedAt","createdAt"]]},"notificationJob":{"name":"NotificationJob","collection":"notificationJob","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"jobType":{"name":"jobType","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"dedupKey":{"name":"dedupKey","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"appointmentId":{"name":"appointmentId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"appointmentVer":{"name":"appointmentVer","type":"Int","isList":false,"isOptional":true,"kind":"scalar"},"payloadJson":{"name":"payloadJson","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"JobStatus","isList":false,"isOptional":false,"default":{"kind":"value","value":"PENDING"},"kind":"enum"},"scheduledAtUtc":{"name":"scheduledAtUtc","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"attempts":{"name":"attempts","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"maxAttempts":{"name":"maxAttempts","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":4},"kind":"scalar"},"nextAttemptUtc":{"name":"nextAttemptUtc","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"lockedUntilUtc":{"name":"lockedUntilUtc","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"lastError":{"name":"lastError","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"completedAtUtc":{"name":"completedAtUtc","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[["dedupKey"]],"indexes":[["status","scheduledAtUtc","nextAttemptUtc"],["appointmentId"]]},"emailDelivery":{"name":"EmailDelivery","collection":"emailDelivery","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"dedupKey":{"name":"dedupKey","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"category":{"name":"category","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"templateKey":{"name":"templateKey","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"toEmail":{"name":"toEmail","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"subject":{"name":"subject","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"htmlBody":{"name":"htmlBody","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"textBody":{"name":"textBody","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"QUEUED"},"kind":"scalar"},"providerName":{"name":"providerName","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"RESEND"},"kind":"scalar"},"providerMessageId":{"name":"providerMessageId","type":"String","isList":false,"isOptional":true,"isUnique":true,"kind":"scalar"},"appointmentId":{"name":"appointmentId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"campaignId":{"name":"campaignId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"errorMessage":{"name":"errorMessage","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"acceptedAt":{"name":"acceptedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"deliveredAt":{"name":"deliveredAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"bouncedAt":{"name":"bouncedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[["dedupKey"],["providerMessageId"]],"indexes":[["toEmail","createdAt"],["status","createdAt"]]},"importJob":{"name":"ImportJob","collection":"importJob","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"fileName":{"name":"fileName","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"mode":{"name":"mode","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"CREATE_ONLY"},"kind":"scalar"},"totalRows":{"name":"totalRows","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"createdCount":{"name":"createdCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"updatedCount":{"name":"updatedCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"skippedCount":{"name":"skippedCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"errorCount":{"name":"errorCount","type":"Int","isList":false,"isOptional":false,"default":{"kind":"value","value":0},"kind":"scalar"},"status":{"name":"status","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"COMPLETED"},"kind":"scalar"},"actorUserId":{"name":"actorUserId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"rowResults":{"name":"rowResults","type":"ImportRowResult","isList":true,"isOptional":false,"kind":"relation","backFk":"importJobId","backRef":"id"}},"uniques":[],"indexes":[]},"importRowResult":{"name":"ImportRowResult","collection":"importRowResult","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"importJobId":{"name":"importJobId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"importJob":{"name":"importJob","type":"ImportJob","isList":false,"isOptional":false,"fk":"importJobId","ref":"id","onDelete":"Cascade","kind":"relation"},"rowNumber":{"name":"rowNumber","type":"Int","isList":false,"isOptional":false,"kind":"scalar"},"action":{"name":"action","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"message":{"name":"message","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"email":{"name":"email","type":"String","isList":false,"isOptional":true,"kind":"scalar"}},"uniques":[],"indexes":[["importJobId","rowNumber"]]},"exportJob":{"name":"ExportJob","collection":"exportJob","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"scope":{"name":"scope","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"columnsJson":{"name":"columnsJson","type":"Json","isList":false,"isOptional":false,"kind":"scalar"},"rowCount":{"name":"rowCount","type":"Int","isList":false,"isOptional":false,"kind":"scalar"},"downloadToken":{"name":"downloadToken","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"expiresAtUtc":{"name":"expiresAtUtc","type":"DateTime","isList":false,"isOptional":false,"kind":"scalar"},"actorUserId":{"name":"actorUserId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[["downloadToken"]],"indexes":[]},"integrationConnection":{"name":"IntegrationConnection","collection":"integrationConnection","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"provider":{"name":"provider","type":"String","isList":false,"isOptional":false,"isUnique":true,"kind":"scalar"},"status":{"name":"status","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"DISCONNECTED"},"kind":"scalar"},"accountLabel":{"name":"accountLabel","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"externalLocationId":{"name":"externalLocationId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"externalLocationTitle":{"name":"externalLocationTitle","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"encryptedAccessToken":{"name":"encryptedAccessToken","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"encryptedRefreshToken":{"name":"encryptedRefreshToken","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"tokenExpiresAt":{"name":"tokenExpiresAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"lastSyncAt":{"name":"lastSyncAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"lastSyncStatus":{"name":"lastSyncStatus","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"lastError":{"name":"lastError","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"configJson":{"name":"configJson","type":"Json","isList":false,"isOptional":true,"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[["provider"]],"indexes":[]},"syncEvent":{"name":"SyncEvent","collection":"syncEvent","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"provider":{"name":"provider","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"summary":{"name":"summary","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"detailsJson":{"name":"detailsJson","type":"Json","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["provider","createdAt"]]},"scheduleConflictAlert":{"name":"ScheduleConflictAlert","collection":"scheduleConflictAlert","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"appointmentId":{"name":"appointmentId","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"appointment":{"name":"appointment","type":"Appointment","isList":false,"isOptional":false,"fk":"appointmentId","ref":"id","onDelete":"Cascade","kind":"relation"},"reason":{"name":"reason","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"source":{"name":"source","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"resolved":{"name":"resolved","type":"Boolean","isList":false,"isOptional":false,"default":{"kind":"value","value":false},"kind":"scalar"},"resolvedBy":{"name":"resolvedBy","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"resolvedAt":{"name":"resolvedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["resolved","createdAt"]]},"auditEvent":{"name":"AuditEvent","collection":"auditEvent","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"actorUserId":{"name":"actorUserId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"actorUser":{"name":"actorUser","type":"User","isList":false,"isOptional":true,"fk":"actorUserId","ref":"id","onDelete":"SetNull","kind":"relation"},"action":{"name":"action","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"entityType":{"name":"entityType","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"entityId":{"name":"entityId","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"summary":{"name":"summary","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"metadata":{"name":"metadata","type":"Json","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["entityType","createdAt"],["actorUserId","createdAt"]]},"contactMessage":{"name":"ContactMessage","collection":"contactMessage","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"name":{"name":"name","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"email":{"name":"email","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"phone":{"name":"phone","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"subject":{"name":"subject","type":"String","isList":false,"isOptional":true,"kind":"scalar"},"message":{"name":"message","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"status":{"name":"status","type":"String","isList":false,"isOptional":false,"default":{"kind":"value","value":"NEW"},"kind":"scalar"},"repliedAt":{"name":"repliedAt","type":"DateTime","isList":false,"isOptional":true,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"},"updatedAt":{"name":"updatedAt","type":"DateTime","isList":false,"isOptional":false,"updatedAt":true,"kind":"scalar"}},"uniques":[],"indexes":[["status","createdAt"]]},"rateLimitHit":{"name":"RateLimitHit","collection":"rateLimitHit","fields":{"id":{"name":"id","type":"String","isList":false,"isOptional":false,"isId":true,"default":{"kind":"cuid"},"kind":"scalar"},"key":{"name":"key","type":"String","isList":false,"isOptional":false,"kind":"scalar"},"createdAt":{"name":"createdAt","type":"DateTime","isList":false,"isOptional":false,"default":{"kind":"now"},"kind":"scalar"}},"uniques":[],"indexes":[["key","createdAt"]]}} as const;

export type ModelKey = "user" | "session" | "salonSettings" | "serviceCategory" | "service" | "professional" | "professionalService" | "workingSchedule" | "scheduleException" | "client" | "appointment" | "appointmentEvent" | "occupancy" | "resourceReservation" | "mediaAsset" | "mediaUsage" | "pageContent" | "contentRevision" | "subscriber" | "consentEvent" | "suppression" | "campaign" | "campaignRecipient" | "emailTemplate" | "automationRule" | "outboxEvent" | "notificationJob" | "emailDelivery" | "importJob" | "importRowResult" | "exportJob" | "integrationConnection" | "syncEvent" | "scheduleConflictAlert" | "auditEvent" | "contactMessage" | "rateLimitHit";
