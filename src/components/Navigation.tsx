
import { Button } from '@/components/ui/button';
import { ChefHat, BookOpen, Sparkles, LogOut, User } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NavigationProps {
  user: SupabaseUser;
  onLogout: () => void;
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Navigation = ({ user, onLogout, currentView, onViewChange }: NavigationProps) => {
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-orange-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              RecipeMuse
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant={currentView === 'generator' ? 'default' : 'ghost'}
              onClick={() => onViewChange('generator')}
              className={currentView === 'generator' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50'}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate
            </Button>
            
            <Button
              variant={currentView === 'saved' ? 'default' : 'ghost'}
              onClick={() => onViewChange('saved')}
              className={currentView === 'saved' ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50'}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Saved
            </Button>

            <div className="flex items-center space-x-3 border-l border-orange-200 pl-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-orange-600" />
                </div>
                <span className="text-sm text-gray-700 hidden sm:inline">
                  {displayName}
                </span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onLogout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
