import { createHash } from 'crypto';
import * as fs from 'fs';
import { OperationResult } from 'mvc-common-toolkit';
import * as path from 'path';
import * as readline from 'readline';
import { Repository } from 'typeorm';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import {
  generateEmptyPaginationResult,
  generateNotFoundResult,
  generatePaginationResult,
} from '@shared/helpers/operation-result.helper';
import { parseCsvLine, safeJsonParse } from '@shared/helpers/parser.helper';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import { PaginationFoodPayloadDTO } from './dtos/food-payload.dto';
import { Food } from './food.entity';

@Injectable()
export class FoodService extends BaseCRUDService<Food> implements OnModuleInit {
  private readonly logger = new Logger(FoodService.name);

  constructor(@InjectRepository(Food) repo: Repository<Food>) {
    super(repo);
  }

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const count = await this.count({});
    if (count > 0) {
      this.logger.log('Food data already exists. Skipping seed.');
      return;
    }

    this.logger.log('Seeding food data from CSV file...');

    const csvFilePath = path.join(
      process.cwd(),
      'seeds',
      'recipes-with-nutrition.csv',
    );

    if (!fs.existsSync(csvFilePath)) {
      this.logger.error(`CSV file not found at ${csvFilePath}`);
      return;
    }

    const fileStream = fs.createReadStream(csvFilePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    const BATCH_SIZE = 100;
    let entities: Food[] = [];
    let isFirstLine = true;
    let totalProcessed = 0;

    for await (const line of rl) {
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }

      const row = parseCsvLine(line);

      if (row.length < 18) {
        continue;
      }

      try {
        const url = row[2];
        const hashId = createHash('sha256').update(url).digest('hex');

        const food = this.model.create({
          hashId,
          recipeName: row[0],
          source: row[1],
          url: url,
          servings: parseFloat(row[3]) || 0,
          calories: parseFloat(row[4]) || 0,
          totalWeightG: parseFloat(row[5]) || 0,
          imageUrl: row[6],
          dietLabels: safeJsonParse(row[7]),
          healthLabels: safeJsonParse(row[8]),
          cautions: safeJsonParse(row[9]),
          cuisineType: safeJsonParse(row[10]),
          mealType: safeJsonParse(row[11]),
          dishType: safeJsonParse(row[12]),
          ingredientLines: safeJsonParse(row[13]),
          ingredients: safeJsonParse(row[14]),
          totalNutrients: safeJsonParse(row[15]),
          dailyValues: safeJsonParse(row[16]),
          digest: safeJsonParse(row[17]),
        });

        entities.push(food);
      } catch (err) {
        this.logger.warn(`Failed to process row: ${err.message}`);
      }

      if (entities.length >= BATCH_SIZE) {
        await this.saveBatch(entities);
        totalProcessed += entities.length;
        this.logger.log(`Seeded ${totalProcessed} items...`);
        entities = [];
      }
    }

    if (entities.length > 0) {
      await this.saveBatch(entities);
      totalProcessed += entities.length;
    }

    this.logger.log(`Seeding complete. Total: ${totalProcessed}`);
  }

  async viewFoodDetails(id: string): Promise<OperationResult> {
    const entity = await this.findOne({ hashId: id });

    if (!entity) {
      return generateNotFoundResult('Food not found with id: ' + id);
    }

    return {
      success: true,
      data: entity,
    };
  }

  async paginateFoods(dto: PaginationFoodPayloadDTO): Promise<OperationResult> {
    const result = await this.paginate(dto);

    if (!result) {
      return generateEmptyPaginationResult();
    }

    return generatePaginationResult(
      result.rows,
      result.total,
      dto.offset,
      dto.limit,
    );
  }
}
