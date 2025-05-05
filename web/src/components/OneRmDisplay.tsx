
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

interface OneRmDisplayProps {
  onermTable: string;
}

const OneRmDisplay: React.FC<OneRmDisplayProps> = ({ onermTable }) => {
  const textRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = () => {
    if (textRef.current) {
      const text = textRef.current.innerText;
      navigator.clipboard.writeText(text).then(
        () => {
          toast.success("Workout plan copied to clipboard!");
        },
        (err) => {
          console.error('Could not copy text: ', err);
          toast.error("Failed to copy workout plan");
        }
      );
    }
  };

  const downloadTextFile = () => {
    if (textRef.current) {
      const text = textRef.current.innerText;
      const element = document.createElement("a");
      const file = new Blob([text], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = "workout_program.txt";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Workout plan downloaded!");
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border/50 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Generated 1RM Table</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            Copy to Clipboard
          </Button>
          <Button size="sm" onClick={downloadTextFile}>
            Download .txt
          </Button>
        </div>
      </div>
      <div className="workout-pre pre-scrollable">
        <pre ref={textRef}>{onermTable}</pre>
      </div>
    </div>
  );
};

export default OneRmDisplay;
