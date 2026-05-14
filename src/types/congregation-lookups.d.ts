import type { JwLangCode } from './jw/lang';

export interface CongRecord {
  $type?: string;
  assemblies: unknown[];
  congregationGroupMeetings: unknown[];
  congregationMeetings: CongregationMeeting[];
  conventions: unknown[];
  distanceFromRequestLocationInMeters?: number;
  id: string;
  latitude: number;
  longitude: number;
  memorials: unknown[];
}

export interface CongregationLanguage {
  isSignLanguage: boolean;
  languageCode: JwLangCode;
  languageName: string;
  scriptDirection: 'ltr' | 'rtl'; // Left-to-right or right-to-left script
  writtenLanguageCode: JwLangCode[];
}

export interface CongregationMeeting {
  $type?: string;
  address: string;
  groupMeetings: unknown[];
  id: string;
  isPrivateHome: boolean;
  languageGuid: string;
  midweekMeetingDay: number;
  midweekMeetingTime: `${number}:${number}:${number}`;
  name: string;
  phoneNumber: string;
  weekendMeetingDay: number;
  weekendMeetingTime: `${number}:${number}:${number}`;
}

export interface CongregationSearchResult {
  congregationGuid: string;
  formattedName: string;
  name: string;
}

export interface MeetingLanguage {
  $type?: string;
  code: JwLangCode;
  languageGuid: string;
  name: string;
}

export interface MeetingSearchResponse {
  $type?: string;
  hasResultsOutsideViewport: boolean;
  items: CongRecord[];
}

export interface NormalizedSchedule {
  current: null | {
    mwDay: `${number}`;
    mwStartTime: `${number}:${number}`;
    weDay: `${number}`;
    weStartTime: `${number}:${number}`;
  };
  future: null | {
    date: `${number}/${number}/${number}`;
    mwDay: `${number}`;
    mwStartTime: `${number}:${number}`;
    weDay: `${number}`;
    weStartTime: `${number}:${number}`;
  };
}

interface DaySchedule {
  time: `${number}:${number}`;
  weekday: number;
}

interface PhoneDetails {
  ext: string;
  phone: string;
}

interface Properties {
  address: string;
  isPrivateMtgPlace: boolean;
  languageCode: JwLangCode;
  memorialAddress: string;
  memorialTime: `${number}:${number}`;
  orgGuid: string;
  orgName: string;
  orgTransliteratedName: string;
  orgType: 'CONG' | 'GROUP';
  phones: PhoneDetails[];
  relatedLanguageCodes: JwLangCode[];
  schedule: ScheduleDetails;
  transliteratedAddress: string;
}

interface Schedule {
  midweek: DaySchedule;
  weekend: DaySchedule;
}

interface ScheduleDetails {
  changeStamp: null | string;
  current: null | Schedule;
  future: null | Schedule;
  futureDate: null | string;
}
