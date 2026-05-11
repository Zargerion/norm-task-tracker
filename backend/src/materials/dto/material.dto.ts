import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  type?: 'MARKDOWN' | 'HTML';

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  isSpaceWide?: boolean;
}

export class SetMaterialAccessDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  userIds: string[];
}
