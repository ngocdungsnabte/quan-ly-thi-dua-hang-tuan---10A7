export type ActionType = 'plus' | 'minus';

export interface Student {
  id: number;
  name: string;
  group: number;
}

export interface Criteria {
  id: string;
  name: string;
  score: number;
}

export interface Log {
  id: string;
  studentId: number;
  studentName: string;
  group: number;
  criteria: string;
  unitScore: number;
  count: number;
  score: number;
  type: ActionType;
  week: number;
  time: string;
  date: string;
}

export interface ClassInfo {
  size: number;
  absent: number;
  startDate: string;
  endDate: string;
}
