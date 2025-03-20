import type { JwLangCode } from './jw/lang';

export interface CongregationLanguage {
  isSignLanguage: boolean;
  languageCode: JwLangCode;
  languageName: string;
  scriptDirection: 'ltr' | 'rtl'; // Left-to-right or right-to-left script
  writtenLanguageCode: JwLangCode[];
}

export interface GeoRecord {
  geoId: string;
  isPrimary: boolean;
  location: GeoLocation;
  properties: Properties;
  type: string;
}

interface CurrentSchedule {
  midweek: Schedule;
  weekend: Schedule;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
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
  time: `${number}:${number}`;
  weekday: number;
}

interface ScheduleDetails {
  changeStamp: null | string;
  current: CurrentSchedule;
  futureDate: null | string;
}
