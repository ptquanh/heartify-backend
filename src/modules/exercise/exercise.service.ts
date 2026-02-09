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

import { PaginationExercisePayloadDTO } from './dtos/exercise-payload.dto';
import { Exercise } from './exercise.entity';

@Injectable()
export class ExerciseService
  extends BaseCRUDService<Exercise>
  implements OnModuleInit
{
  private readonly logger = new Logger(ExerciseService.name);

  constructor(@InjectRepository(Exercise) repo: Repository<Exercise>) {
    super(repo);
  }

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const count = await this.count({});
    if (count > 0) {
      this.logger.log('Exercise data already exists. Skipping seed.');
      return;
    }

    this.logger.log('Seeding exercise data from CSV file...');

    const csvFilePath = path.join(process.cwd(), 'seeds', 'exercises.csv');

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
    let entities: Exercise[] = [];
    let isFirstLine = true;
    let totalProcessed = 0;

    for await (const line of rl) {
      if (isFirstLine) {
        isFirstLine = false;
        continue;
      }

      // 0: bodyPart, 1: equipment, 2: gifUrl, 3: id, 4: name, 5: target
      // 6...: secondaryMuscles/0... instructions/0...
      // The CSV seems to have variable columns for arrays?
      // Wait, looking at the CSV header:
      // bodyPart,equipment,gifUrl,id,name,target,secondaryMuscles/0,secondaryMuscles/1,instructions/0,instructions/1,instructions/2,instructions/3,instructions/4,instructions/5,secondaryMuscles/2,instructions/6,instructions/7,secondaryMuscles/3,instructions/8,secondaryMuscles/4,instructions/9,secondaryMuscles/5,instructions/10
      // It seems flat but somewhat structured.
      // Let's parse it carefully. safely grabbing what we can.
      // Actually, simple parsing by index might be brittle if columns shift.
      // But based on the header provided:
      // 0: bodyPart
      // 1: equipment
      // 2: gifUrl
      // 3: id
      // 4: name
      // 5: target
      // 6, 7, 14, 17, 19, 21: secondaryMuscles parts?
      // 8, 9, 10, 11, 12, 13, 15, 16, 18, 20, 22: instructions parts?

      // Let's implement dynamic collection since headers are named "secondaryMuscles/0", etc.
      // However, usually csv parsers just give values.
      // We can collect non-empty values from specific ranges or just grab the fixed columns first.

      const row = parseCsvLine(line);

      if (row.length < 6) {
        continue;
      }

      try {
        const secondaryMuscles: string[] = [];
        const instructions: string[] = [];

        // Based on header inspection:
        // indices 6, 7 are secondaryMuscles
        // indices 8-13 are instructions
        // index 14 is secondaryMuscles
        // indices 15-16 are instructions
        // index 17 is secondaryMuscles
        // index 18 is instructions
        // index 19 is secondaryMuscles
        // index 20 is instructions
        // index 21 is secondaryMuscles
        // index 22 is instructions

        // This interleaved structure is a bit odd.
        // Let's try to grab them by checking if they exist.
        // Or simpler: any column after index 5 that is not empty is likely one of them.
        // But we need to distinguish.
        // Let's blindly trust the header structure I saw in `view_file`.
        const smIndices = [6, 7, 14, 17, 19, 21];
        const instrIndices = [8, 9, 10, 11, 12, 13, 15, 16, 18, 20, 22];

        smIndices.forEach((idx) => {
          if (row[idx] && row[idx].trim())
            secondaryMuscles.push(row[idx].trim());
        });

        instrIndices.forEach((idx) => {
          if (row[idx] && row[idx].trim()) instructions.push(row[idx].trim());
        });

        // Some might be null/undefined if row is short
        const exercise = this.model.create({
          bodyPart: row[0],
          equipment: row[1],
          gifUrl: row[2],
          id: row[3], // id is at index 3
          name: row[4],
          target: row[5],
          secondaryMuscles,
          instructions,
        });

        entities.push(exercise);
      } catch (err) {
        this.logger.warn(`Failed to process row: ${err.message}`);
      }

      if (entities.length >= BATCH_SIZE) {
        await this.saveBatch(entities);
        totalProcessed += entities.length;
        this.logger.log(`Seeded ${totalProcessed} exercises...`);
        entities = [];
      }
    }

    if (entities.length > 0) {
      await this.saveBatch(entities);
      totalProcessed += entities.length;
    }

    this.logger.log(`Seeding complete. Total: ${totalProcessed}`);
  }

  async viewExerciseDetails(id: string): Promise<OperationResult> {
    const entity = await this.findOne({ id });

    if (!entity) {
      return generateNotFoundResult('Exercise not found with id: ' + id);
    }

    return {
      success: true,
      data: entity,
    };
  }

  async paginateExercises(
    dto: PaginationExercisePayloadDTO,
  ): Promise<OperationResult> {
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
