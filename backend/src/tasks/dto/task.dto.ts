import { IsArray, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  assigneeIds?: string[];
}

export class UpdateTaskStatusDto {
  @IsString()
  status: string;
}

export class AddAssigneeDto {
  @IsUUID()
  userId: string;
}

export class AddAdditionDto {
  @IsString()
  content: string;
}

export class TaskPositionItem {
  @IsUUID()
  id: string;

  @IsNumber()
  position: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskPositionItem)
  updates: TaskPositionItem[];
}
