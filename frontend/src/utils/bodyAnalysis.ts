export interface BodyMetrics {
  gender: 'male' | 'female';
  weight: number; // kg
  height: number; // cm
  biceps?: number; // cm
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
}

export interface BodyAnalysisResult {
  bmi: number;
  bmiCategory: string;
  bmiColor: string;
  idealWeightKg: number;
  waistToHipRatio?: number;
  whrCategory?: string;
  waistToHeightRatio?: number;
  chestToWaistRatio?: number;
  vTaperCategory?: string;
  somatotype: string;
  somatotypeDescription: string;
  strengths: string[];
  focusAreas: string[];
  recommendation: string;
}

export const analyzeBody = (metrics: BodyMetrics): BodyAnalysisResult => {
  const { gender, weight, height, biceps, chest, waist, hips } = metrics;

  // 1. BMI calculation
  const heightM = height > 0 ? height / 100 : 1.78;
  const bmi = weight > 0 && heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 22.0;

  let bmiCategory = 'Нормальный вес';
  let bmiColor = 'text-green-400 bg-green-500/10 border-green-500/30';

  if (bmi < 18.5) {
    bmiCategory = 'Дефицит массы';
    bmiColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  } else if (bmi >= 25 && bmi < 29.9) {
    bmiCategory = 'Избыточный вес / Плотная мускулатура';
    bmiColor = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  } else if (bmi >= 30) {
    bmiCategory = 'Высокая масса тела';
    bmiColor = 'text-orange-400 bg-orange-500/10 border-orange-500/30';
  }

  // 2. Ideal weight (Devine formula)
  const baseIdeal = gender === 'male' ? 50 + 0.9 * (height - 152) : 45.5 + 0.9 * (height - 152);
  const idealWeightKg = Math.round(baseIdeal > 40 ? baseIdeal : 65);

  // 3. Waist-to-Hip Ratio (WHR)
  let waistToHipRatio: number | undefined;
  let whrCategory: string | undefined;

  if (waist && hips && waist > 0 && hips > 0) {
    waistToHipRatio = parseFloat((waist / hips).toFixed(2));
    if (gender === 'male') {
      if (waistToHipRatio < 0.85) whrCategory = 'Отличная форма (минимальный абдоминальный жир)';
      else if (waistToHipRatio <= 0.90) whrCategory = 'Атлетичная норма';
      else whrCategory = 'Склонность к накоплению жира на животе';
    } else {
      if (waistToHipRatio < 0.75) whrCategory = 'Классические «песочные часы»';
      else if (waistToHipRatio <= 0.85) whrCategory = 'Гармоничные пропорции';
      else whrCategory = 'Прямой тип фигуры';
    }
  }

  // 4. Waist-to-Height Ratio (WHtR)
  let waistToHeightRatio: number | undefined;
  if (waist && height && height > 0) {
    waistToHeightRatio = parseFloat((waist / height).toFixed(2));
  }

  // 5. Chest-to-Waist Ratio (V-Taper Index)
  let chestToWaistRatio: number | undefined;
  let vTaperCategory: string | undefined;

  if (chest && waist && waist > 0) {
    chestToWaistRatio = parseFloat((chest / waist).toFixed(2));
    if (chestToWaistRatio >= 1.33) {
      vTaperCategory = 'Выраженный V-образный атлетический силуэт (Золотое сечение)';
    } else if (chestToWaistRatio >= 1.20) {
      vTaperCategory = 'Спортивное атлетичное телосложение';
    } else {
      vTaperCategory = 'Прямой силуэт — потенциал для расширения плеч и спины';
    }
  }

  // 6. Somatotype estimation
  let somatotype = 'Мезоморф (Атлетический)';
  let somatotypeDescription =
    'Хорошо развитая костная структура и мышечный каркас. Отличный потенциал для силового тренинга и гипертрофии.';

  if (bmi < 21 && (!wristOrWaistSlim(waist, height))) {
    somatotype = 'Эктоморф (Стройный / Высокий метаболизм)';
    somatotypeDescription =
      'Низкий процент подкожного жира, быстрый метаболизм. Требуется акцент на базовые тяжёлые движения и профицит калорий.';
  } else if (bmi >= 26 || (waist && waist > 88 && gender === 'male')) {
    somatotype = 'Эндоморф (Мощный / Силовой)';
    somatotypeDescription =
      'Широкая плотная структура, высокая природная сила. Быстрый набор массы, требуется контроль плотности тренировок.';
  }

  // 7. Strengths and Focus areas
  const strengths: string[] = [];
  const focusAreas: string[] = [];

  if (chestToWaistRatio && chestToWaistRatio >= 1.25) {
    strengths.push('Отличная пропорция грудной клетки к талии (V-образный силуэт)');
  } else {
    focusAreas.push('Расширение широчайших мышц спины и плеч для V-силуэта');
  }

  if (biceps && biceps >= 38) {
    strengths.push(`Сильные развитые руки (бицепс ${biceps} см)`);
  } else if (biceps && biceps < 34) {
    focusAreas.push('Дополнительная проработка двуглавой и трёхглавой мышц плеча');
  }

  if (waistToHeightRatio && waistToHeightRatio <= 0.50) {
    strengths.push('Узкая талия и минимальный висцеральный жир');
  } else if (waistToHeightRatio && waistToHeightRatio > 0.53) {
    focusAreas.push('Снижение жировой прослойки в области живота и укрепление кора');
  }

  if (hips && hips >= 100 && gender === 'male') {
    strengths.push('Мощный фундамент ног и ягодичных мышц');
  } else {
    focusAreas.push('Наращивание силы квадрицепсов и бицепсов бедра');
  }

  // Final Training Recommendation
  let recommendation =
    'Сбалансированная силовая программа с упором на базовые многосуставные упражнения (жим, присед, тяга) для гармоничного роста.';
  if (focusAreas.includes('Расширение широчайших мышц спины и плеч для V-силуэта')) {
    recommendation =
      'Рекомендуется акцент на подтягивания широким хватом, жимы гантелей сидя и махи в стороны для визуального расширения торса.';
  } else if (focusAreas.includes('Снижение жировой прослойки в области живота и укрепление кора')) {
    recommendation =
      'Рекомендуется высокая плотность подходов (отдых 60–75 сек) и суперсеты для максимального термогенного эффекта.';
  }

  return {
    bmi,
    bmiCategory,
    bmiColor,
    idealWeightKg,
    waistToHipRatio,
    whrCategory,
    waistToHeightRatio,
    chestToWaistRatio,
    vTaperCategory,
    somatotype,
    somatotypeDescription,
    strengths,
    focusAreas,
    recommendation,
  };
};

function wristOrWaistSlim(waist: number | undefined, height: number): boolean {
  if (!waist) return true;
  return waist / height < 0.45;
}
