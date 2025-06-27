import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Clock, Users, ChefHat, Heart, Sparkles } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface RecipeGeneratorProps {
  user: User;
}

interface Recipe {
  id?: string;
  title: string;
  cooking_time: string;
  serving_size: string;
  ingredients: string[];
  instructions: string[];
  cooking_tips: string;
  prompt: string;
  cooking_type: 'normal' | 'long';
  created_at?: string;
}

export const RecipeGenerator = ({ user }: RecipeGeneratorProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cookingTime, setCookingTime] = useState<'normal' | 'long'>('normal');
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);

  const generateRecipe = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Please enter a recipe request",
        description: "Describe what you'd like to cook!",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate a creative recipe based on the prompt
    const recipe: Recipe = {
      title: generateTitle(prompt),
      cooking_time: cookingTime === 'normal' ? `${Math.floor(Math.random() * 25) + 15} minutes` : `${Math.floor(Math.random() * 3) + 1} hour${Math.random() > 0.5 ? 's' : ''}`,
      serving_size: `${Math.floor(Math.random() * 3) + 2}-${Math.floor(Math.random() * 3) + 4} people`,
      ingredients: generateIngredients(prompt),
      instructions: generateInstructions(prompt),
      cooking_tips: generateTips(prompt).join('. '),
      prompt: prompt,
      cooking_type: cookingTime
    };

    setCurrentRecipe(recipe);
    setIsGenerating(false);

    toast({
      title: "Recipe generated!",
      description: "Your delicious recipe is ready to cook.",
    });
  };

  const saveRecipe = async () => {
    if (!currentRecipe || !user) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          title: currentRecipe.title,
          description: currentRecipe.prompt,
          cooking_time: currentRecipe.cooking_time,
          serving_size: currentRecipe.serving_size,
          ingredients: currentRecipe.ingredients,
          instructions: currentRecipe.instructions,
          cooking_tips: currentRecipe.cooking_tips,
          cooking_type: currentRecipe.cooking_type,
          is_saved: true
        });

      if (error) {
        toast({
          title: "Error saving recipe",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Recipe saved!",
          description: "Added to your personal recipe collection.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive"
      });
    }
  };

  const generateTitle = (prompt: string) => {
    const keywords = prompt.toLowerCase().split(' ');
    const proteins = ['chicken', 'beef', 'pork', 'turkey', 'fish', 'tofu'];
    const styles = ['curry', 'stir-fry', 'soup', 'salad', 'pasta', 'rice'];
    
    let title = '';
    const foundProtein = proteins.find(p => keywords.includes(p));
    const foundStyle = styles.find(s => keywords.includes(s));
    
    if (foundProtein && foundStyle) {
      title = `${foundProtein.charAt(0).toUpperCase() + foundProtein.slice(1)} ${foundStyle.charAt(0).toUpperCase() + foundStyle.slice(1)}`;
    } else {
      title = prompt.split(' ').slice(0, 3).map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    }
    
    return title + ' Delight';
  };

  const generateIngredients = (prompt: string) => {
    const baseIngredients = [
      '2 tbsp olive oil',
      '1 medium onion, diced',
      '3 cloves garlic, minced',
      'Salt and pepper to taste'
    ];

    const keywords = prompt.toLowerCase();
    const extraIngredients = [];

    if (keywords.includes('chicken')) extraIngredients.push('1 lb chicken breast, cubed');
    if (keywords.includes('curry')) extraIngredients.push('2 tbsp curry powder', '1 can coconut milk');
    if (keywords.includes('pineapple')) extraIngredients.push('1 cup fresh pineapple chunks');
    if (keywords.includes('turkey')) extraIngredients.push('1 lb ground turkey');
    if (keywords.includes('rice')) extraIngredients.push('1 cup basmati rice');
    if (keywords.includes('vegetables')) extraIngredients.push('2 cups mixed vegetables');

    return [...baseIngredients, ...extraIngredients];
  };

  const generateInstructions = (prompt: string) => {
    return [
      'Heat olive oil in a large pan over medium-high heat.',
      'Add diced onion and cook until translucent, about 3-4 minutes.',
      'Add minced garlic and cook for another minute until fragrant.',
      'Add your main protein and cook until browned on all sides.',
      'Season with salt, pepper, and any spices mentioned in your request.',
      'Add any liquid ingredients and bring to a simmer.',
      'Reduce heat and let cook until flavors meld together.',
      'Taste and adjust seasoning as needed.',
      'Serve hot and enjoy your delicious creation!'
    ];
  };

  const generateTips = (prompt: string) => {
    const tips = [
      'For extra flavor, marinate your protein for 30 minutes before cooking.',
      'Fresh herbs added at the end will brighten up the dish.',
      'Don\'t overcrowd the pan - cook in batches if necessary.',
      'Let the dish rest for 5 minutes before serving to allow flavors to settle.'
    ];
    
    return tips.slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          What would you like to cook today?
        </h1>
        <p className="text-gray-600">
          Describe any dish and I'll create a personalized recipe just for you!
        </p>
      </div>

      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <span>Recipe Request</span>
          </CardTitle>
          <CardDescription>
            Be creative! Try "spicy chicken and pineapple curry" or "quick weeknight pasta"
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Textarea
            placeholder="I want to make..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px] text-lg"
          />

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cooking Time Preference</label>
              <div className="flex space-x-2">
                <Button
                  variant={cookingTime === 'normal' ? 'default' : 'outline'}
                  onClick={() => setCookingTime('normal')}
                  className={cookingTime === 'normal' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  Normal (15-30 min)
                </Button>
                <Button
                  variant={cookingTime === 'long' ? 'default' : 'outline'}
                  onClick={() => setCookingTime('long')}
                  className={cookingTime === 'long' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                >
                  Long (1+ hours)
                </Button>
              </div>
            </div>

            <div className="flex-1 flex justify-end items-end">
              <Button
                onClick={generateRecipe}
                disabled={isGenerating || !prompt.trim()}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold px-8 py-3 transition-all duration-200 transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <ChefHat className="w-4 h-4 mr-2 animate-spin" />
                    Cooking up magic...
                  </>
                ) : (
                  <>
                    <ChefHat className="w-4 h-4 mr-2" />
                    Generate Recipe
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentRecipe && (
        <Card className="shadow-xl border-0 bg-white">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-gray-800 mb-2">
                  {currentRecipe.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    <Clock className="w-3 h-3 mr-1" />
                    {currentRecipe.cooking_time}
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <Users className="w-3 h-3 mr-1" />
                    Serves {currentRecipe.serving_size}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={saveRecipe}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Heart className="w-4 h-4 mr-2" />
                Save Recipe
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {currentRecipe.ingredients.map((ingredient, index) => (
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
                {currentRecipe.instructions.map((step, index) => (
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
              <p className="text-gray-700 text-sm">{currentRecipe.cooking_tips}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
