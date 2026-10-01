export type DaymarkData = {
  [year: string]: {
    [month: string]: {
      [dateKey: string]: boolean;
    };
  };
};

export type DayStatus = 'PAST' | 'TODAY' | 'FUTURE';

export type DayCell = {
  date: Date;
  dateKey: string;
  dayOfMonth: number;
  monthName: string;
  year: number;
  dayOfWeek: number; // 0 = Sun, 6 = Sat
  status: DayStatus;
  isInWindow: boolean;
  worked: boolean;
};

export type WeekColumn = {
  id: string;
  days: DayCell[];
};
