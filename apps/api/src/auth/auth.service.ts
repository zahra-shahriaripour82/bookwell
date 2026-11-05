import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from '@node-rs/argon2';
import { db } from '../index.js';
import { usersTable } from '../db/schema.js';
import { RegisterDto } from './dto/register.dto.js';

@Injectable()
export class AuthService {
  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();   
    const password_hash = await hash(dto.password);   

    try {
      const [user] = await db
        .insert(usersTable)
        .values({ email, password_hash, name: dto.name })
        .returning({ id: usersTable.id, email: usersTable.email, name: usersTable.name });
      return user;                              
    } catch (err) {
      const code = (err as { cause?: { code?: string } }).cause?.code;
      if (code === '23505') {                  
        throw new ConflictException('This email already has an account');
      }
      throw err;
    }
  }
}