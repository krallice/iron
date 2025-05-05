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
  templates: string[];
  fslParams: {
    sets: number;
    reps: number;
  };
  maxType: string;
  headerText: string;
}

// Calculate HLM Program
export const calculateHLM = async (inputs: HlmInputs): Promise<string> => {
  const { hlmType, squatMax, primaryPressMax, secondaryPressMax, deadliftMax, mediumReduction, lightReduction } = inputs;
  
  try {
    if (hlmType === 'standard') {
      const response = await fetch('http://192.168.1.129:9000/api/v1/programs/hlm/standard', {
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
      const response = await fetch('http://192.168.1.129:9000/api/v1/programs/hlm/alternate', {
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
export const calculate531 = async (inputs: FiveThreeOneInputs): Promise<string> => {
  try {
    const response = await fetch('http://192.168.1.129:9000/api/v1/programs/wendler531', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        squat: inputs.squatMax,
        bench: inputs.benchMax,
        deadlift: inputs.deadliftMax,
        press: inputs.pressMax,
        max_type: 'onerm',
        tm_percentage: inputs.trainingMax,
        templates: inputs.templates,
        fsl_params: inputs.fslParams,
        header_text: inputs.headerText
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate 5/3/1 program');
    }

    const data = await response.json();
    
    // Format the program output
    let program = `Wendler 5/3/1: ${data.templates.join(', ') || 'default'}\n\n`;
    
    // Add accessory pairings
    program += "Accessory Pairings:\n";
    for (const [lift, accessory] of Object.entries(data.accessory_pairings)) {
      program += `  ${lift}: ${accessory}\n`;
    }
    program += "\n";

    // Add training maxes
    program += "Training Maxes:\n";
    for (const [lift, max] of Object.entries(data.training_maxes)) {
      program += `  ${lift.charAt(0).toUpperCase() + lift.slice(1)}: ${(max as number).toFixed(2)} kgs\n`;
    }
    program += "\n";
    
    // Add weekly program
    for (const week of data.program) {
      program += `${week.name}:\n`;
      
      for (const lift of week.lifts) {
        program += `  ${lift.name}:\n`;
        
        // Main sets
        for (const set of lift.sets) {
          program += `    Set ${set.set_number}: ${set.reps} reps @ ${(set.weight as number).toFixed(1)} kg (${set.percentage}%)\n`;
        }
        
        // FSL sets if present
        if (lift.fsl) {
          program += `    FSL: ${lift.fsl.sets} x ${lift.fsl.reps} @ ${(lift.fsl.weight as number).toFixed(1)} kg\n`;
        }
        
        // Widowmaker if present
        if (lift.widowmaker) {
          program += `    Widowmaker: 1×20 @ ${(lift.widowmaker.weight as number).toFixed(1)} kg\n`;
        }
        
        // Pyramid if present
        if (lift.pyramid) {
          program += `    Pyramid: ${lift.pyramid[0].reps} @ ${(lift.pyramid[0].weight as number).toFixed(1)} kg, ${lift.pyramid[1].reps} @ ${(lift.pyramid[1].weight as number).toFixed(1)} kg\n`;
        }
        
        program += "\n";
      }
    }
    
    return program;
  } catch (error) {
    console.error('Error generating 5/3/1 program:', error);
    throw error;
  }
};
