export type DiceTypeId = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export interface DiceVisualLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface DiceTypeConfig {
  id: DiceTypeId;
  sides: number;
  solidName: string;
  teaser: string;
  outlinePoints: string;
  innerLines: DiceVisualLine[];
  labelY: number;
  /** Основной цвет кубика (hex), используется в WebGL и на всех страницах */
  color: string;
}

export const DEFAULT_DICE_TYPE: DiceTypeId = 'd6';

export const DICE_TYPES: readonly DiceTypeConfig[] = [
  {
    id: 'd4',
    sides: 4,
    solidName: 'Тетраэдр',
    teaser: '4 грани',
    outlinePoints: '50,10 86,82 14,82',
    innerLines: [
      { x1: 50, y1: 10, x2: 50, y2: 82 },
      { x1: 14, y1: 82, x2: 68, y2: 46 },
      { x1: 86, y1: 82, x2: 32, y2: 46 },
    ],
    labelY: 62,
    color: '#e05c8a',
  },
  {
    id: 'd6',
    sides: 6,
    solidName: 'Куб',
    teaser: '6 граней',
    outlinePoints: '50,12 84,31 84,69 50,88 16,69 16,31',
    innerLines: [
      { x1: 50, y1: 12, x2: 50, y2: 50 },
      { x1: 84, y1: 31, x2: 50, y2: 50 },
      { x1: 16, y1: 31, x2: 50, y2: 50 },
    ],
    labelY: 56,
    color: '#d94040',
  },
  {
    id: 'd8',
    sides: 8,
    solidName: 'Октаэдр',
    teaser: '8 граней',
    outlinePoints: '50,8 88,50 50,92 12,50',
    innerLines: [
      { x1: 50, y1: 8, x2: 50, y2: 92 },
      { x1: 12, y1: 50, x2: 88, y2: 50 },
    ],
    labelY: 58,
    color: '#2bbfb0',
  },
  {
    id: 'd10',
    sides: 10,
    solidName: 'Десятигранник',
    teaser: '10 граней',
    outlinePoints: '50,8 76,14 90,36 90,64 76,86 50,92 24,86 10,64 10,36 24,14',
    innerLines: [
      { x1: 50, y1: 8, x2: 50, y2: 92 },
      { x1: 24, y1: 14, x2: 76, y2: 86 },
      { x1: 76, y1: 14, x2: 24, y2: 86 },
    ],
    labelY: 58,
    color: '#e07a20',
  },
  {
    id: 'd12',
    sides: 12,
    solidName: 'Додекаэдр',
    teaser: '12 граней',
    outlinePoints: '50,6 72,10 88,24 94,50 88,76 72,90 50,94 28,90 12,76 6,50 12,24 28,10',
    innerLines: [
      { x1: 50, y1: 6, x2: 50, y2: 94 },
      { x1: 12, y1: 24, x2: 88, y2: 76 },
      { x1: 88, y1: 24, x2: 12, y2: 76 },
      { x1: 28, y1: 10, x2: 72, y2: 90 },
      { x1: 72, y1: 10, x2: 28, y2: 90 },
    ],
    labelY: 58,
    color: '#8855cc',
  },
  {
    id: 'd20',
    sides: 20,
    solidName: 'Икосаэдр',
    teaser: '20 граней',
    outlinePoints: '50,6 84,28 92,50 84,72 50,94 16,72 8,50 16,28',
    innerLines: [
      { x1: 50, y1: 6, x2: 50, y2: 94 },
      { x1: 16, y1: 28, x2: 84, y2: 72 },
      { x1: 84, y1: 28, x2: 16, y2: 72 },
      { x1: 8, y1: 50, x2: 92, y2: 50 },
    ],
    labelY: 58,
    color: '#6a7080',
  },
] as const;

const DICE_TYPE_MAP = new Map(DICE_TYPES.map((diceType) => [diceType.id, diceType]));

export function getDiceType(rawType: string | null | undefined): DiceTypeConfig {
  if (!rawType) {
    return DICE_TYPE_MAP.get(DEFAULT_DICE_TYPE)!;
  }

  return DICE_TYPE_MAP.get(rawType as DiceTypeId) ?? DICE_TYPE_MAP.get(DEFAULT_DICE_TYPE)!;
}

export function clampDiceCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(6, Math.max(1, Math.round(value)));
}
