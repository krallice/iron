
import React from 'react';
import { Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border/50">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full animated-gradient flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Iron Forge</h1>
          </Link>
          <nav>
            <ul className="flex space-x-6">
              <li>
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/hlm" className="hover:text-primary transition-colors">
                  HLM
                </Link>
              </li>
              <li>
                <Link to="/531" className="hover:text-primary transition-colors">
                  5/3/1
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-8 px-4 animate-fade-in">
        {children}
      </main>
      <footer className="py-6 border-t border-border/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Iron Forge Workout Calculator. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Layout;
