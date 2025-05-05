// Mock workout calculation service
// This would typically make API calls to a Python backend

export type Program = 'hlm' | '531';
export type HlmType = 'standard' | 'alternate';

export interface HlmInputs {
  // Common inputs
  squatMax: number;
  primaryPressMax: number;
  secondaryPressMax: number;
  deadliftMax: number;
  hlmType: HlmType;
  mediumReduction: number;
  lightReduction: number;
  
  // Alternate pressing specific inputs
  heavySquatName?: string;
  primaryPressName?: string;
  secondaryPressName?: string;
  heavyPullName?: string;
  mediumPullName?: string;
  lightPullName?: string;
  headerText?: string;
}

export interface FiveThreeOneInputs {
  squatMax: number;
  benchMax: number;
  deadliftMax: number;
  pressMax: number;
  trainingMax: number; // percentage of 1RM
  cycles: number;
}

// Calculate HLM Program
export const calculateHLM = async (inputs: HlmInputs): Promise<string> => {
  const { hlmType, squatMax, primaryPressMax, secondaryPressMax, deadliftMax, mediumReduction, lightReduction } = inputs;
  
  try {
    if (hlmType === 'standard') {
      const response = await fetch('http://localhost:9000/hlm/standard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          squat: squatMax,
          pull: deadliftMax,
          press: primaryPressMax,
          medium_reduction: mediumReduction,
          light_reduction: lightReduction
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate standard HLM program');
      }

      const data = await response.json();
      return formatHLMResponse(data, inputs);
    } else {
      const response = await fetch('http://localhost:9000/hlm/alternate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heavy_squat_name: inputs.heavySquatName || "Squat",
          squat: squatMax,
          primary_press: primaryPressMax,
          primary_press_name: inputs.primaryPressName || "OHP",
          secondary_press: secondaryPressMax,
          secondary_press_name: inputs.secondaryPressName || "Bench Press",
          pull: deadliftMax,
          heavy_pull_name: inputs.heavyPullName || "Deadlift",
          medium_pull_name: inputs.mediumPullName,
          light_pull_name: inputs.lightPullName,
          medium_reduction: mediumReduction,
          light_reduction: lightReduction,
          header_text: inputs.headerText
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate alternate HLM program');
      }

      const data = await response.json();
      return formatHLMResponse(data, inputs);
    }
  } catch (error) {
    console.error('Error generating HLM program:', error);
    throw error;
  }
};

const formatHLMResponse = (data: any, inputs: HlmInputs): string => {
  let program = `HLM: ${data.template_name}\n\n`;
  
  // Add weights section
  program += "Weights:\n";
  if (data.exercise_names) {
    // Alternate pressing format
    program += `  ${data.exercise_names.heavy_squat} (5s) - ${data.weights.heavy_squat} kg\n`;
    program += `  ${data.exercise_names.primary_press} (5s) - ${data.weights.primary_press} kg\n`;
    if (data.weights.secondary_press) {
      program += `  ${data.exercise_names.secondary_press} (5s) - ${data.weights.secondary_press} kg\n`;
    }
    program += `  ${data.exercise_names.heavy_pull} (5s) - ${data.weights.heavy_pull} kg\n`;
  } else {
    // Standard format
    program += `  Squat (5s) - ${data.weights.squat} kg\n`;
    program += `  Press (5s) - ${data.weights.press} kg\n`;
    program += `  Deadlift (5s) - ${data.weights.pull} kg\n`;
  }
  program += "\n";

  // Add reductions section
  program += "Reductions:\n";
  program += `  Medium Reduction - ${(data.reductions.medium * 100).toFixed(1)}%\n`;
  program += `  Light Reduction - ${(data.reductions.light * 100).toFixed(1)}%\n`;
  program += "\n";

  // Add accessories if header_text exists
  if (data.header_text) {
    program += "Accessories:\n";
    program += data.header_text.split('\n').map(line => `  ${line}`).join('\n');
    program += "\n\n";
  }
  
  // Add schedule
  for (const [day, exercises] of Object.entries(data.schedule)) {
    program += `${day}:\n`;
    for (const exercise of exercises as string[]) {
      program += `  ${exercise}\n`;
    }
    program += "\n";
  }
  
  return program;
};

// Calculate 5/3/1 Program
export const calculate531 = (inputs: FiveThreeOneInputs): string => {
  const { squatMax, benchMax, deadliftMax, pressMax, trainingMax, cycles } = inputs;
  
  // Calculate training maxes
  const squatTM = Math.round(squatMax * (trainingMax / 100));
  const benchTM = Math.round(benchMax * (trainingMax / 100));
  const deadliftTM = Math.round(deadliftMax * (trainingMax / 100));
  const pressTM = Math.round(pressMax * (trainingMax / 100));
  
  let program = `JIM WENDLER'S 5/3/1 PROGRAM\n`;
  program += `Based on: Squat ${squatMax}lb (TM: ${squatTM}lb), Bench ${benchMax}lb (TM: ${benchTM}lb), Deadlift ${deadliftMax}lb (TM: ${deadliftTM}lb), Press ${pressMax}lb (TM: ${pressTM}lb)\n\n`;
  
  for (let cycle = 1; cycle <= cycles; cycle++) {
    program += `CYCLE ${cycle}\n\n`;
    
    // Week 1: 3×5 (65%, 75%, 85%)
    program += `WEEK 1 (5 REPS)\n`;
    
    program += `DAY 1 - SQUAT\n`;
    program += `Squat: 5× @ ${Math.round(squatTM * 0.65)}lb, 5× @ ${Math.round(squatTM * 0.75)}lb, 5+ @ ${Math.round(squatTM * 0.85)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(squatTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 2 - BENCH\n`;
    program += `Bench: 5× @ ${Math.round(benchTM * 0.65)}lb, 5× @ ${Math.round(benchTM * 0.75)}lb, 5+ @ ${Math.round(benchTM * 0.85)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(benchTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 3 - DEADLIFT\n`;
    program += `Deadlift: 5× @ ${Math.round(deadliftTM * 0.65)}lb, 5× @ ${Math.round(deadliftTM * 0.75)}lb, 5+ @ ${Math.round(deadliftTM * 0.85)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(deadliftTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 4 - PRESS\n`;
    program += `Press: 5× @ ${Math.round(pressTM * 0.65)}lb, 5× @ ${Math.round(pressTM * 0.75)}lb, 5+ @ ${Math.round(pressTM * 0.85)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(pressTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    // Week 2: 3×3 (70%, 80%, 90%)
    program += `WEEK 2 (3 REPS)\n`;
    
    program += `DAY 1 - SQUAT\n`;
    program += `Squat: 3× @ ${Math.round(squatTM * 0.70)}lb, 3× @ ${Math.round(squatTM * 0.80)}lb, 3+ @ ${Math.round(squatTM * 0.90)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(squatTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 2 - BENCH\n`;
    program += `Bench: 3× @ ${Math.round(benchTM * 0.70)}lb, 3× @ ${Math.round(benchTM * 0.80)}lb, 3+ @ ${Math.round(benchTM * 0.90)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(benchTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 3 - DEADLIFT\n`;
    program += `Deadlift: 3× @ ${Math.round(deadliftTM * 0.70)}lb, 3× @ ${Math.round(deadliftTM * 0.80)}lb, 3+ @ ${Math.round(deadliftTM * 0.90)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(deadliftTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 4 - PRESS\n`;
    program += `Press: 3× @ ${Math.round(pressTM * 0.70)}lb, 3× @ ${Math.round(pressTM * 0.80)}lb, 3+ @ ${Math.round(pressTM * 0.90)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(pressTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    // Week 3: 5/3/1 (75%, 85%, 95%)
    program += `WEEK 3 (5/3/1)\n`;
    
    program += `DAY 1 - SQUAT\n`;
    program += `Squat: 5× @ ${Math.round(squatTM * 0.75)}lb, 3× @ ${Math.round(squatTM * 0.85)}lb, 1+ @ ${Math.round(squatTM * 0.95)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(squatTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 2 - BENCH\n`;
    program += `Bench: 5× @ ${Math.round(benchTM * 0.75)}lb, 3× @ ${Math.round(benchTM * 0.85)}lb, 1+ @ ${Math.round(benchTM * 0.95)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(benchTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 3 - DEADLIFT\n`;
    program += `Deadlift: 5× @ ${Math.round(deadliftTM * 0.75)}lb, 3× @ ${Math.round(deadliftTM * 0.85)}lb, 1+ @ ${Math.round(deadliftTM * 0.95)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(deadliftTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 4 - PRESS\n`;
    program += `Press: 5× @ ${Math.round(pressTM * 0.75)}lb, 3× @ ${Math.round(pressTM * 0.85)}lb, 1+ @ ${Math.round(pressTM * 0.95)}lb\n`;
    program += `Assistance: 5×10 @ ${Math.round(pressTM * 0.5)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    // Week 4: Deload (40%, 50%, 60%)
    program += `WEEK 4 (DELOAD)\n`;
    
    program += `DAY 1 - SQUAT\n`;
    program += `Squat: 5× @ ${Math.round(squatTM * 0.40)}lb, 5× @ ${Math.round(squatTM * 0.50)}lb, 5× @ ${Math.round(squatTM * 0.60)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 2 - BENCH\n`;
    program += `Bench: 5× @ ${Math.round(benchTM * 0.40)}lb, 5× @ ${Math.round(benchTM * 0.50)}lb, 5× @ ${Math.round(benchTM * 0.60)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 3 - DEADLIFT\n`;
    program += `Deadlift: 5× @ ${Math.round(deadliftTM * 0.40)}lb, 5× @ ${Math.round(deadliftTM * 0.50)}lb, 5× @ ${Math.round(deadliftTM * 0.60)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
    
    program += `DAY 4 - PRESS\n`;
    program += `Press: 5× @ ${Math.round(pressTM * 0.40)}lb, 5× @ ${Math.round(pressTM * 0.50)}lb, 5× @ ${Math.round(pressTM * 0.60)}lb\n`;
    program += `Accessories: 50-100 reps each of Push, Pull, Single Leg/Core\n\n`;
  }
  
  return program;
};
