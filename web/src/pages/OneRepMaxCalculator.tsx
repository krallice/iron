import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { calculateHLM, HlmInputs } from '@/services/workoutService';
import { OneRepMaxInputs, calculateOneRepMax} from '@/services/oneRepMaxService';
import OneRmDisplay from '@/components/OneRmDisplay';
import { toast } from '@/components/ui/sonner';

const HLMProgram = () => {
  const [inputs, setInputs] = useState<OneRepMaxInputs>({
    reps: 5,
    weight: 100,
    formula: 'epley'
  });

  const [onermTable, setOnermTable] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setInputs(prev => ({ ...prev, [name]: numValue }));
    }
  };
  
  const generateOneRepMax = async () => {
    try {
      const response = await fetch('http://localhost:9000/calc/1rm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weight: inputs.weight,
          reps: inputs.reps,
          formula: inputs.formula
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate 1RM');
      }

      const result = await response.json();
      // Convert the result to a string format that WorkoutDisplay can handle
      const formattedResult = `${result.formatted_table}`;
      setOnermTable(formattedResult);
      toast.success("1RM calculated successfully!");
    } catch (error) {
      console.error('Error calculating 1RM:', error);
      toast.error("Failed to calculate 1RM. Please try again.");
    }
  };
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">1RM Calculator</h1>
          <p className="text-muted-foreground mt-2">
            Calculate your 1 Rep Max based on a specified formula.
          </p>
        </div>
        
        <Card className="mb-8 border-border/50">
          <CardHeader>
            <CardTitle>Enter Your Rep Maxes and Formula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight Lifted</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  value={inputs.weight}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  name="reps"
                  type="number"
                  value={inputs.reps}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="formula">Formula</Label>
                <Select value={inputs.formula} onValueChange={(value) => setInputs(prev => ({ ...prev, formula: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select formula" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="epley">Epley</SelectItem>
                    <SelectItem value="brzycki">Brzycki</SelectItem>
                    <SelectItem value="lombardi">Lombardi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
            </div>
            
            <div className="space-y-4 pt-4">

              <Button onClick={generateOneRepMax} className="w-full">
                Calculate 1RM
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {onermTable && <OneRmDisplay onermTable={onermTable} />}
      </div>
    </Layout>
  );
};

export default HLMProgram;
