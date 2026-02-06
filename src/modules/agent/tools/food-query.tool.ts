import { DynamicStructuredTool } from '@langchain/core/tools';
import { DataSource } from 'typeorm';
import { z } from 'zod';

import { Food } from '@modules/food/food.entity';

const stringOrNumber = z.union([z.string(), z.number()]).transform((val) => {
  const parsed = Number(val);
  return isNaN(parsed) ? undefined : parsed;
});

export const createFoodQueryTool = (dataSource: DataSource) => {
  return new DynamicStructuredTool({
    name: 'search_foods',
    description:
      'Search for foods based on nutritional goals per serving (calories, protein, carbs, fat). Useful for diet planning and checking food info.',
    schema: z.object({
      name: z.string().optional().describe('Name of the food or recipe.'),
      limit: stringOrNumber.optional().describe('Limit results (default: 5).'),

      minCalories: stringOrNumber
        .optional()
        .describe('Min Calories per serving'),
      maxCalories: stringOrNumber
        .optional()
        .describe('Max Calories per serving'),

      minProtein: stringOrNumber
        .optional()
        .describe('Min Protein per serving (g)'),
      maxProtein: stringOrNumber
        .optional()
        .describe('Max Protein per serving (g)'),

      minCarbs: stringOrNumber.optional().describe('Min Carbs per serving (g)'),
      maxCarbs: stringOrNumber.optional().describe('Max Carbs per serving (g)'),

      minFat: stringOrNumber.optional().describe('Min Fat per serving (g)'),
      maxFat: stringOrNumber.optional().describe('Max Fat per serving (g)'),
    }),

    func: async ({
      name,
      limit = 5,
      minCalories,
      maxCalories,
      minProtein,
      maxProtein,
      minCarbs,
      maxCarbs,
      minFat,
      maxFat,
    }) => {
      try {
        const foodRepo = dataSource.getRepository(Food);
        const query = foodRepo.createQueryBuilder('food');

        if (name) {
          query.andWhere('food.recipeName ILike :name', { name: `%${name}%` });
        }

        if (minCalories !== undefined) {
          query.andWhere(
            '(food.calories / COALESCE(NULLIF(food.servings, 0), 1)) >= :minCal',
            { minCal: minCalories },
          );
        }
        if (maxCalories !== undefined) {
          query.andWhere(
            '(food.calories / COALESCE(NULLIF(food.servings, 0), 1)) <= :maxCal',
            { maxCal: maxCalories },
          );
        }

        // --- PROTEIN (Key: PROCNT) ---
        if (minProtein !== undefined) {
          query.andWhere(
            "((food.total_nutrients -> 'PROCNT' ->> 'quantity')::float / COALESCE(NULLIF(food.servings, 0), 1)) >= :minPro",
            { minPro: minProtein },
          );
        }
        if (maxProtein !== undefined) {
          query.andWhere(
            "((food.total_nutrients -> 'PROCNT' ->> 'quantity')::float / COALESCE(NULLIF(food.servings, 0), 1)) <= :maxPro",
            { maxPro: maxProtein },
          );
        }

        // --- CARBS (Key: CHOCDF) ---
        if (minCarbs !== undefined) {
          query.andWhere(
            "((food.total_nutrients -> 'CHOCDF' ->> 'quantity')::float / COALESCE(NULLIF(food.servings, 0), 1)) >= :minCarb",
            { minCarb: minCarbs },
          );
        }
        if (maxCarbs !== undefined) {
          query.andWhere(
            "((food.total_nutrients -> 'CHOCDF' ->> 'quantity')::float / COALESCE(NULLIF(food.servings, 0), 1)) <= :maxCarb",
            { maxCarb: maxCarbs },
          );
        }

        // --- FAT (Key: FAT) ---
        if (minFat !== undefined) {
          query.andWhere(
            "((food.total_nutrients -> 'FAT' ->> 'quantity')::float / COALESCE(NULLIF(food.servings, 0), 1)) >= :minFat",
            { minFat: minFat },
          );
        }
        if (maxFat !== undefined) {
          query.andWhere(
            "((food.total_nutrients -> 'FAT' ->> 'quantity')::float / COALESCE(NULLIF(food.servings, 0), 1)) <= :maxFat",
            { maxFat: maxFat },
          );
        }

        // 4. Execute Query
        const foods = await query
          .take(limit)
          .select([
            'food.recipeName',
            'food.calories',
            'food.servings',
            'food.totalNutrients',
            'food.url',
          ])
          .getMany();

        if (foods.length === 0) {
          return JSON.stringify({
            message: 'No foods found matching criteria.',
            data: [],
          });
        }

        const simplifiedFoods = foods.map((f) => {
          const servings = f.servings || 1;

          const getNutrient = (key: string) => {
            const val = f.totalNutrients?.[key]?.quantity || 0;
            return parseFloat((val / servings).toFixed(1));
          };

          return {
            name: f.recipeName,
            per_serving: {
              calories: parseFloat((f.calories / servings).toFixed(0)),
              protein_g: getNutrient('PROCNT'),
              carbs_g: getNutrient('CHOCDF'),
              fat_g: getNutrient('FAT'),
            },
            servings_per_recipe: f.servings,
            link: f.url,
          };
        });

        return JSON.stringify({ message: 'Success', data: simplifiedFoods });
      } catch (error) {
        console.error('Search Food Error:', error);
        return JSON.stringify({
          error: `Error searching foods: ${error.message}`,
        });
      }
    },
  });
};
