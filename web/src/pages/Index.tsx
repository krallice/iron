
import React from 'react';
import Layout from '@/components/Layout';
import ProgramCard from '@/components/ProgramCard';
import { Dumbbell, Calendar, Calculator } from 'lucide-react';

const Index = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Iron Calculator</h1>
        <p className="text-muted-foreground text-lg max-w-2xl text-center">
          Generate structured workout programs based on proven training systems.
        </p>
        <p className="text-muted-foreground text-lg max-w-2xl text-center">
          Calculate your workouts and export them to a text file.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <ProgramCard 
          title="Andy Baker's HLM"
          description="Heavy, Light, Medium programming based on your 1RM. A simple yet effective approach to strength training with three weekly sessions."
          path="/hlm"
          icon={<Dumbbell className="h-5 w-5" />}
        />
        
        <ProgramCard 
          title="Jim Wendler's 5/3/1"
          description="The time-tested progressive strength program with structured cycles. Four weekly sessions with primary lifts and assistance work."
          path="/531"
          icon={<Calendar className="h-5 w-5" />}
        />

        <ProgramCard 
          title="1RM Calculator"
          description="Calculate your 1RM using either the Brzycki, Epley or Lombardi formulae."
          path="/1rm"
          icon={<Calculator className="h-5 w-5" />}
        />
      </div>
      
      {/* <div className="mt-16 bg-secondary/30 rounded-lg p-6 max-w-4xl mx-auto border border-border/50">
        <h2 className="text-xl font-semibold mb-4">How to use the Iron Forge calculator</h2>
        <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
          <li>Select a workout program that fits your goals</li>
          <li>Enter your one-rep maxes for the main lifts</li>
          <li>Configure program-specific parameters</li>
          <li>Generate your personalized workout plan</li>
          <li>Copy or download your program as a text file</li>
        </ol>
      </div> */}
    </Layout>
  );
};

export default Index;
