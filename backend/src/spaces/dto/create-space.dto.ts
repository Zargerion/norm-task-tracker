import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSpaceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddSpaceMemberDto {
  @IsUUID()
  userId: string;

  @IsString()
  role: string;
}
