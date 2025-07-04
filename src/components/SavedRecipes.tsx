
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, Users, Trash2, Heart, ChefHat } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SavedRecipesProps {
  user: User;
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  cooking_time: string;
  serving_size: string;
  ingredients: string[];
  instructions: string[];
  cooking_tips: string;
  created_at: string;
}

export const SavedRecipes = ({ user }: SavedRecipesProps) => {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedRecipes();
  }, [user.id]);

  const fetchSavedRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_saved', true)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error loading recipes",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSavedRecipes(data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load saved recipes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error deleting recipe",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setSavedRecipes(prev => prev.filter(recipe => recipe.id !== recipeId));
        
        if (selectedRecipe && selectedRecipe.id === recipeId) {
          setSelectedRecipe(null);
        }

        toast({
          title: "Recipe deleted",
          description: "Recipe removed from your collection.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recipe",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="text-center py-8 sm:py-12">
          <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading your recipes...</p>
        </div>
      </div>
    );
  }

  if (savedRecipes.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="text-center py-8 sm:py-12">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 sm:w-12 sm:h-12 text-orange-400" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">No Saved Recipes Yet</h2>
          <p className="text-gray-600 mb-6 text-xs sm:text-sm md:text-base px-4">
            Start generating recipes and save your favorites to build your personal cookbook!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6">
      {/* Header */}
      <div className="text-center space-y-1 sm:space-y-2 mb-6 sm:mb-8 pt-2 sm:pt-4">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Your Recipe Collection
        </h1>
        <p className="text-gray-600 text-xs sm:text-sm md:text-base">
          {savedRecipes.length} delicious recipe{savedRecipes.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {/* Mobile: Stack layout, Desktop: Side-by-side */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recipe List */}
        <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 lg:hidden mb-3 sm:mb-4">Your Recipes</h2>
          {savedRecipes.map((recipe) => (
            <Card 
              key={recipe.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg mx-1 sm:mx-0 ${
                selectedRecipe?.id === recipe.id 
                  ? 'ring-2 ring-orange-500 shadow-lg' 
                  : 'hover:ring-1 hover:ring-orange-200'
              }`}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6">
                <div className="flex justify-between items-start gap-2 sm:gap-3">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base md:text-lg text-gray-800 mb-2 break-words leading-tight">
                      {recipe.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                        <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{recipe.cooking_time}</span>
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{recipe.serving_size}</span>
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecipe(recipe.id);
                    }}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-4 md:px-6">
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words leading-relaxed">
                  Original request: "{recipe.description}"
                </p>
                <p className="text-xs text-gray-400 mt-1 sm:mt-2">
                  Saved {new Date(recipe.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recipe Details */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          {selectedRecipe ? (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 lg:hidden mb-3 sm:mb-4">Recipe Details</h2>
              <Card className="shadow-xl border-0 bg-white mx-1 sm:mx-0">
                <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-4 md:px-6">
                  <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl text-gray-800 mb-2 break-words leading-tight">
                        {selectedRecipe.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">
                          <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{selectedRecipe.cooking_time}</span>
                        </Badge>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                          <Users className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">Serves {selectedRecipe.serving_size}</span>
                        </Badge>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 fill-current flex-shrink-0" />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-4 md:px-6">
                  {/* Ingredients */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Ingredients</h3>
                    <ul className="space-y-1 sm:space-y-2">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700 text-xs sm:text-sm md:text-base break-words leading-relaxed">{ingredient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Instructions</h3>
                    <ol className="space-y-2 sm:space-y-3">
                      {selectedRecipe.instructions.map((step, index) => (
                        <li key={index} className="flex space-x-2 sm:space-x-3">
                          <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium mt-0.5">
                            {index + 1}
                          </span>
                          <span className="text-gray-700 text-xs sm:text-sm md:text-base break-words flex-1 leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Chef's Tips */}
                  <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">Chef's Tips</h3>
                    <p className="text-gray-700 text-xs sm:text-sm break-words leading-relaxed">{selectedRecipe.cooking_tips}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 lg:hidden mb-3 sm:mb-4">Select a Recipe</h2>
              <Card className="shadow-lg bg-gradient-to-br from-orange-50 to-amber-50 mx-1 sm:mx-0">
                <CardContent className="text-center py-6 sm:py-8 md:py-12 px-3 sm:px-4">
                  <ChefHat className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 text-orange-400 mx-auto mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-1 sm:mb-2">
                    Select a Recipe
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                    Click on any recipe from your collection to view the full details.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
