import type { InspectionStatus, ItemResult } from './data/types';

export const colors = {
  primary: '#1F3A5F',
  primaryText: '#FFFFFF',
  accent: '#F2A900',
  background: '#F2F4F7',
  card: '#FFFFFF',
  text: '#1B1F24',
  muted: '#5F6B7A',
  border: '#D5DAE1',
  pass: '#1E8E3E',
  fail: '#C62828',
  na: '#6B7280',
  warnBg: '#FFF4E5',
  warnText: '#8A4B00',
};

export const resultColors: Record<ItemResult, string> = {
  pass: colors.pass,
  fail: colors.fail,
  na: colors.na,
};

export const statusLabels: Record<InspectionStatus, string> = {
  draft: 'In progress',
  released: 'Released to pour',
  rejected: 'Rejected',
};

export const statusColors: Record<InspectionStatus, string> = {
  draft: colors.accent,
  released: colors.pass,
  rejected: colors.fail,
};
