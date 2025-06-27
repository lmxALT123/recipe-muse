
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, Users, Trash2, Heart, ChefHat } from 'lucide-react';

export const SavedRecipes = ({ user }) => {
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  useEffect(() => {
    const recipes = JSON.parse(localStorage.getItem(`recipes_${user.id}`) || '[]');
    setSavedRecipes(recipes.reverse()); // Show newest first
  }, [user.id]);

  const deleteRecipe = (recipeId) => {
    const updatedRecipes = savedRecipes.filter(recipe => recipe.id !== recipeId);
    setSavedRecipes(updatedRecipes);
    localStorage.setItem(`recipes_${user.id}`, JSON.stringify(updatedRecipes.reverse()));
    
    if (selectedRecipe && selectedRecipe.id === recipeId) {
      setSelectedRecipe(null);
    }

    toast({
      title: "Recipe deleted",
      description: "Recipe removed from your collection.",
    });
  };

  if (savedRecipes.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-12 h-12 text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Saved Recipes Yet</h2>
          <p className="text-gray-600 mb-6">
            Start generating recipes and save your favorites to build your personal cookbook!
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Generate Your First Recipe
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Your Recipe Collection
        </h1>
        <p className="text-gray-600">
          {savedRecipes.length} delicious recipe{savedRecipes.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recipe List */}
        <div className="space-y-4">
          {savedRecipes.map((recipe) => (
            <Card 
              key={recipe.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedRecipe?.id === recipe.id 
                  ? 'ring-2 ring-orange-500 shadow-lg' 
                  : 'hover:ring-1 hover:ring-orange-200'
              }`}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-800 mb-2">
                      {recipe.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {recipe.cookingTime}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        {recipe.servings}
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
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 line-clamp-2">
                  Original request: "{recipe.prompt}"
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Saved {new Date(recipe.savedAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recipe Details */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {selectedRecipe ? (
            <Card className="shadow-xl border-0 bg-white">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-gray-800 mb-2">
                      {selectedRecipe.title}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {selectedRecipe.cookingTime}
                      </Badge>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        Serves {selectedRecipe.servings}
                      </Badge>
                    </div>
                  </div>
                  <Heart className="w-6 h-6 text-red-500 fill-current" />
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-gray-700">{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
                  <ol className="space-y-3">
                    {selectedRecipe.instructions.map((step, index) => (
                      <li key={index} className="flex space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Chef's Tips</h3>
                  <ul className="space-y-1">
                    {selectedRecipe.tips.map((tip, index) => (
                      <li key={index} className="text-gray-700 text-sm">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
              <CardContent className="text-center py-12">
                <ChefHat className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  Select a Recipe
                </h3>
                <p className="text-gray-600">
                  Click on any recipe from your collection to view the full details.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
