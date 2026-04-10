// Shared types for the frontend

export interface User {
  id: number;
  email: string;
  full_name: string;
  picture_url: string;
}

export interface Attachment {
  filename: string;
  mime_type: string;
  size: number;
  attachment_id: string;
}

export interface Mail {
  id: string;
  thread_id: string;
  subject: string;
  from: string;
  to: string;
  cc: string;
  date: string;
  snippet: string;
  preview: string;
  body_html: string;
  body_text: string;
  is_unread: boolean;
  is_starred: boolean;
  label_ids: string[];
  has_attachments: boolean;
  attachments: Attachment[];
  provider: string;
}

export interface MailListResponse {
  messages: Mail[];
  next_page_token: string | null;
  result_size_estimate: number;
}
