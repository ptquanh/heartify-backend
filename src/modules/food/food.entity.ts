import { Column, Entity, PrimaryColumn } from 'typeorm';

import { AuditWithTimezone } from '@modules/audit/audit.entity';

@Entity('foods')
export class Food extends AuditWithTimezone {
  @PrimaryColumn({ name: 'hash_id', type: 'varchar' })
  hashId: string;

  @Column({ name: 'recipe_name', type: 'varchar', length: 255 })
  recipeName: string;

  @Column({ name: 'source', type: 'varchar', length: 255, nullable: true })
  source: string;

  @Column({ name: 'url', type: 'text', nullable: true })
  url: string;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'servings', type: 'float', nullable: true })
  servings: number;

  @Column({ name: 'calories', type: 'float', nullable: true })
  calories: number;

  @Column({ name: 'total_weight_g', type: 'float', nullable: true })
  totalWeightG: number;

  @Column({ name: 'diet_labels', type: 'jsonb', nullable: true })
  dietLabels: string[]; // Stored as JSON array

  @Column({ name: 'health_labels', type: 'jsonb', nullable: true })
  healthLabels: string[];

  @Column({ name: 'cautions', type: 'jsonb', nullable: true })
  cautions: string[];

  @Column({ name: 'cuisine_type', type: 'jsonb', nullable: true })
  cuisineType: string[];

  @Column({ name: 'meal_type', type: 'jsonb', nullable: true })
  mealType: string[];

  @Column({ name: 'dish_type', type: 'jsonb', nullable: true })
  dishType: string[];

  @Column({ name: 'ingredient_lines', type: 'jsonb', nullable: true })
  ingredientLines: string[];

  @Column({ name: 'ingredients', type: 'jsonb', nullable: true })
  ingredients: Record<string, any>[]; // Complex object structure

  @Column({ name: 'total_nutrients', type: 'jsonb', nullable: true })
  totalNutrients: Record<string, any>; // key-value map

  @Column({ name: 'daily_values', type: 'jsonb', nullable: true })
  dailyValues: Record<string, any>;

  @Column({ name: 'digest', type: 'jsonb', nullable: true })
  digest: Record<string, any>[];
}
