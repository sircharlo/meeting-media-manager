interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface Schedule {
  time: string;
  weekday: number;
}

interface CurrentSchedule {
  midweek: Schedule;
  weekend: Schedule;
}

interface ScheduleDetails {
  changeStamp: null | string;
  current: CurrentSchedule;
  futureDate: null | string;
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

export interface GeoRecord {
  geoId: string;
  isPrimary: boolean;
  location: GeoLocation;
  properties: Properties;
  type: string;
}

export interface CongregationLanguage {
  isSignLanguage: boolean;
  languageCode: string;
  languageName: string;
  scriptDirection: 'ltr' | 'rtl'; // Left-to-right or right-to-left script
  writtenLanguageCode: string[];
}
