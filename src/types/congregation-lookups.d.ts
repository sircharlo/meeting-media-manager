export interface CongregationLanguage {
  isSignLanguage: boolean;
  languageCode: string;
  languageName: string;
  scriptDirection: 'ltr' | 'rtl'; // Left-to-right or right-to-left script
  writtenLanguageCode: string[];
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
  languageCode: string;
  memorialAddress: string;
  memorialTime: string;
  orgGuid: string;
  orgName: string;
  orgTransliteratedName: string;
  orgType: string;
  phones: PhoneDetails[];
  relatedLanguageCodes: string[];
  schedule: ScheduleDetails;
  transliteratedAddress: string;
}

interface Schedule {
  time: string;
  weekday: number;
}

interface ScheduleDetails {
  changeStamp: null | string;
  current: CurrentSchedule;
  futureDate: null | string;
}
