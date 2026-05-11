import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

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
