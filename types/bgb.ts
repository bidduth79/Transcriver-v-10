export type BgbRemarkType = 'Positive' | 'Negative' | 'Neutral';

export interface BgbAnalysisResult {
  remark: BgbRemarkType;
  details: string;
}
