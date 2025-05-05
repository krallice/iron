import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { calculateHLM, HlmInputs, HlmType } from '@/services/workoutService';
import WorkoutDisplay from '@/components/WorkoutDisplay';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

const HLMProgram = () => {
  const [inputs, setInputs] = useState<HlmInputs>({
    squatMax: 120,
    primaryPressMax: 60,
    secondaryPressMax: 40,
    deadliftMax: 160,
    hlmType: 'alternate',
    heavySquatName: "Squat",
    primaryPressName: "OHP",
    secondaryPressName: "Weighted Dips",
    heavyPullName: "Deadlift",
    headerText: "",
    mediumReduction: 0.10,
    lightReduction: 0.20
  });
  
  const [workoutProgram, setWorkoutProgram] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setInputs(prev => ({ ...prev, [name]: numValue }));
    } else {
      setInputs(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleWeeksChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, weeks: value[0] }));
  };

  const handleHlmTypeChange = (value: HlmType) => {
    setInputs(prev => ({ ...prev, hlmType: value }));
  };
  
  const handleMediumReductionChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, mediumReduction: value[0] / 100 }));
  };

  const handleLightReductionChange = (value: number[]) => {
    setInputs(prev => ({ ...prev, lightReduction: value[0] / 100 }));
  };

  const generateWorkout = async () => {
    // Form validation
    if (
      inputs.squatMax <= 0 || 
      inputs.primaryPressMax <= 0 || 
      inputs.deadliftMax <= 0 || 
      inputs.secondaryPressMax <= 0
    ) {
      toast.error("Please enter valid values for all lifts");
      return;
    }
    
    setIsLoading(true);
    try {
      const program = await calculateHLM(inputs);
      setWorkoutProgram(program);
      toast.success("HLM program generated successfully!");
    } catch (error) {
      toast.error("Failed to generate HLM program");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Andy Baker's HLM Program</h1>
          <p className="text-muted-foreground mt-2">
            Calculate your Heavy, Light, and Medium training days based on your one-rep maxes.
          </p>
        </div>
        
        <Card className="mb-8 border-border/50">
          <CardHeader>
            <CardTitle>Program Type</CardTitle>
            <CardDescription>
              Choose between standard HLM or alternate pressing HLM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={inputs.hlmType}
              onValueChange={(value) => handleHlmTypeChange(value as HlmType)}
              className="flex flex-col space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alternate" id="alternate" />
                <Label htmlFor="alternate">Alternate Pressing HLM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard HLM</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

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
                <Label htmlFor="squatMax">Squat (kg)</Label>
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
                <Label htmlFor="primaryPressMax">
                  {inputs.hlmType === 'standard' ? 'Bench Press' : 'Primary Press'} (kg)
                </Label>
                <Input
                  id="primaryPressMax"
                  name="primaryPressMax"
                  type="number"
                  value={inputs.primaryPressMax}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadliftMax">Deadlift (kg)</Label>
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
                <Label htmlFor="secondaryPressMax">
                  {inputs.hlmType === 'standard' ? 'Overhead Press' : 'Secondary Press'} (kg)
                </Label>
                <Input
                  id="secondaryPressMax"
                  name="secondaryPressMax"
                  type="number"
                  value={inputs.secondaryPressMax}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
            </div>

            {inputs.hlmType === 'alternate' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="heavySquatName">Squat Exercise Name</Label>
                    <Input
                      id="heavySquatName"
                      name="heavySquatName"
                      value={inputs.heavySquatName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="primaryPressName">Primary Press Name</Label>
                    <Input
                      id="primaryPressName"
                      name="primaryPressName"
                      value={inputs.primaryPressName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryPressName">Secondary Press Name</Label>
                    <Input
                      id="secondaryPressName"
                      name="secondaryPressName"
                      value={inputs.secondaryPressName}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="heavyPullName">Heavy Pull Name</Label>
                    <Input
                      id="heavyPullName"
                      name="heavyPullName"
                      value={inputs.heavyPullName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerText">Accessories</Label>
                  <Textarea
                    id="headerText"
                    name="headerText"
                    value={inputs.headerText}
                    onChange={handleInputChange}
                    placeholder={`2x6 Double Rope Chins
2x10 Chins`}
                    className="min-h-[100px] font-mono"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-4 pt-4">

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Medium Reduction: {(inputs.mediumReduction * 100).toFixed(1)}%</Label>
                </div>
                <Slider
                  value={[inputs.mediumReduction * 100]}
                  min={5}
                  max={20}
                  step={0.5}
                  onValueChange={handleMediumReductionChange}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <Label>Light Reduction: {(inputs.lightReduction * 100).toFixed(1)}%</Label>
                </div>
                <Slider
                  value={[inputs.lightReduction * 100]}
                  min={10}
                  max={30}
                  step={0.5}
                  onValueChange={handleLightReductionChange}
                />
              </div>
              
              <Button 
                onClick={generateWorkout} 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Generating..." : "Generate HLM Program"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {workoutProgram && <WorkoutDisplay workoutProgram={workoutProgram} />}
      </div>
    </Layout>
  );
};

export default HLMProgram;
