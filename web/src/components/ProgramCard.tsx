
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProgramCardProps {
  title: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ title, description, path, icon }) => {
  return (
    <Card className="border border-border/50 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-secondary p-3 rounded-lg">
            {icon}
          </div>
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link to={path}>Select Program</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProgramCard;
