
import { useState, useEffect } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { RecipeGenerator } from '@/components/RecipeGenerator';
import { Navigation } from '@/components/Navigation';
import { SavedRecipes } from '@/components/SavedRecipes';

const Index = () => {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('generator');

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('cookingAppUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('cookingAppUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cookingAppUser');
    setCurrentView('generator');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        <AuthForm onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <Navigation 
        user={user} 
        onLogout={handleLogout}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="container mx-auto px-4 py-8">
        {currentView === 'generator' && <RecipeGenerator user={user} />}
        {currentView === 'saved' && <SavedRecipes user={user} />}
      </main>
    </div>
  );
};

export default Index;
