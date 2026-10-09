export interface MeetingChecklistCategory {
  enabled: boolean;
  id: string;
  isDefault: boolean;
  label?: string;
}

export interface MeetingChecklistItem {
  categoryId: string;
  enabled: boolean;
  id: string;
  isDefault: boolean;
  label?: string;
}
