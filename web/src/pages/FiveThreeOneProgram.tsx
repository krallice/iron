
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { calculate531, FiveThreeOneInputs } from '@/services/workoutService';
import WorkoutDisplay from '@/components/WorkoutDisplay';
import { toast } from '@/components/ui/sonner';

const FiveThreeOneProgram = () => {
  const [inputs, setInputs] = useState<FiveThreeOneInputs>({
    squatMax: 225,
    benchMax: 185,
    deadliftMax: 275,
    pressMax: 115,
    trainingMax: 90,
    cycles: 2
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
  
  const handleCyclesChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, cycles: value[0] }));
  };
  
  const generateWorkout = () => {
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
    
    const program = calculate531(inputs);
    setWorkoutProgram(program);
    toast.success("5/3/1 program generated successfully!");
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
                <Label htmlFor="squatMax">Squat 1RM (lb)</Label>
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
                <Label htmlFor="benchMax">Bench Press 1RM (lb)</Label>
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
                <Label htmlFor="deadliftMax">Deadlift 1RM (lb)</Label>
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
                <Label htmlFor="pressMax">Overhead Press 1RM (lb)</Label>
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
              
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Number of Cycles: {inputs.cycles}</Label>
                </div>
                <Slider
                  value={[inputs.cycles]}
                  min={1}
                  max={4}
                  step={1}
                  onValueChange={handleCyclesChange}
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
