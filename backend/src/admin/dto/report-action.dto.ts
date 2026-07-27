import { IsIn } from 'class-validator';

export const REPORT_ACTIONS = ['WARN', 'SUSPEND', 'REMOVE', 'DISMISS'] as const;
export type ReportAction = (typeof REPORT_ACTIONS)[number];

export class ReportActionDto {
  @IsIn(REPORT_ACTIONS)
  action!: ReportAction;
}
