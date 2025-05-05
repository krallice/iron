import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { calculate531, FiveThreeOneInputs } from '@/services/workoutService';
import WorkoutDisplay from '@/components/WorkoutDisplay';
import { toast } from '@/components/ui/sonner';

const FiveThreeOneProgram = () => {
  const [inputs, setInputs] = useState<FiveThreeOneInputs>({
    squatMax: 120,
    benchMax: 100,
    deadliftMax: 180,
    pressMax: 60,
    trainingMax: 90,
    templates: [],
    fslParams: { sets: 5, reps: 5 },
    maxType: 'training_max',
    headerText: ''
  });
  
  const [workoutProgram, setWorkoutProgram] = useState<string | null>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setInputs(prev => ({ ...prev, [name]: numValue }));
    }
  };
  
  const handleTrainingMaxChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, trainingMax: value[0] }));
  };
  
  const handleTemplateChange = (template: string, checked: boolean) => {
    setInputs(prev => ({
      ...prev,
      templates: checked ? [template] : []
    }));
  };

  const handleFSLParamsChange = (param: 'sets' | 'reps', value: number) => {
    setInputs(prev => ({
      ...prev,
      fslParams: { ...prev.fslParams, [param]: value }
    }));
  };
  
  const generateWorkout = async () => {
    // Form validation
    if (
      inputs.squatMax <= 0 || 
      inputs.benchMax <= 0 || 
      inputs.deadliftMax <= 0 || 
      inputs.pressMax <= 0
    ) {
      toast.error("Please enter valid values for all lifts");
      return;
    }

    // Validate FSL params if FSL template is selected
    if (inputs.templates.includes('fsl')) {
      const { sets, reps } = inputs.fslParams;
      if (sets < 3 || sets > 8 || reps < 3 || reps > 5) {
        toast.error("FSL sets must be 3-8 and reps must be 3-5");
        return;
      }
    }
    
    try {
      const program = await calculate531(inputs);
      setWorkoutProgram(program);
      toast.success("5/3/1 program generated successfully!");
    } catch (error) {
      toast.error("Failed to generate program");
      console.error(error);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Jim Wendler's 5/3/1 Program</h1>
          <p className="text-muted-foreground mt-2">
            Calculate your 5/3/1 cycles based on your one-rep maxes and training max percentage.
          </p>
        </div>
        
        <Card className="mb-8 border-border/50">
          <CardHeader>
            <CardTitle>Enter Your Maxes</CardTitle>
            <CardDescription>
              Input your one-rep maximums for the main lifts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="squatMax">Squat 1RM (kg)</Label>
                <Input
                  id="squatMax"
                  name="squatMax"
                  type="number"
                  value={inputs.squatMax}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="benchMax">Bench Press 1RM (kg)</Label>
                <Input
                  id="benchMax"
                  name="benchMax"
                  type="number"
                  value={inputs.benchMax}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadliftMax">Deadlift 1RM (kg)</Label>
                <Input
                  id="deadliftMax"
                  name="deadliftMax"
                  type="number"
                  value={inputs.deadliftMax}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pressMax">Overhead Press 1RM (kg)</Label>
                <Input
                  id="pressMax"
                  name="pressMax"
                  type="number"
                  value={inputs.pressMax}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Training Max: {inputs.trainingMax}%</Label>
                </div>
                <Slider
                  value={[inputs.trainingMax]}
                  min={80}
                  max={100}
                  step={5}
                  onValueChange={handleTrainingMaxChange}
                />
              </div>
              
              <div className="space-y-4">
                <Label>Templates</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="template-fsl"
                      checked={inputs.templates.includes('fsl')}
                      onCheckedChange={(checked) => handleTemplateChange('fsl', checked as boolean)}
                    />
                    <Label htmlFor="template-fsl">First Set Last (FSL)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="template-widowmaker"
                      checked={inputs.templates.includes('widowmaker')}
                      onCheckedChange={(checked) => handleTemplateChange('widowmaker', checked as boolean)}
                    />
                    <Label htmlFor="template-widowmaker">Widowmaker</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="template-pyramid"
                      checked={inputs.templates.includes('pyramid')}
                      onCheckedChange={(checked) => handleTemplateChange('pyramid', checked as boolean)}
                    />
                    <Label htmlFor="template-pyramid">Pyramid</Label>
                  </div>
                </div>
              </div>

              {inputs.templates.includes('fsl') && (
                <div className="space-y-4">
                  <Label>FSL Parameters</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sets (3-8)</Label>
                      <Input
                        type="number"
                        min={3}
                        max={8}
                        value={inputs.fslParams.sets}
                        onChange={(e) => handleFSLParamsChange('sets', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reps (3-5)</Label>
                      <Input
                        type="number"
                        min={3}
                        max={5}
                        value={inputs.fslParams.reps}
                        onChange={(e) => handleFSLParamsChange('reps', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="headerText">Additional Notes</Label>
                <Input
                  id="headerText"
                  name="headerText"
                  value={inputs.headerText}
                  onChange={(e) => setInputs(prev => ({ ...prev, headerText: e.target.value }))}
                  placeholder="Enter any additional notes or instructions"
                />
              </div>
              
              <Button onClick={generateWorkout} className="w-full">
                Generate 5/3/1 Program
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {workoutProgram && <WorkoutDisplay workoutProgram={workoutProgram} />}
      </div>
    </Layout>
  );
};

export default FiveThreeOneProgram;
