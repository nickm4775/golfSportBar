import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'nuevo@mail.com', description: 'Email del nuevo usuario' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Secret123!', description: 'Contraseña (mín. 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Nuevo Usuario', description: 'Nombre completo' })
  @IsString()
  @MinLength(2)
  name!: string;
}

export class RefreshStaffDto {
  @ApiProperty({ description: 'Refresh token opaco emitido en login' })
  @IsString()
  @MinLength(16)
  refreshToken!: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@folf.local', description: 'Email del usuario' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin123!', description: 'Contraseña (mín. 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password!: string;
}
