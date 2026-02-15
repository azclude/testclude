import diagnosisJson from '../../data/diagnosis_v1.json';
import type { DiagnosisData } from './types';

export const diagnosisData: DiagnosisData = diagnosisJson as unknown as DiagnosisData;

export function getValueQuestions() {
  return diagnosisData.valueQuestions;
}

export function getRequirementQuestions() {
  return diagnosisData.requirementQuestions;
}

export function getBudgetQuestions() {
  return diagnosisData.budgetQuestions;
}

export function getLikertOptions() {
  return diagnosisData.likert.options;
}

export function getValueTypeById(id: string) {
  return diagnosisData.valueTypes.find(vt => vt.id === id);
}

export function getSizeTypeById(id: string) {
  return diagnosisData.sizeTypes.find(st => st.id === id);
}

export function getAlignmentQuestions(axisId: string): string[] {
  return diagnosisData.axisAlignmentQuestions[axisId] ?? [];
}

export function getCommonNextSteps(): string[] {
  return diagnosisData.commonNextSteps;
}

export function getDisclaimerText(): string[] {
  return diagnosisData.disclaimerText;
}

// Question help texts (why we ask this)
export const questionHelpTexts: Record<string, string> = {
  V01: '予算オーバーは家づくりの失敗原因No.1。あなたの予算感度を測ります。',
  V02: '借入額の基準が「借りられる」か「返せる」かで、家計の安全度が変わります。',
  V03: '理想と予算のバランスの取り方を見ています。',
  V04: 'オプション追加はコスト上振れの主因。どの程度許容できるかを確認します。',
  V05: '温熱環境へのこだわり度は、依頼先選びに直結します。',
  V06: '耐震は命に関わる性能。どこまで重視するかを確認します。',
  V07: '見えない部分への投資意欲が性能志向の強さを表します。',
  V08: '性能と他の要素（価格/デザイン）の優先度バランスを見ています。',
  V09: '世界観へのこだわりが強いほど、設計の自由度が重要になります。',
  V10: '素材へのこだわりは予算にも依頼先にも大きく影響します。',
  V11: '感性を大切にするかどうかで、家づくりのアプローチが変わります。',
  V12: 'デザインの優先度を確認し、他の軸とのバランスを見ます。',
  V13: '動線設計の優先度は、間取りの組み立て方に直結します。',
  V14: '収納の設計方針を確認。量より「使いやすさ」を重視するか？',
  V15: '日常の掃除負担を減らしたいか。間取りの回遊性にも影響します。',
  V16: '家事のしやすさと見た目/広さ、どちらを取るかの確認です。',
  V17: '将来の間取り変更を見越した設計をどの程度重視するかを見ます。',
  V18: '老後の暮らし方を今から考えておくかの確認です。',
  V19: '将来の売却/賃貸も視野に入れるかで、間取りの汎用性が変わります。',
  V20: '「今」と「将来」のどちらに最適化するかの確認です。',
  V21: '比較検討を自分でしたいか、プロに任せたいかで依頼先タイプが変わります。',
  V22: '打合せの回数と質にどれだけこだわるかを見ています。',
  V23: '選択肢の多さに対するストレス耐性を確認します。',
  V24: '見積の透明性への関心度を測ります。',
  V25: '契約・変更管理への意識が高いほど、体制の整った依頼先が向きます。',
  V26: '第三者チェックへの信頼度を確認します。',
};
