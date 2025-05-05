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
    squatMax: 225,
    benchMax: 185,
    deadliftMax: 275,
    pressMax: 115,
    weeks: 4,
    hlmType: 'standard',
    heavySquatName: "Squat",
    primaryPressName: "OHP",
    secondaryPressName: "Bench Press",
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
      inputs.benchMax <= 0 || 
      inputs.deadliftMax <= 0 || 
      inputs.pressMax <= 0
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
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard HLM</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="alternate" id="alternate" />
                <Label htmlFor="alternate">Alternate Pressing HLM</Label>
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
                    placeholder="Enter accessories (one per line), e.g.:&#10;2x6 Double Rope Chins&#10;2x10 Chins"
                    className="min-h-[100px] font-mono"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Program Length (weeks): {inputs.weeks}</Label>
                </div>
                <Slider
                  value={[inputs.weeks]}
                  min={1}
                  max={12}
                  step={1}
                  onValueChange={handleWeeksChange}
                />
              </div>

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
